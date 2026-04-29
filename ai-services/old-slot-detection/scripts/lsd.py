"""
Interactive LSD (Line Segment Detector) system.

Flow:
  1. Prompts the user for an image path.
  2. Prompts the user to pick a mode:
        1 = White filter only
        2 = White filter + ROI
  3. If mode 2:
       - Looks for a saved polygon (output/rois/<image_stem>.json).
       - If found, asks whether to reuse it.
       - Otherwise opens an interactive window where the user clicks points
         to define the polygon, then saves it for next time.
  4. Applies white threshold + morphological cleaning BEFORE running LSD,
     so trees, cars, and background clutter are suppressed.
  5. Runs LSD on the cleaned mask and saves debug stages + final output.
  6. Saves the detected line coordinates to output/lines/<stem>.json.

ROI picker controls:
  - Left click          add a point
  - Right click / 'z'   undo last point
  - 'r'                 reset (clear all points)
  - Enter               finish (need at least 3 points)
  - 'q' / Esc           cancel
"""

import cv2
import numpy as np
import os
import json
import sys
from pathlib import Path

# ---------- Pre-processing parameters ----------
WHITE_THRESHOLD = 180       # pixels brighter than this are kept (parking lines are white)
MORPH_KERNEL_SIZE = 3       # size of the structuring element for morphological opening

# ---------- LSD parameters ----------
# LSD scale: smaller = faster but misses fine lines; 0.8 is the default
LSD_SCALE = 0.8

# ---------- Output paths ----------
OUTPUT_DIR = "output"
DEBUG_DIR  = os.path.join(OUTPUT_DIR, "debug")
ROI_DIR    = os.path.join(OUTPUT_DIR, "rois")
LINES_DIR  = os.path.join(OUTPUT_DIR, "lines")


# ============================================================================
# Helpers
# ============================================================================

def save_debug(approach_name: str, stage_name: str, image):
    folder = os.path.join(DEBUG_DIR, approach_name)
    os.makedirs(folder, exist_ok=True)
    cv2.imwrite(os.path.join(folder, f"{stage_name}.png"), image)


def clean_white_mask(white_mask, kernel_size: int = MORPH_KERNEL_SIZE):
    """Remove isolated noise pixels with a morphological opening."""
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
    return cv2.morphologyEx(white_mask, cv2.MORPH_OPEN, kernel)


def run_lsd(gray_input):
    """Run LSD on a (pre-processed) grayscale image. Returns lines or None."""
    lsd = cv2.createLineSegmentDetector(cv2.LSD_REFINE_STD, scale=LSD_SCALE)
    lines, _, _, _ = lsd.detect(gray_input)
    return lines


def draw_lines(img, lines, color=(0, 0, 255), show_numbers: bool = True):
    """Draw detected line segments on a copy of img. Returns (annotated_img, count)."""
    out = img.copy()
    count = 0
    if lines is not None:
        for i, line in enumerate(lines):
            x1, y1, x2, y2 = map(int, line[0])
            cv2.line(out, (x1, y1), (x2, y2), color, 2)
            if show_numbers:
                mid_x = (x1 + x2) // 2
                mid_y = (y1 + y2) // 2
                cv2.putText(out, str(i),
                            (mid_x, mid_y),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                            (255, 0, 0), 1, cv2.LINE_AA)
            count += 1
    return out, count


# ============================================================================
# Line coordinate persistence
# ============================================================================

def save_lines(image_path: str, lines, mode: str, roi_polygons=None):
    """
    Save detected line endpoints to output/lines/<image_stem>.json.

    roi_polygons is a list of polygons (one per ROI), or None.
    Saves as "rois" key for multi-ROI; slot_definer reads this format.
    """
    os.makedirs(LINES_DIR, exist_ok=True)
    stem     = Path(image_path).stem
    out_path = os.path.join(LINES_DIR, f"{stem}.json")

    img  = cv2.imread(image_path)
    h, w = img.shape[:2] if img is not None else (0, 0)

    line_records = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = [int(v) for v in line[0]]
            line_records.append({"x1": x1, "y1": y1, "x2": x2, "y2": y2})

    payload = {
        "image":      str(image_path),
        "image_size": [w, h],
        "mode":       mode,
        "rois":       [[list(p) for p in poly] for poly in roi_polygons] if roi_polygons else None,
        "roi":        None,
        "params": {
            "white_threshold":   WHITE_THRESHOLD,
            "morph_kernel_size": MORPH_KERNEL_SIZE,
            "lsd_scale":         LSD_SCALE,
        },
        "line_count": len(line_records),
        "lines":      line_records,
    }

    with open(out_path, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"  Saved {len(line_records)} line coordinates → {out_path}")


def load_lines(image_path: str):
    """Load saved line coordinates if they exist. Returns list of (x1,y1,x2,y2) or None."""
    stem = Path(image_path).stem
    path = os.path.join(LINES_DIR, f"{stem}.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        data = json.load(f)
    return [(l["x1"], l["y1"], l["x2"], l["y2"]) for l in data["lines"]]


# ============================================================================
# ROI picker  (identical UI to hough_system.py)
# ============================================================================

def pick_roi_interactive(img, window_name="Draw ROI - click points, Enter to finish"):
    points      = []
    display_img = img.copy()
    original    = img.copy()

    def redraw():
        nonlocal display_img
        display_img = original.copy()
        for i, (x, y) in enumerate(points):
            cv2.circle(display_img, (x, y), 5, (0, 255, 0), -1)
            cv2.putText(display_img, str(i + 1), (x + 8, y - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        if len(points) >= 2:
            for i in range(len(points) - 1):
                cv2.line(display_img, points[i], points[i + 1], (0, 255, 0), 2)
        if len(points) >= 3:
            cv2.line(display_img, points[-1], points[0], (0, 200, 0), 1)
        instructions = [
            f"Points: {len(points)}",
            "Left click: add  |  Right click / z: undo",
            "r: reset  |  Enter: finish  |  q/Esc: cancel",
        ]
        for i, text in enumerate(instructions):
            y = 25 + i * 25
            cv2.putText(display_img, text, (10, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 3)
            cv2.putText(display_img, text, (10, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        cv2.imshow(window_name, display_img)

    def on_mouse(event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN:
            points.append((x, y))
            redraw()
        elif event == cv2.EVENT_RBUTTONDOWN and points:
            points.pop()
            redraw()

    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    h, w       = img.shape[:2]
    max_w, max_h = 1400, 800
    scale      = min(max_w / w, max_h / h, 1.0)
    cv2.resizeWindow(window_name, int(w * scale), int(h * scale))
    cv2.setMouseCallback(window_name, on_mouse)
    redraw()

    while True:
        key = cv2.waitKey(20) & 0xFF
        if key == 13:                      # Enter
            if len(points) >= 3:
                break
            print("  Need at least 3 points to form a polygon.")
        elif key in (ord('q'), 27):        # q / Esc
            cv2.destroyWindow(window_name)
            return None
        elif key == ord('r'):
            points.clear(); redraw()
        elif key == ord('z') and points:
            points.pop(); redraw()

    cv2.destroyWindow(window_name)
    return points


def save_roi(image_path: str, polygons):
    """Save one or more ROI polygons. polygons is a list of polygon point-lists."""
    os.makedirs(ROI_DIR, exist_ok=True)
    stem     = Path(image_path).stem
    roi_path = os.path.join(ROI_DIR, f"{stem}.json")
    with open(roi_path, "w") as f:
        json.dump({"image": str(image_path), "polygons": polygons}, f, indent=2)
    print(f"  Saved {len(polygons)} ROI(s) → {roi_path}")


def load_roi(image_path: str):
    """Return list of polygons, or None if no saved ROI exists."""
    stem     = Path(image_path).stem
    roi_path = os.path.join(ROI_DIR, f"{stem}.json")
    if not os.path.exists(roi_path):
        return None
    with open(roi_path) as f:
        data = json.load(f)
    # support old format ("polygon") and new format ("polygons")
    if "polygons" in data:
        return [[tuple(p) for p in poly] for poly in data["polygons"]]
    if "polygon" in data:
        return [[tuple(p) for p in data["polygon"]]]
    return None


# ============================================================================
# Detection pipelines
# ============================================================================

def detect_white_only(img):
    """
    Pipeline:
      original → grayscale → white threshold → morphological open → LSD
    """
    name = "white_only"
    save_debug(name, "stage1_original", img)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    save_debug(name, "stage2_grayscale", gray)

    _, white_mask = cv2.threshold(gray, WHITE_THRESHOLD, 255, cv2.THRESH_BINARY)
    save_debug(name, "stage3_white_mask", white_mask)

    cleaned = clean_white_mask(white_mask)
    save_debug(name, "stage4_morph_opened", cleaned)

    # LSD works on the cleaned mask (white = bright edges = parking lines)
    lines = run_lsd(cleaned)

    final, count = draw_lines(img, lines)
    save_debug(name, "stage5_final", final)
    return final, count, lines


def detect_white_plus_roi(img, roi_polygon):
    """
    Pipeline:
      original → grayscale → ROI mask → white threshold → morphological open → LSD
    """
    name = "white_plus_roi"
    save_debug(name, "stage1_original", img)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    save_debug(name, "stage2_grayscale", gray)

    # Build and apply ROI mask
    roi_mask = np.zeros_like(gray)
    cv2.fillPoly(roi_mask, [np.array(roi_polygon, dtype=np.int32)], 255)
    save_debug(name, "stage3_roi_mask", roi_mask)

    masked_gray = cv2.bitwise_and(gray, roi_mask)
    save_debug(name, "stage4_masked_gray", masked_gray)

    _, white_mask = cv2.threshold(masked_gray, WHITE_THRESHOLD, 255, cv2.THRESH_BINARY)
    save_debug(name, "stage5_white_mask", white_mask)

    cleaned = clean_white_mask(white_mask)
    save_debug(name, "stage6_morph_opened", cleaned)

    lines = run_lsd(cleaned)

    final, count = draw_lines(img, lines)
    # Draw the ROI polygon in green so it's visible in the output
    cv2.polylines(final, [np.array(roi_polygon, dtype=np.int32)],
                  isClosed=True, color=(0, 255, 0), thickness=2)
    save_debug(name, "stage7_final", final)
    return final, count, lines


def detect_white_plus_multi_roi(img, roi_polygons):
    """
    Like detect_white_plus_roi but accepts a list of ROI polygons.
    Builds a union mask so all ROIs are processed in one LSD pass.
    """
    name = "white_plus_roi"
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    roi_mask = np.zeros_like(gray)
    for poly in roi_polygons:
        cv2.fillPoly(roi_mask, [np.array(poly, dtype=np.int32)], 255)

    masked_gray = cv2.bitwise_and(gray, roi_mask)
    _, white_mask = cv2.threshold(masked_gray, WHITE_THRESHOLD, 255, cv2.THRESH_BINARY)
    cleaned = clean_white_mask(white_mask)
    lines   = run_lsd(cleaned)

    final, count = draw_lines(img, lines)
    for poly in roi_polygons:
        cv2.polylines(final, [np.array(poly, dtype=np.int32)],
                      isClosed=True, color=(0, 255, 0), thickness=2)
    save_debug(name, "stage_final_multi_roi", final)
    return final, count, lines


# ============================================================================
# Interactive prompts
# ============================================================================

def prompt_image_path() -> str:
    while True:
        path = input("Enter image path: ").strip().strip('"').strip("'")
        if not path:
            print("  Path cannot be empty.")
            continue
        if not os.path.exists(path):
            print(f"  File not found: {path}")
            continue
        return path


def prompt_mode() -> int:
    print("\nChoose detection mode:")
    print("  1) White filter only")
    print("  2) White filter + single ROI")
    print("  3) White filter + multiple ROIs (one per row)")
    while True:
        choice = input("Enter 1, 2, or 3: ").strip()
        if choice in ("1", "2", "3"):
            return int(choice)
        print("  Please enter 1, 2, or 3.")


def prompt_yes_no(question: str) -> bool:
    while True:
        ans = input(f"{question} (y/n): ").strip().lower()
        if ans in ("y", "yes"):
            return True
        if ans in ("n", "no"):
            return False
        print("  Please enter y or n.")


def get_roi_for_image(img, image_path: str):
    """Pick a single ROI. Returns a list containing one polygon, or None."""
    saved = load_roi(image_path)
    if saved is not None:
        print(f"\n  Found {len(saved)} saved ROI(s) for this image.")
        if prompt_yes_no("  Reuse them?"):
            return saved
        print("  OK, let's draw a new one.")

    print("\n  Opening ROI picker window...")
    print("  Click points around the parking area. Press Enter when done.")
    polygon = pick_roi_interactive(img)
    if polygon is None:
        return None
    polygons = [polygon]
    save_roi(image_path, polygons)
    return polygons


def get_multi_roi_for_image(img, image_path: str):
    """Pick multiple ROIs one at a time. Returns a list of polygons, or None."""
    saved = load_roi(image_path)
    if saved is not None:
        print(f"\n  Found {len(saved)} saved ROI(s) for this image.")
        if prompt_yes_no("  Reuse them?"):
            return saved
        print("  OK, let's draw new ones.")

    polygons = []
    while True:
        idx = len(polygons) + 1
        print(f"\n  Drawing ROI {idx} — click points, press Enter to finish.")
        poly = pick_roi_interactive(img, f"ROI {idx} — Enter to finish, Esc to stop adding")
        if poly is None:
            break
        polygons.append(poly)
        print(f"  ROI {idx} saved ({len(poly)} points).")
        if not prompt_yes_no("  Add another ROI?"):
            break

    if not polygons:
        return None
    save_roi(image_path, polygons)
    return polygons


# ============================================================================
# Main
# ============================================================================

def main():
    print("=" * 60)
    print("  LSD Line Detection  -  interactive mode")
    print("=" * 60)

    image_path = prompt_image_path()
    img        = cv2.imread(image_path)
    if img is None:
        print(f"Error: could not read image at {image_path}")
        sys.exit(1)
    h, w = img.shape[:2]
    print(f"  Loaded image: {w}×{h}")

    mode = prompt_mode()
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    stem = Path(image_path).stem

    polygons = None
    if mode == 1:
        print("\nRunning white filter only …")
        final, count, lines = detect_white_only(img)
        out_path = os.path.join(OUTPUT_DIR, f"{stem}_lsd_white_only.jpg")
        mode_str = "white_only"
    elif mode == 2:
        polygons = get_roi_for_image(img, image_path)
        if polygons is None:
            print("ROI selection cancelled. Exiting.")
            sys.exit(0)
        print(f"\nRunning white filter + ROI ({len(polygons[0])} points) …")
        final, count, lines = detect_white_plus_roi(img, polygons[0])
        out_path = os.path.join(OUTPUT_DIR, f"{stem}_lsd_white_plus_roi.jpg")
        mode_str = "white_plus_roi"
    else:
        polygons = get_multi_roi_for_image(img, image_path)
        if polygons is None:
            print("ROI selection cancelled. Exiting.")
            sys.exit(0)
        print(f"\nRunning white filter + {len(polygons)} ROI(s) …")
        final, count, lines = detect_white_plus_multi_roi(img, polygons)
        out_path = os.path.join(OUTPUT_DIR, f"{stem}_lsd_white_plus_roi.jpg")
        mode_str = "white_plus_roi"

    cv2.imwrite(out_path, final)
    save_lines(image_path, lines, mode_str, polygons)

    print("\n" + "=" * 60)
    print(f"  Detected {count} line segments")
    print(f"  Final output : {out_path}")
    print(f"  Debug stages : {DEBUG_DIR}/")
    print(f"  Line coords  : {LINES_DIR}/{stem}.json")
    print("=" * 60)

    cv2.imshow("LSD Detected Lines", final)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()