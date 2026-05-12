"""
slot_definer.py
Run directly: python slot_definer.py <image_id> [lot_id]

Reads the line segments saved by lsd.py and builds parking slot polygons
from them. Outputs a JSON layout file and an interactive debug viewer.

Pipeline (per ROI):
  1. Load lines JSON written by lsd.py
  2. Warp the ROI to a bird's-eye view (perspective correction)
  3. Classify lines into boundaries (row edges) and dividers (slot separators)
  4. Merge boundary fragments into full-width row lines
  5. Pair consecutive boundaries to form rows
  6. Find dividers per row and build slot polygons in warped space
  7. Unwarp slots back to original image coordinates
  8. Clip slots to ROI boundary

Outputs:
  data/layouts/<lot_id>_auto_slots.json   — slot polygons + metadata
  output/debug/slot_definer/<lot_id>/     — debug image per pipeline stage

Dependencies:
  - lsd.py must be run first to produce output/lines/<image_id>.json
  - shapely (pip install shapely) for polygon clipping

Viewer controls:
    N / Space / Enter   next step
    P / Backspace       previous step
    Q / Esc             quit
"""

import cv2
import numpy as np
import json
import os
import sys
from shapely.geometry import Polygon as ShapelyPolygon


# ── Slot-building parameters ──────────────────────────────────────────────────
# Angle is measured as degrees from horizontal, range [0, 90].
# 0° = perfectly horizontal, 90° = perfectly vertical.
#
# BOUNDARY_ANGLE_MAX / DIVIDER_ANGLE_MIN are AUTO-DETECTED from the line
# population (see infer_angle_split()).  The values below are fallbacks used
# when auto-detection cannot find two clear clusters.
BOUNDARY_ANGLE_MAX    = 30    # fallback: lines below this are row boundaries
DIVIDER_ANGLE_MIN     = 40    # fallback: lines above this are slot dividers
CLUSTER_TOLERANCE     = 15    # px — merge parallel lines closer than this
BOUNDARY_MIN_LENGTH_W = 0.05  # minimum merged-cluster span as fraction of warped width
                               # (kept small so fragments survive to the merge step)
MIN_ROW_FRAC          = 0.04  # row must be >= this fraction of warped height
MAX_ROW_FRAC          = 0.99  # row must be <= this fraction of warped height
DIVIDER_ROW_OVERLAP   = 0.30  # divider must cover >= this fraction of a row's height
MIN_SLOT_WIDTH_PX     = 20    # minimum slot width in warped pixels
VIRTUAL_EDGE_TOL      = 0.50  # tolerance for adding virtual edge dividers
INFER_MISSING_BOUNDARY = True  # synthesise a boundary when a double-height gap is found
MIN_ROW_HEIGHT_FRAC   = 0.40  # drop rows shorter than this fraction of the tallest row
                               # — removes narrow false rows from curb/rail lines

# ── Paths ─────────────────────────────────────────────────────────────────────
IMAGES_DIR = os.path.join("data", "blueprints")
LINES_DIR  = os.path.join("output", "lines")
LAYOUT_DIR = os.path.join("data", "layouts")
DEBUG_BASE = os.path.join("output", "debug", "slot_definer")


# ══════════════════════════════════════════════════════════════════════════════
# Load lines saved by lsd.py / hough_system.py
# ══════════════════════════════════════════════════════════════════════════════

def load_lines(image_id):
    """
    Load the lines JSON written by lsd.py for the given image_id.
    Returns (lines_list, rois, image_path).
    rois is a list of roi polygons (may be empty).
    """
    path = os.path.join(LINES_DIR, f"{image_id}.json")
    if not os.path.exists(path):
        return None, [], None
    with open(path) as f:
        data = json.load(f)

    raw = data.get("lines", [])
    if raw and isinstance(raw[0], dict):
        lines = [[l["x1"], l["y1"], l["x2"], l["y2"]] for l in raw]
    else:
        lines = raw

    if data.get("rois") is not None:
        rois = [[tuple(p) for p in r] for r in data["rois"]]
    elif data.get("roi") or data.get("roi_polygon"):
        single = data.get("roi") or data.get("roi_polygon")
        rois = [[tuple(p) for p in single]]
    else:
        rois = []

    image_path = data.get("image", "")
    return lines, rois, image_path


def lines_to_dicts(lines_list):
    """Convert [[x1,y1,x2,y2], ...] to [{'start':(x1,y1), 'end':(x2,y2)}, ...]."""
    return [{'start': (seg[0], seg[1]), 'end': (seg[2], seg[3])} for seg in lines_list]


def filter_lines_for_roi(line_dicts, roi_polygon):
    """Keep lines that have at least one endpoint inside roi_polygon."""
    roi_pts = np.array(roi_polygon, dtype=np.float32)
    result = []
    for l in line_dicts:
        s = (float(l['start'][0]), float(l['start'][1]))
        e = (float(l['end'][0]),   float(l['end'][1]))
        if (cv2.pointPolygonTest(roi_pts, s, False) >= 0 or
                cv2.pointPolygonTest(roi_pts, e, False) >= 0):
            result.append(l)
    return result


# ══════════════════════════════════════════════════════════════════════════════
# Perspective warp
# ══════════════════════════════════════════════════════════════════════════════

def _order_quad(pts):
    """Order 4 points as [TL, TR, BR, BL] using the x+y / x-y trick."""
    pts = pts.astype(np.float32)
    s = pts.sum(axis=1)
    d = pts[:, 0] - pts[:, 1]
    return np.array([
        pts[np.argmin(s)],
        pts[np.argmax(d)],
        pts[np.argmax(s)],
        pts[np.argmin(d)],
    ], dtype=np.float32)


def _quad_valid(quad):
    for i in range(4):
        for j in range(i + 1, 4):
            if np.linalg.norm(quad[i] - quad[j]) < 5:
                return False
    return True


def _quad_from_halves(pts):
    cy = float(np.median(pts[:, 1]))
    top = pts[pts[:, 1] <= cy]
    bot = pts[pts[:, 1] >  cy]
    if len(top) == 0 or len(bot) == 0:
        box = cv2.boxPoints(cv2.minAreaRect(pts.astype(np.int32))).astype(np.float32)
        return _order_quad(box)
    tl = top[np.argmin(top[:, 0])]
    tr = top[np.argmax(top[:, 0])]
    br = bot[np.argmax(bot[:, 0])]
    bl = bot[np.argmin(bot[:, 0])]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def quad_from_polygon(polygon):
    """Reduce any polygon to an ordered [TL, TR, BR, BL] quad for perspective warp."""
    pts = np.array(polygon, dtype=np.float32)
    if len(pts) == 4:
        q = _order_quad(pts)
        return q if _quad_valid(q) else _quad_from_halves(pts)
    hull = cv2.convexHull(pts.astype(np.int32))
    for eps in [0.02, 0.05, 0.08, 0.12, 0.18]:
        approx = cv2.approxPolyDP(hull, eps * cv2.arcLength(hull, True), True)
        if len(approx) == 4:
            q = _order_quad(approx.reshape(4, 2).astype(np.float32))
            if _quad_valid(q):
                return q
    hull_pts = hull.reshape(-1, 2).astype(np.float32)
    q = _order_quad(hull_pts)
    if _quad_valid(q):
        return q
    box = cv2.boxPoints(cv2.minAreaRect(pts.astype(np.int32))).astype(np.float32)
    q = _order_quad(box)
    if _quad_valid(q):
        return q
    return _quad_from_halves(pts)


def compute_homography(quad):
    """Returns M (original->warped), Minv (warped->original), dst_w, dst_h."""
    tl, tr, br, bl = quad
    w = int(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl)))
    h = int(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr)))
    w, h = max(w, 100), max(h, 100)
    dst  = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=np.float32)
    M    = cv2.getPerspectiveTransform(quad, dst)
    Minv = cv2.getPerspectiveTransform(dst, quad)
    return M, Minv, w, h


# ══════════════════════════════════════════════════════════════════════════════
# Line handling in warped space
# ══════════════════════════════════════════════════════════════════════════════

def transform_lines(line_dicts, M):
    """Project line dicts through homography M."""
    result = []
    for l in line_dicts:
        pts = np.array([[[float(l['start'][0]), float(l['start'][1])]],
                        [[float(l['end'][0]),   float(l['end'][1])]]], dtype=np.float32)
        out = cv2.perspectiveTransform(pts, M)
        result.append({
            'start': (int(out[0][0][0]), int(out[0][0][1])),
            'end':   (int(out[1][0][0]), int(out[1][0][1])),
        })
    return result


def _angle(line):
    """Angle from horizontal in [0, 90]: 0 = horizontal, 90 = vertical."""
    dx = abs(line['end'][0] - line['start'][0])
    dy = abs(line['end'][1] - line['start'][1])
    return float(np.degrees(np.arctan2(dy, dx)))


def _line_length(l):
    dx = l['end'][0] - l['start'][0]
    dy = l['end'][1] - l['start'][1]
    return float(np.hypot(dx, dy))


def auto_roi_from_boundary_extent(line_dicts, img_w, img_h,
                                   img=None, debug_dir=None, steps=None):
    """
    Build a single parallelogram ROI whose top and bottom edges are parallel
    to the detected boundary lines.

    Strategy:
      1. Classify boundary fragments (near-horizontal lines).
      2. Fit one slope through all their endpoints (the dominant row angle).
      3. Project every endpoint onto the perpendicular axis (residual from the
         fitted slope line) → gives a 1-D "distance-from-line" value per point.
      4. Top edge  = fitted-slope line at min(residual) - pad
         Bottom edge = fitted-slope line at max(residual) + pad
      5. Left/right extents come from all detected lines (boundaries + dividers).

    Returns a list containing one ROI polygon, or [] on failure.
    """
    _dbg = img is not None and debug_dir is not None

    if len(line_dicts) < 4:
        print("  Auto ROI failed: not enough detected lines.")
        return []

    boundary_max, _ = infer_angle_split(line_dicts)

    boundaries, all_lines = [], []
    for l in line_dicts:
        if _line_length(l) < 20:
            continue
        all_lines.append(l)
        if _angle(l) < boundary_max:
            boundaries.append(l)

    if len(boundaries) < 2:
        print("  Auto ROI failed: not enough boundary candidates.")
        return []

    # ── fit slope through all boundary endpoints ──────────────────────────────
    pts = np.array(
        [[l['start'][0], l['start'][1]] for l in boundaries] +
        [[l['end'][0],   l['end'][1]]   for l in boundaries],
        dtype=np.float64,
    )
    xs, ys = pts[:, 0], pts[:, 1]

    if np.ptp(xs) > 5:
        slope, _ = np.polyfit(xs, ys, 1)
    else:
        slope = 0.0

    # Residual = y - slope*x  (intercept offset for each endpoint)
    residuals = ys - slope * xs

    # ── x-extent from ALL lines ───────────────────────────────────────────────
    all_xs = (
        [l['start'][0] for l in all_lines] +
        [l['end'][0]   for l in all_lines]
    )

    pad_y, pad_x = 10, 10
    top_intercept = float(np.min(residuals)) - pad_y
    bot_intercept = float(np.max(residuals)) + pad_y
    left_x  = max(0,         int(np.min(all_xs)) - pad_x)
    right_x = min(img_w - 1, int(np.max(all_xs)) + pad_x)

    def _clamp_y(y):
        return max(0, min(img_h - 1, int(round(y))))

    tl = (left_x,  _clamp_y(slope * left_x  + top_intercept))
    tr = (right_x, _clamp_y(slope * right_x + top_intercept))
    br = (right_x, _clamp_y(slope * right_x + bot_intercept))
    bl = (left_x,  _clamp_y(slope * left_x  + bot_intercept))
    roi = [tl, tr, br, bl]

    if right_x - left_x < 50 or br[1] - tl[1] < 10:
        print("  Auto ROI failed: extent too small.")
        return []

    print(f"  Auto ROI: slope={slope:.4f}  x=[{left_x},{right_x}]  "
          f"intercepts=[{top_intercept:.0f},{bot_intercept:.0f}]  "
          f"({len(boundaries)} boundary fragments)")

    # ── debug ─────────────────────────────────────────────────────────────────
    if _dbg:
        dbg = img.copy()
        for l in boundaries:
            cv2.line(dbg, l['start'], l['end'], (0, 0, 255), 2)
        cv2.polylines(dbg, [np.array(roi, dtype=np.int32)], True, (0, 255, 0), 2)
        cv2.putText(
            dbg,
            f"Auto ROI from {len(boundaries)} boundary fragments (red)",
            (10, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2,
        )
        _save(debug_dir, "mode4_01_auto_roi.png", dbg)
        if steps is not None:
            steps.append(("Auto ROI extent", dbg))

    return [roi]


# ══════════════════════════════════════════════════════════════════════════════
# Adaptive angle split
# ══════════════════════════════════════════════════════════════════════════════

def infer_angle_split(warped_lines):
    """
    Determine the boundary/divider angle threshold from the line population.

    Uses a length-weighted bimodal split:
      1. Compute the length-weighted median angle M.
      2. Compute the weighted mean of lines below M (boundary family)
         and above M (divider family).
      3. Place the split halfway between those two means, with a +-3 dead-band.
      4. Guard: if families are < 10 deg apart or split is outside [12, 75],
         fall back to hardcoded constants.

    Returns (boundary_max, divider_min).
    """
    if len(warped_lines) < 4:
        return float(BOUNDARY_ANGLE_MAX), float(DIVIDER_ANGLE_MIN)

    angles  = np.array([_angle(l) for l in warped_lines], dtype=np.float64)
    lengths = np.array([_line_length(l) for l in warped_lines], dtype=np.float64)
    lengths = np.maximum(lengths, 1.0)

    # Length-weighted median
    order    = np.argsort(angles)
    w_sorted = lengths[order]
    a_sorted = angles[order]
    cum      = np.cumsum(w_sorted)
    median_a = float(a_sorted[np.searchsorted(cum, cum[-1] * 0.5)])

    low_mask  = angles < median_a
    high_mask = ~low_mask

    if low_mask.sum() < 2 or high_mask.sum() < 2:
        return float(BOUNDARY_ANGLE_MAX), float(DIVIDER_ANGLE_MIN)

    mean_low  = float(np.average(angles[low_mask],  weights=lengths[low_mask]))
    mean_high = float(np.average(angles[high_mask], weights=lengths[high_mask]))

    split = (mean_low + mean_high) / 2.0

    if mean_high - mean_low < 10.0 or not (12.0 < split < 75.0):
        print(f"  Angle split: families too close "
              f"({mean_low:.1f}deg / {mean_high:.1f}deg) -- using fallback")
        return float(BOUNDARY_ANGLE_MAX), float(DIVIDER_ANGLE_MIN)

    dead         = 3.0
    boundary_max = split - dead
    divider_min  = split + dead

    print(f"  Auto angle split: boundary < {boundary_max:.1f}deg, "
          f"divider > {divider_min:.1f}deg  "
          f"(family means: {mean_low:.1f}deg / {mean_high:.1f}deg)")
    return boundary_max, divider_min


# ══════════════════════════════════════════════════════════════════════════════
# Classify
# ══════════════════════════════════════════════════════════════════════════════

def classify_lines(warped_lines, warped_w):
    """
    Returns (boundaries, dividers, discarded).
    Angle thresholds are auto-detected via infer_angle_split().
    Minimum fragment length (3% of warped width) discards obvious noise only;
    the real length filter is applied after clustering in merge_boundaries().
    """
    boundary_max, divider_min = infer_angle_split(warped_lines)
    min_fragment_len = 0.03 * warped_w

    boundaries, dividers, discarded = [], [], []
    for l in warped_lines:
        a      = _angle(l)
        length = _line_length(l)
        if a < boundary_max:
            if length >= min_fragment_len:
                boundaries.append(l)
            else:
                discarded.append(l)
        elif a > divider_min:
            dividers.append(l)
        else:
            discarded.append(l)
    return boundaries, dividers, discarded


# ══════════════════════════════════════════════════════════════════════════════
# Clustering helpers
# ══════════════════════════════════════════════════════════════════════════════

def _ymid(l): return (l['start'][1] + l['end'][1]) / 2.0
def _xmid(l): return (l['start'][0] + l['end'][0]) / 2.0


def _cluster(lines, key_fn, tolerance):
    """Cluster lines by a scalar key. Returns [(median_key, [lines]), ...]."""
    if not lines:
        return []
    items = sorted(lines, key=key_fn)
    clusters, cur = [], [items[0]]
    for line in items[1:]:
        if abs(key_fn(line) - key_fn(cur[-1])) <= tolerance:
            cur.append(line)
        else:
            clusters.append(cur)
            cur = [line]
    clusters.append(cur)
    return [(float(np.median([key_fn(l) for l in c])), c) for c in clusters]



def _boundary_y_at_x(bline, x):
    """Y value of a boundary line at a given x (linear extrapolation)."""
    x1, y1 = float(bline['start'][0]), float(bline['start'][1])
    x2, y2 = float(bline['end'][0]),   float(bline['end'][1])
    if abs(x2 - x1) < 1.0:
        return (y1 + y2) / 2.0
    return y1 + (y2 - y1) * (x - x1) / (x2 - x1)


def _fit_boundary_line(cluster_lines, warped_w):
    """
    Fit one representative line through all endpoints in a boundary cluster,
    extended to span the full warped width [0, warped_w].
    Returns {'start':(0,y0), 'end':(warped_w,yw), 'y_mid': float}.
    """
    pts = []
    for l in cluster_lines:
        pts.append([float(l['start'][0]), float(l['start'][1])])
        pts.append([float(l['end'][0]),   float(l['end'][1])])
    pts = np.array(pts, dtype=np.float64)
    xs, ys = pts[:, 0], pts[:, 1]

    if np.ptp(xs) < 5:
        med_y = float(np.median(ys))
        return {'start': (0, int(round(med_y))),
                'end':   (int(warped_w), int(round(med_y))),
                'y_mid': med_y}

    slope, intercept = np.polyfit(xs, ys, 1)
    y0    = slope * 0          + intercept
    yw    = slope * warped_w   + intercept
    y_mid = float(np.median([_ymid(l) for l in cluster_lines]))
    return {'start': (0,             int(round(y0))),
            'end':   (int(warped_w), int(round(yw))),
            'y_mid': y_mid}


# ══════════════════════════════════════════════════════════════════════════════
# Merge boundaries (length filter applied after clustering)
# ══════════════════════════════════════════════════════════════════════════════

def merge_boundaries(boundaries, warped_w, tolerance=CLUSTER_TOLERANCE):
    """
    Cluster boundary segments and return one fitted line per cluster.
    The minimum-length filter is applied here, AFTER clustering, so that
    short fragments that belong to the same boundary are merged first.

    The length threshold is scaled against the actual x-span of all detected
    boundary fragments rather than the full warped width.  This prevents small
    ROIs (e.g. a single row along the lot edge) from having their boundaries
    silently dropped because the warped canvas happens to be wide.
    """
    clusters = _cluster(boundaries, _ymid, tolerance)
    if not clusters:
        return []
    all_x    = [l['start'][0] for l in boundaries] + [l['end'][0] for l in boundaries]
    observed = max(all_x) - min(all_x) if all_x else warped_w
    ref_w    = max(observed, warped_w * 0.15)   # never go below 15 % of canvas
    min_len  = BOUNDARY_MIN_LENGTH_W * ref_w
    lines    = []
    for _, segs in clusters:
        fitted = _fit_boundary_line(segs, warped_w)
        x_vals = [l['start'][0] for l in segs] + [l['end'][0] for l in segs]
        span   = max(x_vals) - min(x_vals)
        if span >= min_len:
            lines.append(fitted)
    return sorted(lines, key=lambda l: l['y_mid'])


# ══════════════════════════════════════════════════════════════════════════════
# Missing boundary inference
# ══════════════════════════════════════════════════════════════════════════════

def infer_missing_boundaries(b_lines, dst_w):
    """
    Insert a synthetic boundary at the midpoint of any gap that is between
    1.8x and 2.7x the median row height — indicating one boundary was missed.
    Synthetic boundaries are drawn in orange in the debug output.
    """
    if not INFER_MISSING_BOUNDARY or len(b_lines) < 2:
        return b_lines

    gaps       = [b_lines[i+1]['y_mid'] - b_lines[i]['y_mid']
                  for i in range(len(b_lines) - 1)]
    median_gap = float(np.median(gaps))
    if median_gap <= 0:
        return b_lines

    result   = [b_lines[0]]
    inserted = 0
    for i, gap in enumerate(gaps):
        top_bl = b_lines[i]
        bot_bl = b_lines[i + 1]
        if 1.8 * median_gap < gap < 2.7 * median_gap:
            mid_y = (top_bl['y_mid'] + bot_bl['y_mid']) / 2.0
            # Interpolate geometry from neighbours
            y0 = (_boundary_y_at_x(top_bl, 0)      + _boundary_y_at_x(bot_bl, 0))      / 2.0
            yw = (_boundary_y_at_x(top_bl, dst_w)   + _boundary_y_at_x(bot_bl, dst_w))  / 2.0
            synthetic = {
                'start':     (0,        int(round(y0))),
                'end':       (int(dst_w), int(round(yw))),
                'y_mid':     mid_y,
                'synthetic': True,
            }
            result.append(synthetic)
            inserted += 1
            print(f"  Inferred missing boundary at y~{int(mid_y)} "
                  f"(gap {int(gap)} px ~ 2x median {int(median_gap)} px)")
        result.append(bot_bl)

    if inserted:
        result = sorted(result, key=lambda l: l['y_mid'])
    return result


# ══════════════════════════════════════════════════════════════════════════════
# Dividers per row
# ══════════════════════════════════════════════════════════════════════════════

def _make_divider_rep(cluster_lines, top_bline, bot_bline):
    """
    Build a representative divider whose endpoints snap to the boundary lines.
    """
    x_center = float(np.median([_xmid(l) for l in cluster_lines]))
    y_center  = float(np.mean([_ymid(l)   for l in cluster_lines]))
    slopes = []
    for l in cluster_lines:
        dy = l['end'][1] - l['start'][1]
        dx = l['end'][0] - l['start'][0]
        if abs(dy) > 1:
            slopes.append(dx / dy)
    slope = float(np.median(slopes)) if slopes else 0.0

    y_top = _boundary_y_at_x(top_bline, x_center)
    y_bot = _boundary_y_at_x(bot_bline, x_center)
    return {
        'top':   (int(round(x_center + slope * (y_top - y_center))), int(round(y_top))),
        'bot':   (int(round(x_center + slope * (y_bot - y_center))), int(round(y_bot))),
        'x_mid': x_center,
    }


def dividers_for_row(all_warped_lines, top_bline, bot_bline,
                     tolerance=CLUSTER_TOLERANCE,
                     boundary_max=None, divider_min=None):
    """Find, cluster, and return representative dividers for a row."""
    if boundary_max is None: boundary_max = float(BOUNDARY_ANGLE_MAX)
    if divider_min  is None: divider_min  = float(DIVIDER_ANGLE_MIN)

    y_top = top_bline['y_mid']
    y_bot = bot_bline['y_mid']
    row_h = y_bot - y_top
    cands = []
    for l in all_warped_lines:
        a = _angle(l)
        if a <= boundary_max or a < divider_min:
            continue
        y_lo = min(l['start'][1], l['end'][1])
        y_hi = max(l['start'][1], l['end'][1])
        if min(y_hi, y_bot) - max(y_lo, y_top) >= row_h * DIVIDER_ROW_OVERLAP:
            cands.append(l)
    clusters = _cluster(cands, _xmid, tolerance)
    reps     = [_make_divider_rep(lines, top_bline, bot_bline) for _, lines in clusters]
    return sorted(reps, key=lambda d: d['x_mid'])


# ══════════════════════════════════════════════════════════════════════════════
# Slot building
# ══════════════════════════════════════════════════════════════════════════════

def build_slots_in_row(dividers, top_bline, bot_bline, img_w):
    """Build slot polygons for one row from sorted representative dividers."""
    if len(dividers) < 2:
        return []
    gaps      = [dividers[i+1]['x_mid'] - dividers[i]['x_mid']
                 for i in range(len(dividers) - 1)]
    typical_w = float(np.median(gaps))
    divs      = list(dividers)
    left_gap  = divs[0]['x_mid']
    right_gap = img_w - divs[-1]['x_mid']

    if typical_w * (1 - VIRTUAL_EDGE_TOL) < left_gap < typical_w * (1 + VIRTUAL_EDGE_TOL):
        y_top_l = int(round(_boundary_y_at_x(top_bline, 0)))
        y_bot_l = int(round(_boundary_y_at_x(bot_bline, 0)))
        divs.insert(0, {'top': (0, y_top_l), 'bot': (0, y_bot_l), 'x_mid': 0.0})
    if typical_w * (1 - VIRTUAL_EDGE_TOL) < right_gap < typical_w * (1 + VIRTUAL_EDGE_TOL):
        y_top_r = int(round(_boundary_y_at_x(top_bline, img_w)))
        y_bot_r = int(round(_boundary_y_at_x(bot_bline, img_w)))
        divs.append({'top': (img_w, y_top_r), 'bot': (img_w, y_bot_r), 'x_mid': float(img_w)})

    slots = []
    for i in range(len(divs) - 1):
        left, right = divs[i], divs[i + 1]
        width = right['x_mid'] - left['x_mid']
        if width < MIN_SLOT_WIDTH_PX:
            continue
        polygon = [list(left['top']), list(right['top']),
                   list(right['bot']), list(left['bot'])]
        area = float(abs(cv2.contourArea(np.array(polygon, dtype=np.float32))))
        if area < 200:
            continue
        slots.append({'id': '', 'polygon': polygon, 'type': 'regular',
                      'zone': '', 'area': area, 'width': float(width)})
    return slots


# ══════════════════════════════════════════════════════════════════════════════
# Unwarp / filter / assign
# ══════════════════════════════════════════════════════════════════════════════

def unwarp_slots(warped_slots, Minv):
    """Transform slot polygons from warped space back to original image space."""
    result = []
    for slot in warped_slots:
        pts  = np.array(slot['polygon'], dtype=np.float32).reshape(-1, 1, 2)
        orig = cv2.perspectiveTransform(pts, Minv).reshape(-1, 2)
        s    = dict(slot)
        s['polygon'] = [[int(p[0]), int(p[1])] for p in orig]
        s['area']    = float(abs(cv2.contourArea(np.array(s['polygon'], dtype=np.float32))))
        result.append(s)
    return result


def filter_slots_by_roi(slots, roi_polygon):
    """Remove slots whose centroid falls outside the ROI polygon."""
    if roi_polygon is None or len(roi_polygon) < 3:
        return slots
    roi_pts = np.array(roi_polygon, dtype=np.float32)
    def _centroid(slot):
        pts = slot['polygon']
        return (float(np.mean([p[0] for p in pts])),
                float(np.mean([p[1] for p in pts])))
    return [s for s in slots
            if cv2.pointPolygonTest(roi_pts, _centroid(s), False) >= 0]


def clip_slots_to_roi(slots, roi_polygon):
    """Clip each slot polygon to the ROI boundary instead of rejecting it."""
    if roi_polygon is None or len(roi_polygon) < 3:
        return slots

    roi_shape = ShapelyPolygon(roi_polygon).buffer(0)
    result = []
    for slot in slots:
        slot_shape = ShapelyPolygon(slot['polygon']).buffer(0)
        clipped = slot_shape.intersection(roi_shape)
        if clipped.is_empty or clipped.area < 200:
            continue
        s = dict(slot)
        s['polygon'] = [[int(p[0]), int(p[1])] for p in clipped.exterior.coords[:-1]]
        s['area'] = float(clipped.area)
        result.append(s)
    return result


def assign_ids_zones(slots, img_w, img_h):
    for i, slot in enumerate(slots):
        slot['id'] = f'slot_{i + 1}'
        cx = float(np.mean([p[0] for p in slot['polygon']]))
        cy = float(np.mean([p[1] for p in slot['polygon']]))
        slot['cx']   = cx
        slot['cy']   = cy
        slot['zone'] = f"{chr(65 + min(int(cy / img_h * 3), 2))}{int(cx / img_w * 20) + 1}"


# ══════════════════════════════════════════════════════════════════════════════
# Save JSON
# ══════════════════════════════════════════════════════════════════════════════

def save_slots_json(slots, img_w, img_h, lot_id):
    def _cvt(o):
        if isinstance(o, np.integer):  return int(o)
        if isinstance(o, np.floating): return float(o)
        if isinstance(o, np.ndarray):  return o.tolist()
        raise TypeError(type(o))
    os.makedirs(LAYOUT_DIR, exist_ok=True)
    path = os.path.join(LAYOUT_DIR, f"{lot_id}_auto_slots.json")
    payload = {
        'lot_id':       lot_id,
        'total_slots':  len(slots),
        'image_width':  img_w,
        'image_height': img_h,
        'slots':        slots,
    }
    with open(path, 'w') as f:
        json.dump(payload, f, indent=2, default=_cvt)
    return path


# ══════════════════════════════════════════════════════════════════════════════
# Debug helpers
# ══════════════════════════════════════════════════════════════════════════════

def _save(debug_dir, name, img):
    cv2.imwrite(os.path.join(debug_dir, name), img)


def _draw_line_dicts(base, lines, color=(0, 0, 255)):
    out = base.copy()
    for l in lines:
        cv2.line(out, l['start'], l['end'], color, 2)
    return out


def _draw_slots_on(base, slots):
    out, overlay = base.copy(), base.copy()
    for i, slot in enumerate(slots):
        pts = np.array(slot['polygon'], dtype=np.int32)
        cv2.fillPoly(overlay, [pts], (0, 200, 80))
        cv2.polylines(out, [pts], True, (0, 255, 0), 2)
        cx  = int(np.mean([p[0] for p in slot['polygon']]))
        cy  = int(np.mean([p[1] for p in slot['polygon']]))
        lbl = slot.get('zone') or slot.get('id') or str(i + 1)
        cv2.putText(out, lbl, (cx - 14, cy + 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
    return cv2.addWeighted(overlay, 0.25, out, 0.75, 0)


# ══════════════════════════════════════════════════════════════════════════════
# Interactive viewer
# ══════════════════════════════════════════════════════════════════════════════

_HELP = "[N/Space] next   [P/Backspace] prev   [Q/Esc] quit"


def show_steps(steps):
    if not steps:
        print("No steps to display.")
        return
    total = len(steps)
    idx   = 0
    while True:
        title, img = steps[idx]
        h, w = img.shape[:2]
        bar  = np.zeros((52, w, 3), dtype=np.uint8)
        filled = int(w * (idx + 1) / total)
        bar[:, :filled] = (0, 110, 55)
        bar[:, filled:] = (35, 35, 35)
        cv2.putText(bar, f"  [{idx+1}/{total}]  {title}",
                    (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.putText(bar, f"  {_HELP}",
                    (6, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (160, 160, 160), 1, cv2.LINE_AA)
        cv2.imshow("slot_definer", np.vstack([img, bar]))
        while True:
            k = cv2.waitKey(0) & 0xFF
            if k in (ord('n'), ord(' '), 13):
                idx = min(idx + 1, total - 1); break
            elif k in (ord('p'), 8):
                idx = max(idx - 1, 0); break
            elif k in (ord('q'), 27):
                cv2.destroyAllWindows(); return
    cv2.destroyAllWindows()


# ══════════════════════════════════════════════════════════════════════════════
# Per-ROI pipeline
# ══════════════════════════════════════════════════════════════════════════════

def _process_roi(line_dicts, roi, img, img_w, img_h, debug_dir, steps, label=""):
    """
    Run the full warp → classify → build → unwarp pipeline for one ROI.
    Appends debug frames to `steps`. Returns list of unwarped slots (no IDs).
    """
    tag = f"[{label}] " if label else ""

    # ── loaded lines ──────────────────────────────────────────────────────────
    s1 = _draw_line_dicts(img, line_dicts)
    cv2.polylines(s1, [np.array(roi, dtype=np.int32)], True, (0, 255, 0), 2)
    cv2.putText(s1, f"{tag}{len(line_dicts)} lines",
                (10, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    _save(debug_dir, f"{label}_01_loaded_lines.png" if label else "01_loaded_lines.png", s1)
    steps.append((f"{tag}Lines ({len(line_dicts)} segments)", s1))

    # ── perspective warp ──────────────────────────────────────────────────────
    quad   = quad_from_polygon(roi)
    M, Minv, dst_w, dst_h = compute_homography(quad)
    warped = cv2.warpPerspective(img, M, (dst_w, dst_h))
    _save(debug_dir, f"{label}_02_warped.png" if label else "02_warped.png", warped)
    steps.append((f"{tag}Warped top-down view", warped))

    # ── classify ──────────────────────────────────────────────────────────────
    wlines                           = transform_lines(line_dicts, M)
    boundaries_w, dividers_w, disc_w = classify_lines(wlines, dst_w)
    _b_max, _d_min                   = infer_angle_split(wlines)

    s3 = warped.copy()
    for l in disc_w:       cv2.line(s3, l['start'], l['end'], (80, 80, 80), 1)
    for l in boundaries_w: cv2.line(s3, l['start'], l['end'], (0, 0, 255), 2)
    for l in dividers_w:   cv2.line(s3, l['start'], l['end'], (255, 80, 0), 2)
    cv2.putText(s3, "RED=boundary  BLUE=divider  GRAY=discarded",
                (8, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
    _save(debug_dir, f"{label}_03_classified.png" if label else "03_classified.png", s3)
    steps.append((f"{tag}Classified: {len(boundaries_w)} boundaries, "
                  f"{len(dividers_w)} dividers, {len(disc_w)} discarded", s3))

    # ── merge + row pairs ─────────────────────────────────────────────────────
    b_lines = merge_boundaries(boundaries_w, dst_w)
    b_lines = infer_missing_boundaries(b_lines, dst_w)

    # If fewer than 2 boundaries survived filtering, synthesise canvas-edge
    # boundaries so a tightly-drawn single-row ROI still produces one row pair.
    if len(b_lines) < 2:
        edge_top = {'start': (0, 0),        'end': (int(dst_w), 0),        'y_mid': 0.0}
        edge_bot = {'start': (0, int(dst_h)),'end': (int(dst_w), int(dst_h)),'y_mid': float(dst_h)}
        if len(b_lines) == 0:
            b_lines = [edge_top, edge_bot]
            print(f"  {tag}No boundaries found — using canvas edges as fallback")
        elif b_lines[0]['y_mid'] > dst_h * 0.5:
            b_lines = [edge_top] + b_lines   # missing top boundary
            print(f"  {tag}Missing top boundary — synthesised canvas edge")
        else:
            b_lines = b_lines + [edge_bot]   # missing bottom boundary
            print(f"  {tag}Missing bottom boundary — synthesised canvas edge")

    print(f"  {tag}Boundary y-positions: {[int(bl['y_mid']) for bl in b_lines]}")

    row_pairs = []
    for i in range(len(b_lines) - 1):
        gap = b_lines[i + 1]['y_mid'] - b_lines[i]['y_mid']
        if dst_h * MIN_ROW_FRAC < gap < dst_h * MAX_ROW_FRAC:
            row_pairs.append((b_lines[i], b_lines[i + 1]))

    if len(row_pairs) > 1:
        heights = [bot['y_mid'] - top['y_mid'] for top, bot in row_pairs]
        max_h   = max(heights)
        before  = len(row_pairs)
        row_pairs = [
            (top, bot) for (top, bot), h in zip(row_pairs, heights)
            if h >= max_h * MIN_ROW_HEIGHT_FRAC
        ]
        dropped = before - len(row_pairs)
        if dropped:
            print(f"  {tag}Dropped {dropped} narrow row(s)")

    print(f"  {tag}Row pairs: {len(row_pairs)}")

    s4 = warped.copy()
    for bl in b_lines:
        color = (0, 140, 255) if bl.get('synthetic') else (0, 220, 220)
        cv2.line(s4, bl['start'], bl['end'], color, 1)
    for ri, (top_bl, bot_bl) in enumerate(row_pairs):
        cv2.line(s4, top_bl['start'], top_bl['end'], (0, 255, 255), 2)
        cv2.line(s4, bot_bl['start'], bot_bl['end'], (255, 0, 255), 2)
        mid_y = int((top_bl['y_mid'] + bot_bl['y_mid']) / 2)
        cv2.putText(s4, f"Row {ri + 1}", (8, mid_y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(s4, "ORANGE = inferred boundary",
                (8, dst_h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 140, 255), 1)
    _save(debug_dir, f"{label}_04_row_pairs.png" if label else "04_row_pairs.png", s4)
    steps.append((f"{tag}Row pairs ({len(row_pairs)} rows)", s4))

    if not row_pairs:
        print(f"  {tag}No row pairs found.")
        return []

    # ── dividers + warped slots ───────────────────────────────────────────────
    s5           = warped.copy()
    warped_slots = []
    for top_bl, bot_bl in row_pairs:
        row_divs = dividers_for_row(wlines, top_bl, bot_bl,
                                    boundary_max=_b_max, divider_min=_d_min)
        print(f"  {tag}Row y=[{int(top_bl['y_mid'])},{int(bot_bl['y_mid'])}]"
              f" → {len(row_divs)} dividers")
        for d in row_divs:
            cv2.line(s5, d['top'], d['bot'], (0, 200, 255), 1)
        warped_slots.extend(build_slots_in_row(row_divs, top_bl, bot_bl, dst_w))

    for i, slot in enumerate(warped_slots):
        pts = np.array(slot['polygon'], dtype=np.int32)
        cv2.polylines(s5, [pts], True, (0, 255, 0), 2)
        cx = int(np.mean([p[0] for p in slot['polygon']]))
        cy = int(np.mean([p[1] for p in slot['polygon']]))
        cv2.putText(s5, str(i + 1), (cx - 8, cy + 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    _save(debug_dir, f"{label}_05_warped_slots.png" if label else "05_warped_slots.png", s5)
    steps.append((f"{tag}Warped slots ({len(warped_slots)} slots)", s5))

    if not warped_slots:
        return []

    # ── unwarp + clip ─────────────────────────────────────────────────────────
    full_img_roi = [(0, 0), (img_w, 0), (img_w, img_h), (0, img_h)]
    roi_for_clip = roi if roi != full_img_roi else None
    slots = unwarp_slots(warped_slots, Minv)
    slots = clip_slots_to_roi(slots, roi_for_clip)
    return slots


# ══════════════════════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════════════════════

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    image_id = sys.argv[1]
    lot_id   = sys.argv[2] if len(sys.argv) > 2 else image_id

    # ── Load lines (image_path comes from inside the JSON) ────────────────────
    lines_list, rois, image_path = load_lines(image_id)
    if lines_list is None:
        print(f"\nNo lines found for image_id '{image_id}'.")
        print("Run lsd.py first to detect lines:")
        print(f"    python lsd.py")
        print(f"Expected file: {LINES_DIR}/{image_id}.json")
        sys.exit(1)

    if not image_path or not os.path.exists(image_path):
        print(f"Error: image not found: {image_path!r}")
        print(f"  (path stored inside {LINES_DIR}/{image_id}.json)")
        sys.exit(1)

    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: could not read: {image_path}")
        sys.exit(1)
    img_h, img_w = img.shape[:2]

    line_dicts = lines_to_dicts(lines_list)
    print(f"Loaded {len(line_dicts)} line segments from lsd.py")

    if rois:
        print(f"ROI(s): {len(rois)} polygon(s)")
    else:
        print("No ROI — using full image")
        rois = [[(0, 0), (img_w, 0), (img_w, img_h), (0, img_h)]]

    debug_dir = os.path.join(DEBUG_BASE, lot_id)
    os.makedirs(debug_dir, exist_ok=True)
    steps     = []

    # ── Process each ROI independently ───────────────────────────────────────
    all_slots    = []
    multi        = len(rois) > 1
    for i, roi in enumerate(rois):
        label = f"roi{i}" if multi else ""
        if multi:
            print(f"\n── ROI {i} ({len(roi)} points) ──────────────────────────────")
        roi_lines = filter_lines_for_roi(line_dicts, roi) if multi else line_dicts
        slots     = _process_roi(roi_lines, roi, img, img_w, img_h,
                                 debug_dir, steps, label)
        all_slots.extend(slots)
        if not slots and multi:
            print(f"  ROI {i}: no slots found — check debug images")

    if not all_slots:
        print("\nNo slots built across any ROI.")
        print("  - Check classified step: boundary lines should be RED")
        print("  - Check classified step: dividers should be BLUE")
        show_steps(steps)
        sys.exit(0)

    # ── Finalise: assign IDs, draw, save ─────────────────────────────────────
    assign_ids_zones(all_slots, img_w, img_h)

    s6 = _draw_slots_on(img, all_slots)
    for roi in rois:
        cv2.polylines(s6, [np.array(roi, dtype=np.int32)], True, (0, 255, 0), 1)
    cv2.putText(s6, f"Detected: {len(all_slots)} slots", (10, 36),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
    _save(debug_dir, "06_final_slots.png", s6)
    steps.append((f"Final slots  ({len(all_slots)} total)", s6))

    json_path = save_slots_json(all_slots, img_w, img_h, lot_id)

    print(f"\n{'=' * 60}")
    print(f"  Detected {len(all_slots)} parking slot(s)")
    print(f"  JSON saved:   {json_path}")
    print(f"  Debug images: {debug_dir}/")
    print(f"{'=' * 60}")
    print("\nOpening step viewer...\n")
    show_steps(steps)


if __name__ == "__main__":
    main()