"""
Debug runner: runs AutoSlotDetector on an image and walks through every
intermediate step image so you can inspect what the pipeline sees at each stage.

Usage:
    python debug_run.py <path_to_image> [lot_id]

Example:
    python debug_run.py data/partial_cars/dataset_image.jpg test_lot
"""

import sys
import os
import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core.auto_slot_detector import AutoSlotDetector


STEP_ORDER = [
    ("step1_mask.jpg",              "Step 1 — Parking area mask (gray asphalt isolated)"),
    ("step2_orig_edges.jpg",        "Step 2 — Canny edges on ORIGINAL image"),
    ("step3_orig_classified.jpg",   "Step 3 — Classified lines: RED=boundary  BLUE=divider"),
    ("step4_orig_row_pairs.jpg",    "Step 4 — Row pairs on ORIGINAL image"),
    ("step5_warp_corners.jpg",      "Step 5a — Perspective warp source corners"),
    ("step5_warped.jpg",            "Step 5b — Warped top-down view"),
    ("step2_warp_edges.jpg",        "Step 6 — Canny edges on WARPED image"),
    ("step3_warp_classified.jpg",   "Step 7 — Classified lines on WARPED image"),
    ("step4_warp_row_pairs.jpg",    "Step 8 — Row pairs on WARPED image"),
    ("step9_warp_slots.jpg",        "Step 9 — Slots built in warped space"),
]

INSTRUCTIONS = "[N / Space / Enter] next   [P / Backspace] prev   [Q / Esc] quit"


def show_steps(debug_dir, final_image):
    steps = []
    for filename, title in STEP_ORDER:
        path = os.path.join(debug_dir, filename)
        if os.path.exists(path):
            img = cv2.imread(path)
            if img is not None:
                steps.append((title, img))

    if final_image is not None:
        steps.append(("Step 10 — Final slots unwarped onto original image", final_image))

    if not steps:
        print("No debug images found.")
        return

    total = len(steps)
    idx = 0

    while True:
        title, img = steps[idx]
        display = img.copy()

        h, w = display.shape[:2]

        # Progress bar background
        bar_h = 50
        bar = np.zeros((bar_h, w, 3), dtype=np.uint8)
        filled = int(w * (idx + 1) / total)
        bar[:, :filled] = (0, 120, 60)
        bar[:, filled:] = (40, 40, 40)

        label = f"  [{idx+1}/{total}]  {title}"
        cv2.putText(bar, label, (6, 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.putText(bar, INSTRUCTIONS, (6, 38),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.44, (180, 180, 180), 1, cv2.LINE_AA)

        combined = np.vstack([display, bar])
        cv2.imshow("AutoSlotDetector — debug steps", combined)

        while True:
            key = cv2.waitKey(0) & 0xFF
            if key in (ord('n'), ord(' '), 13):   # next
                idx = min(idx + 1, total - 1)
                break
            elif key in (ord('p'), 8):             # prev
                idx = max(idx - 1, 0)
                break
            elif key in (ord('q'), 27):            # quit
                cv2.destroyAllWindows()
                return

    cv2.destroyAllWindows()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    image_path = sys.argv[1]
    lot_id = sys.argv[2] if len(sys.argv) > 2 else "debug_lot"

    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        sys.exit(1)

    debug_dir = os.path.join("output", "debug", lot_id)

    print(f"\nRunning AutoSlotDetector on: {image_path}")
    print(f"Debug images → {debug_dir}\n")

    detector = AutoSlotDetector(image_path, debug_dir=debug_dir)
    slots = detector.detect_slots(min_slot_width=20)

    print(f"\nDetected {len(slots)} slot(s)")

    final_img = detector.visualize_detected_slots() if slots else None
    if final_img is not None:
        out_path = os.path.join(debug_dir, f"{lot_id}_final.jpg")
        cv2.imwrite(out_path, final_img)
        print(f"Final visualization saved to: {out_path}")

    print("\nOpening step viewer — use N/P to navigate, Q to quit.\n")
    show_steps(debug_dir, final_img)


if __name__ == "__main__":
    main()
