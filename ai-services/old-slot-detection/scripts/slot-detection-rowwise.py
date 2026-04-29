"""
Row-wise parking slot detection from saved Hough line coordinates.

This version is designed for images like an angled parking lot where Hough
returns many fragmented/duplicate white parking-line segments.

Reads the line JSON produced by hough_system.py:
    output/lines/<image_stem>.json

Pipeline:
  1. Load saved Hough line coordinates.
  2. Merge duplicate/fragmented near-collinear line segments.
  3. Detect long near-horizontal row boundaries/separators.
  4. Cluster those boundaries into horizontal row-boundary bands.
  5. Build candidate parking rows from adjacent boundary bands.
  6. Assign short divider lines to the row they belong to.
  7. Merge duplicate dividers inside each row.
  8. Sort dividers left-to-right and create slot polygons from adjacent pairs.
  9. Optionally insert virtual dividers when a divider is missing.
 10. Save slot polygons to output/slots/<stem>.json and debug images.
"""

import cv2
import numpy as np
import os
import json
import sys
from pathlib import Path
from dataclasses import dataclass

# ============================================================================
# Parameters - tune here if needed
# ============================================================================

# Duplicate / fragment merge
MERGE_ANGLE_DEG = 10
MERGE_DIST_PX = 35        # was 22 — catches near-duplicate lines 5-30 px apart
MERGE_MAX_GAP_PX = 80     # was 45 — allows larger gaps in fragmented lines

# Boundary detection
HORIZONTAL_ANGLE_TOL_DEG = 22        # was 18 — slightly more tolerant of tilted rows
BOUNDARY_MIN_LENGTH_RATIO = 0.15     # was 0.20 — catches shorter boundary fragments
BOUNDARY_MIN_LENGTH_PX = 150         # was 180
BOUNDARY_BAND_TOL_PX = 60            # was 38 — clusters spread-out boundary fragments

# Row construction
MIN_ROW_HEIGHT_PX = 55
MAX_ROW_HEIGHT_RATIO = 0.55          # was 0.42 — allow taller rows
ROW_ASSIGN_MARGIN_PX = 40            # was 35
MIN_DIVIDERS_PER_ROW = 2             # was 3 — less strict

# Divider handling
DIVIDER_MIN_LENGTH_PX = 22
DIVIDER_MERGE_DIST_PX = 40           # was 30 — better within-row duplicate merging
# Dividers longer than this multiple of their row height span multiple rows and are dropped
DIVIDER_MAX_ROW_HEIGHT_FACTOR = 1.8
INSERT_MISSING_DIVIDERS = True
MISSING_DIVIDER_GAP_FACTOR = 1.65    # if gap > factor * median gap, insert virtual divider(s)
MAX_VIRTUAL_DIVIDERS_PER_GAP = 3

# Slot sanity checks
MIN_SLOT_AREA = 1200
MAX_SLOT_AREA_RATIO = 0.18           # relative to image area
MAX_ASPECT_RATIO = 7.5
MIN_SLOT_WIDTH_PX = 25

# Paths
OUTPUT_DIR = "output"
LINES_DIR = os.path.join(OUTPUT_DIR, "lines")
SLOTS_DIR = os.path.join(OUTPUT_DIR, "slots")
DEBUG_DIR = os.path.join(OUTPUT_DIR, "debug", "slots")


@dataclass
class ParkingRow:
    row_id: int
    top_boundary: tuple
    bottom_boundary: tuple
    dividers: list


# ============================================================================
# Loading saved Hough output
# ============================================================================

def load_lines_json(stem):
    path = os.path.join(LINES_DIR, f"{stem}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def lines_from_data(data):
    return [(int(l["x1"]), int(l["y1"]), int(l["x2"]), int(l["y2"])) for l in data["lines"]]


# ============================================================================
# Geometry helpers
# ============================================================================

def line_length(line):
    x1, y1, x2, y2 = line
    return float(np.hypot(x2 - x1, y2 - y1))


def line_midpoint(line):
    x1, y1, x2, y2 = line
    return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)


def line_angle_deg(line):
    x1, y1, x2, y2 = line
    return float(np.degrees(np.arctan2(y2 - y1, x2 - x1)) % 180)


def angle_diff_deg(a, b):
    d = abs(a - b) % 180
    return min(d, 180 - d)


def is_near_horizontal(line, tol=HORIZONTAL_ANGLE_TOL_DEG):
    a = line_angle_deg(line)
    return a <= tol or a >= 180 - tol


def line_direction_unit(line):
    x1, y1, x2, y2 = line
    dx, dy = x2 - x1, y2 - y1
    n = np.hypot(dx, dy)
    if n < 1e-6:
        return np.array([1.0, 0.0])
    return np.array([dx / n, dy / n], dtype=float)


def line_to_normal_form(line):
    x1, y1, x2, y2 = line
    d = line_direction_unit(line)
    nx, ny = -d[1], d[0]
    rho = nx * x1 + ny * y1
    # keep normal sign stable so opposite directions do not flip rho
    if rho < 0:
        rho = -rho
        nx, ny = -nx, -ny
    return float(rho), np.array([nx, ny], dtype=float)


def perpendicular_distance(line_a, line_b):
    rho_a, _ = line_to_normal_form(line_a)
    rho_b, _ = line_to_normal_form(line_b)
    return abs(rho_a - rho_b)


def projection_range(line, direction):
    pts = np.array([[line[0], line[1]], [line[2], line[3]]], dtype=float)
    vals = pts @ direction
    return float(vals.min()), float(vals.max())


def projection_gap(line_a, line_b, direction):
    a0, a1 = projection_range(line_a, direction)
    b0, b1 = projection_range(line_b, direction)
    if a1 < b0:
        return b0 - a1
    if b1 < a0:
        return a0 - b1
    return 0.0


def merge_cluster_to_line(cluster):
    """Return one representative segment spanning all projected endpoints."""
    if len(cluster) == 1:
        return tuple(int(v) for v in cluster[0])

    # Average orientation using doubled-angle trick for 0/180 wrap.
    angles = [np.radians(line_angle_deg(l) * 2.0) for l in cluster]
    avg_angle = 0.5 * np.arctan2(np.mean(np.sin(angles)), np.mean(np.cos(angles)))
    direction = np.array([np.cos(avg_angle), np.sin(avg_angle)], dtype=float)

    pts = []
    for x1, y1, x2, y2 in cluster:
        pts.append([x1, y1])
        pts.append([x2, y2])
    pts = np.array(pts, dtype=float)
    center = pts.mean(axis=0)

    offsets = (pts - center) @ direction
    p1 = center + offsets.min() * direction
    p2 = center + offsets.max() * direction
    return (int(round(p1[0])), int(round(p1[1])), int(round(p2[0])), int(round(p2[1])))


def merge_collinear_segments(lines):
    """
    Merge only truly collinear/overlapping fragments.
    This avoids merging separate parking dividers that are parallel but belong
    to different slots.
    """
    lines = [l for l in lines if line_length(l) >= 5]
    lines = sorted(lines, key=line_length, reverse=True)

    clusters = []
    cluster_reps = []   # updated representative after every merge

    for line in lines:
        placed = False
        a = line_angle_deg(line)
        d = line_direction_unit(line)
        for ci, cluster in enumerate(clusters):
            ref = cluster_reps[ci]  # use the current representative, not cluster[0]
            if angle_diff_deg(a, line_angle_deg(ref)) > MERGE_ANGLE_DEG:
                continue
            if perpendicular_distance(line, ref) > MERGE_DIST_PX:
                continue
            # Require overlap or a small gap along the representative's direction.
            ref_dir = line_direction_unit(ref)
            if projection_gap(line, ref, ref_dir) > MERGE_MAX_GAP_PX:
                continue
            cluster.append(line)
            cluster_reps[ci] = merge_cluster_to_line(cluster)  # keep rep current
            placed = True
            break
        if not placed:
            clusters.append([line])
            cluster_reps.append(line)

    return [merge_cluster_to_line(c) for c in clusters]


def line_y_at_x(line, x):
    x1, y1, x2, y2 = line
    if abs(x2 - x1) < 1e-6:
        return (y1 + y2) / 2.0
    t = (x - x1) / (x2 - x1)
    return y1 + t * (y2 - y1)


def line_x_at_y(line, y):
    x1, y1, x2, y2 = line
    if abs(y2 - y1) < 1e-6:
        return (x1 + x2) / 2.0
    t = (y - y1) / (y2 - y1)
    return x1 + t * (x2 - x1)


def line_intersection(line_a, line_b):
    x1, y1, x2, y2 = line_a
    x3, y3, x4, y4 = line_b
    denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if abs(denom) < 1e-6:
        return None
    px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom
    py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom
    return (int(round(px)), int(round(py)))


def quad_area(quad):
    return float(abs(cv2.contourArea(np.array(quad, dtype=np.float32))))


def order_quad_points(pts):
    """Return points in TL, TR, BR, BL order."""
    pts = np.array(pts, dtype=np.float32)
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).reshape(-1)
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmin(diff)]
    bl = pts[np.argmax(diff)]
    return [(int(tl[0]), int(tl[1])), (int(tr[0]), int(tr[1])),
            (int(br[0]), int(br[1])), (int(bl[0]), int(bl[1]))]


# ============================================================================
# Boundary and row detection
# ============================================================================

def split_boundaries_and_candidates(lines, image_shape):
    h, w = image_shape[:2]
    min_boundary_len = max(BOUNDARY_MIN_LENGTH_PX, BOUNDARY_MIN_LENGTH_RATIO * w)

    boundaries = []
    divider_candidates = []

    for line in lines:
        length = line_length(line)
        if is_near_horizontal(line) and length >= min_boundary_len:
            boundaries.append(line)
        elif length >= DIVIDER_MIN_LENGTH_PX:
            divider_candidates.append(line)

    return boundaries, divider_candidates


def cluster_boundary_bands(boundaries):
    """
    Merge long row-boundary fragments into horizontal bands.
    Each band becomes one representative boundary line.
    """
    if not boundaries:
        return []

    # sort by midpoint y, then greedily cluster y-near fragments
    sorted_lines = sorted(boundaries, key=lambda l: line_midpoint(l)[1])
    bands = []
    for line in sorted_lines:
        _, my = line_midpoint(line)
        placed = False
        for band in bands:
            band_y = np.mean([line_midpoint(l)[1] for l in band])
            if abs(my - band_y) <= BOUNDARY_BAND_TOL_PX:
                band.append(line)
                placed = True
                break
        if not placed:
            bands.append([line])

    reps = [merge_cluster_to_line(b) for b in bands]
    return sorted(reps, key=lambda l: line_midpoint(l)[1])


def horizontal_overlap_ratio(line_a, line_b):
    ax0, ax1 = sorted([line_a[0], line_a[2]])
    bx0, bx1 = sorted([line_b[0], line_b[2]])
    overlap = max(0, min(ax1, bx1) - max(ax0, bx0))
    small = max(1, min(ax1 - ax0, bx1 - bx0))
    return overlap / small


def build_candidate_rows(boundary_bands, image_shape):
    h, _ = image_shape[:2]
    max_row_height = MAX_ROW_HEIGHT_RATIO * h
    rows = []

    for i in range(len(boundary_bands) - 1):
        top = boundary_bands[i]
        bottom = boundary_bands[i + 1]
        _, y_top = line_midpoint(top)
        _, y_bottom = line_midpoint(bottom)
        row_h = y_bottom - y_top

        if row_h < MIN_ROW_HEIGHT_PX or row_h > max_row_height:
            continue
        if horizontal_overlap_ratio(top, bottom) < 0.25:
            continue

        rows.append(ParkingRow(row_id=len(rows) + 1, top_boundary=top, bottom_boundary=bottom, dividers=[]))

    return rows


def divider_belongs_to_row(divider, row):
    cx, cy = line_midpoint(divider)
    y_top = line_y_at_x(row.top_boundary, cx)
    y_bottom = line_y_at_x(row.bottom_boundary, cx)
    lo, hi = sorted([y_top, y_bottom])
    return (lo - ROW_ASSIGN_MARGIN_PX) <= cy <= (hi + ROW_ASSIGN_MARGIN_PX)


def assign_dividers_to_rows(rows, divider_candidates):
    for row in rows:
        row.dividers = []

    for divider in divider_candidates:
        matches = []
        cx, cy = line_midpoint(divider)
        div_len = line_length(divider)
        for row in rows:
            if divider_belongs_to_row(divider, row):
                y_top = line_y_at_x(row.top_boundary, cx)
                y_bottom = line_y_at_x(row.bottom_boundary, cx)
                row_height = abs(y_bottom - y_top)
                # Drop dividers that are much longer than the row is tall —
                # they almost certainly span two rows and would form bad slots.
                if row_height > 0 and div_len > DIVIDER_MAX_ROW_HEIGHT_FACTOR * row_height:
                    continue
                mid_y = (y_top + y_bottom) / 2.0
                matches.append((abs(cy - mid_y), row))
        if matches:
            matches.sort(key=lambda x: x[0])
            matches[0][1].dividers.append(divider)

    return [r for r in rows if len(r.dividers) >= MIN_DIVIDERS_PER_ROW]


# ============================================================================
# Row-wise divider cleanup and slot formation
# ============================================================================

def row_direction(row):
    """Average direction of row boundaries, forced left-to-right."""
    d1 = line_direction_unit(row.top_boundary)
    d2 = line_direction_unit(row.bottom_boundary)
    d = d1 + d2
    if np.hypot(d[0], d[1]) < 1e-6:
        d = np.array([1.0, 0.0])
    d = d / np.hypot(d[0], d[1])
    if d[0] < 0:
        d = -d
    return d


def divider_position(row, divider):
    """Projection position used for left-to-right sorting inside a row."""
    d = row_direction(row)
    cx, cy = line_midpoint(divider)
    return float(cx * d[0] + cy * d[1])


def merge_dividers_inside_row(row):
    """Collapse duplicate divider detections inside the same row."""
    if not row.dividers:
        return []

    divs = sorted(row.dividers, key=lambda l: divider_position(row, l))
    clusters = []
    for div in divs:
        pos = divider_position(row, div)
        placed = False
        for cluster in clusters:
            cpos = np.mean([divider_position(row, l) for l in cluster])
            if abs(pos - cpos) <= DIVIDER_MERGE_DIST_PX:
                cluster.append(div)
                placed = True
                break
        if not placed:
            clusters.append([div])

    merged = [merge_cluster_to_line(c) for c in clusters]
    return sorted(merged, key=lambda l: divider_position(row, l))


def average_divider_angle(dividers):
    if not dividers:
        return np.radians(80)
    angles = [np.radians(line_angle_deg(l) * 2.0) for l in dividers]
    return 0.5 * np.arctan2(np.mean(np.sin(angles)), np.mean(np.cos(angles)))


def make_virtual_divider(row, target_pos, angle_rad):
    drow = row_direction(row)
    # Find a point at the target projection near the row center.
    top_mid = np.array(line_midpoint(row.top_boundary), dtype=float)
    bot_mid = np.array(line_midpoint(row.bottom_boundary), dtype=float)
    center = (top_mid + bot_mid) / 2.0
    current_pos = center @ drow
    center = center + (target_pos - current_pos) * drow

    direction = np.array([np.cos(angle_rad), np.sin(angle_rad)], dtype=float)
    long_line = (
        int(round(center[0] - 3000 * direction[0])),
        int(round(center[1] - 3000 * direction[1])),
        int(round(center[0] + 3000 * direction[0])),
        int(round(center[1] + 3000 * direction[1])),
    )

    p_top = line_intersection(long_line, row.top_boundary)
    p_bottom = line_intersection(long_line, row.bottom_boundary)
    if p_top is None or p_bottom is None:
        return long_line
    return (p_top[0], p_top[1], p_bottom[0], p_bottom[1])


def insert_missing_dividers(row, dividers):
    if not INSERT_MISSING_DIVIDERS or len(dividers) < 3:
        return dividers

    positions = [divider_position(row, d) for d in dividers]
    gaps = np.diff(positions)
    if len(gaps) == 0:
        return dividers

    # Use only normal-ish gaps for median; huge gaps are probably missing dividers.
    median_gap = float(np.median(gaps))
    if median_gap <= 1:
        return dividers

    angle_rad = average_divider_angle(dividers)
    new_dividers = []
    for i, div in enumerate(dividers[:-1]):
        new_dividers.append(div)
        gap = positions[i + 1] - positions[i]
        if gap > MISSING_DIVIDER_GAP_FACTOR * median_gap:
            missing_count = int(round(gap / median_gap)) - 1
            missing_count = max(0, min(missing_count, MAX_VIRTUAL_DIVIDERS_PER_GAP))
            for k in range(missing_count):
                target = positions[i] + (k + 1) * gap / (missing_count + 1)
                new_dividers.append(make_virtual_divider(row, target, angle_rad))
    new_dividers.append(dividers[-1])

    return sorted(new_dividers, key=lambda l: divider_position(row, l))


def slot_from_divider_pair(row, left_div, right_div):
    tl = line_intersection(left_div, row.top_boundary)
    tr = line_intersection(right_div, row.top_boundary)
    br = line_intersection(right_div, row.bottom_boundary)
    bl = line_intersection(left_div, row.bottom_boundary)
    if None in (tl, tr, br, bl):
        return None
    return order_quad_points([tl, tr, br, bl])


def is_valid_slot(quad, image_shape):
    h, w = image_shape[:2]
    area = quad_area(quad)
    if area < MIN_SLOT_AREA:
        return False
    if area > MAX_SLOT_AREA_RATIO * w * h:
        return False

    pts = np.array(quad, dtype=np.float32)
    rect = cv2.minAreaRect(pts)
    (_, _), (rw, rh), _ = rect
    if min(rw, rh) < 1:
        return False
    if max(rw, rh) / min(rw, rh) > MAX_ASPECT_RATIO:
        return False

    # Ensure at least some horizontal width.
    xs = [p[0] for p in quad]
    if max(xs) - min(xs) < MIN_SLOT_WIDTH_PX:
        return False

    # Allow small out-of-image tolerance, because intersections can land a few px out.
    margin = 50
    for x, y in quad:
        if x < -margin or x > w + margin or y < -margin or y > h + margin:
            return False
    return True


def form_slots_for_rows(rows, image_shape):
    all_slots = []
    cleaned_rows = []

    for row in rows:
        merged_dividers = merge_dividers_inside_row(row)
        completed_dividers = insert_missing_dividers(row, merged_dividers)
        row.dividers = completed_dividers
        cleaned_rows.append(row)

        for i in range(len(completed_dividers) - 1):
            quad = slot_from_divider_pair(row, completed_dividers[i], completed_dividers[i + 1])
            if quad is None:
                continue
            if not is_valid_slot(quad, image_shape):
                continue
            all_slots.append({
                "row_id": row.row_id,
                "corners": quad,
                "left_divider_index": i,
                "right_divider_index": i + 1,
            })

    return all_slots, cleaned_rows


# ============================================================================
# Visualization
# ============================================================================

def draw_line_list(img, lines, color, thickness=2):
    out = img.copy()
    for line in lines:
        x1, y1, x2, y2 = [int(v) for v in line]
        cv2.line(out, (x1, y1), (x2, y2), color, thickness)
    return out


def draw_debug_classification(img, boundaries, boundary_bands, divider_candidates, rows):
    out = img.copy()

    # Raw merged long boundaries - blue
    for line in boundaries:
        cv2.line(out, (line[0], line[1]), (line[2], line[3]), (255, 0, 0), 2)

    # Boundary band representatives - cyan/yellow
    for i, line in enumerate(boundary_bands):
        cv2.line(out, (line[0], line[1]), (line[2], line[3]), (255, 255, 0), 3)
        mx, my = line_midpoint(line)
        cv2.putText(out, f"B{i+1}", (int(mx), int(my) - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 4)
        cv2.putText(out, f"B{i+1}", (int(mx), int(my) - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    # Candidate dividers - red
    for line in divider_candidates:
        cv2.line(out, (line[0], line[1]), (line[2], line[3]), (0, 0, 255), 2)

    # Valid row boundaries - green overlay
    for row in rows:
        for line in [row.top_boundary, row.bottom_boundary]:
            cv2.line(out, (line[0], line[1]), (line[2], line[3]), (0, 255, 0), 3)
        tx, ty = line_midpoint(row.top_boundary)
        bx, by = line_midpoint(row.bottom_boundary)
        cv2.putText(out, f"ROW {row.row_id}", (int((tx + bx) / 2), int((ty + by) / 2)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 5)
        cv2.putText(out, f"ROW {row.row_id}", (int((tx + bx) / 2), int((ty + by) / 2)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    return out


def draw_slots(img, slots, rows):
    out = img.copy()

    # draw row boundaries and final dividers
    for row in rows:
        cv2.line(out, (row.top_boundary[0], row.top_boundary[1]), (row.top_boundary[2], row.top_boundary[3]), (255, 255, 0), 3)
        cv2.line(out, (row.bottom_boundary[0], row.bottom_boundary[1]), (row.bottom_boundary[2], row.bottom_boundary[3]), (255, 255, 0), 3)
        for d in row.dividers:
            cv2.line(out, (d[0], d[1]), (d[2], d[3]), (0, 0, 255), 2)

    # draw slots
    for idx, slot in enumerate(slots, start=1):
        quad = slot["corners"]
        pts = np.array(quad, dtype=np.int32)
        cv2.polylines(out, [pts], isClosed=True, color=(0, 255, 255), thickness=2)
        cx = int(np.mean([p[0] for p in quad]))
        cy = int(np.mean([p[1] for p in quad]))
        cv2.putText(out, str(idx), (cx - 10, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 5)
        cv2.putText(out, str(idx), (cx - 10, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    return out


# ============================================================================
# Saving
# ============================================================================

def save_slots(image_path, slots, rows, line_data):
    os.makedirs(SLOTS_DIR, exist_ok=True)
    stem = Path(image_path).stem
    path = os.path.join(SLOTS_DIR, f"{stem}.json")

    slot_records = []
    for i, slot in enumerate(slots, start=1):
        slot_records.append({
            "id": i,
            "row_id": int(slot["row_id"]),
            "corners": [list(p) for p in slot["corners"]],
        })

    row_records = []
    for row in rows:
        row_records.append({
            "row_id": row.row_id,
            "top_boundary": list(row.top_boundary),
            "bottom_boundary": list(row.bottom_boundary),
            "divider_count": len(row.dividers),
            "dividers": [list(d) for d in row.dividers],
        })

    payload = {
        "image": str(image_path),
        "image_size": line_data.get("image_size", [0, 0]),
        "source_lines_file": f"{stem}.json",
        "algorithm": "rowwise_boundary_divider_intersections",
        "row_count": len(row_records),
        "slot_count": len(slot_records),
        "rows": row_records,
        "slots": slot_records,
    }

    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"  Saved {len(slot_records)} slots to {path}")


# ============================================================================
# Main
# ============================================================================

def prompt_image_path():
    while True:
        path = input("Enter image path: ").strip().strip('"').strip("'")
        if not path:
            continue
        if not os.path.exists(path):
            print(f"  File not found: {path}")
            continue
        return path


def main():
    print("=" * 72)
    print("  Row-wise Parking Slot Detection from saved Hough coordinates")
    print("=" * 72)

    image_path = prompt_image_path()
    stem = Path(image_path).stem

    line_data = load_lines_json(stem)
    if line_data is None:
        print(f"\nNo saved lines found at {LINES_DIR}/{stem}.json")
        print("Run hough_system.py on this image first to generate them.")
        sys.exit(1)

    lines = lines_from_data(line_data)
    print(f"\n  Loaded {len(lines)} raw Hough lines (mode: {line_data.get('mode', 'unknown')})")

    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: could not read {image_path}")
        sys.exit(1)

    os.makedirs(DEBUG_DIR, exist_ok=True)

    # 1. Merge fragments/duplicates
    print("\n1. Merging duplicate / fragmented collinear line segments...")
    merged = merge_collinear_segments(lines)
    print(f"   {len(merged)} lines after merge (was {len(lines)})")
    cv2.imwrite(os.path.join(DEBUG_DIR, f"{stem}_1_merged.png"), draw_line_list(img, merged, (0, 0, 255), 2))

    # 2. Split long row boundaries from short divider candidates
    print("2. Detecting long row boundaries and short divider candidates...")
    boundaries, divider_candidates = split_boundaries_and_candidates(merged, img.shape)
    print(f"   {len(boundaries)} long boundary candidates")
    print(f"   {len(divider_candidates)} divider candidates")

    # 3. Cluster row boundary bands
    print("3. Clustering boundary fragments into boundary bands...")
    boundary_bands = cluster_boundary_bands(boundaries)
    print(f"   {len(boundary_bands)} boundary bands")

    # 4. Build candidate rows from adjacent boundary bands
    print("4. Building parking rows from adjacent boundary bands...")
    rows = build_candidate_rows(boundary_bands, img.shape)
    print(f"   {len(rows)} candidate rows before divider assignment")

    # 5. Assign dividers to rows
    print("5. Assigning dividers to the row they belong to...")
    rows = assign_dividers_to_rows(rows, divider_candidates)
    print(f"   {len(rows)} valid rows after divider assignment")
    for row in rows:
        print(f"   Row {row.row_id}: {len(row.dividers)} raw dividers")

    classified = draw_debug_classification(img, boundaries, boundary_bands, divider_candidates, rows)
    cv2.imwrite(os.path.join(DEBUG_DIR, f"{stem}_2_classified_rows.png"), classified)

    # 6. Form slots row-by-row
    print("6. Forming slots row-by-row from adjacent dividers...")
    slots, cleaned_rows = form_slots_for_rows(rows, img.shape)
    print(f"   {len(slots)} valid slots")
    for row in cleaned_rows:
        count = sum(1 for s in slots if s["row_id"] == row.row_id)
        print(f"   Row {row.row_id}: {len(row.dividers)} final dividers -> {count} slots")

    final = draw_slots(img, slots, cleaned_rows)
    if line_data.get("roi"):
        cv2.polylines(final, [np.array(line_data["roi"], dtype=np.int32)], isClosed=True, color=(0, 255, 0), thickness=2)

    out_path = os.path.join(OUTPUT_DIR, f"{stem}_slots.png")
    cv2.imwrite(out_path, final)
    cv2.imwrite(os.path.join(DEBUG_DIR, f"{stem}_3_final_slots.png"), final)

    save_slots(image_path, slots, cleaned_rows, line_data)

    print("\n" + "=" * 72)
    print(f"  Detected {len(slots)} parking slots")
    print(f"  Final output: {out_path}")
    print(f"  Slot coords:  {SLOTS_DIR}/{stem}.json")
    print(f"  Debug stages: {DEBUG_DIR}/")
    print("=" * 72)


if __name__ == "__main__":
    main()
