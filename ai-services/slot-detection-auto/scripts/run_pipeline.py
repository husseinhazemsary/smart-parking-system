"""
run_pipeline.py — single entry point for the full LSD → slot-definer pipeline.

Usage: python run_pipeline.py

"""

from pathlib import Path

import cv2
import numpy as np
import os
import sys
import json

import lsd
import slot_definer as sd
import slot_editor as se
import occupancy_detector as od

def _run_occupancy_only():
    """Run just the occupancy detection stage, using an existing slot layout."""
    lot_id = input("  Lot ID (must match an existing layout): ").strip()
    if not lot_id:
        print("  No lot ID entered. Exiting.")
        return
    video_name = input("  Video filename (in data/videos/): ").strip()
    if not video_name:
        print("  No video filename entered. Exiting.")
        return
    save_ans   = input("  Save annotated output video? [Y/n]: ").strip().lower()
    od.run(lot_id, video_name, save_output=(save_ans != 'n'))

def _run_slot_editor_only():
    """Run just the slot editor, using an existing slot layout."""
    lot_id = input("  Lot ID (must match an existing layout): ").strip()
    if not lot_id:
        print("  No lot ID entered. Exiting.")
        return

    layout_path = os.path.join(sd.LAYOUT_DIR, f"{lot_id}_auto_slots.json")
    if not os.path.exists(layout_path):
        print(f"  Layout not found: {layout_path}")
        return

    with open(layout_path) as f:
        data = json.load(f)
    img_w = data.get("image_width",  0)
    img_h = data.get("image_height", 0)

    img_path = input("  Blueprint image path (leave blank to auto-detect): ").strip()
    if not img_path:
        import glob as _glob
        candidates = _glob.glob(os.path.join(lsd.IMAGES_DIR, f"{lot_id}*"))
        img_path   = candidates[0] if candidates else None

    if not img_path or not os.path.exists(img_path):
        print("  Could not find a blueprint image. "
              "Pass the path explicitly when prompted.")
        return

    img = cv2.imread(img_path)
    if img is None:
        print(f"  Could not read image: {img_path}")
        return

    img_h, img_w = img.shape[:2]
    se.run_editor(lot_id, img, img_w, img_h)

def main():
    print("=" * 60)
    print("  Parking Slot Pipeline  (LSD → slot definer)")
    print("=" * 60)
    print("  [1] Full pipeline  (detect lines → define slots → occupancy)")
    print("  [2] Occupancy only (use an existing slot layout)")
    print("  [3] Slot editor    (edit an existing slot layout)")
    print("=" * 60)
    choice = input("  Select mode [1]: ").strip()
    if choice == "2":
        _run_occupancy_only()
        return
    if choice == "3":
        _run_slot_editor_only()
        return

    # Imageprompt + LSD detection
    image_path = lsd.prompt_image_path()
    stem = Path(image_path).stem
    image_id = input(f"  Image ID [{stem}]: ").strip() or stem
    debug_dir = os.path.join(lsd.OUTPUT_DIR, "debug", "lsd", stem, image_id)

    img, final, count, lines, mode_str, polygons, mode = lsd.run_lsd_interactive(image_path, image_id, debug_dir)
    lsd.save_lines(image_path, image_id, stem, lines, mode_str, polygons)

    print(f"  Detected {count} line segments")

    # Slot definer
    print("  \nBuilding slot polygons …\n")

    img_h, img_w = img.shape[:2]
    all_slots, steps, sd_debug_dir = sd.run_slot_definer(
        image_id, img, img_w, img_h, mode, final
    )

    if not all_slots:
        print("\nNo slots built across any ROI.")
        print("  - Check classified step: boundary lines should be RED")
        print("  - Check classified step: dividers should be BLUE")
        sd.show_steps(steps)
        sys.exit(0)

    json_path = sd.save_slots_json(all_slots, img_w, img_h, image_id)

    print(f"  Detected {len(all_slots)} parking slot(s)")
    print("\nOpening step viewer …\n")
    sd.show_steps(steps)

    # Slot Editor
    print("  \nSlot Editor  (fix any incorrect slots before occupancy)\n")
    edit_ans = input("  Open slot editor? [Y/n]: ").strip().lower()
    if edit_ans != 'n':
        se.run_editor(image_id, img, img_w, img_h)

    # Occupancy Detection
    print("  \nOccupancy Detection\n")
    print(f"  Videos directory: data/videos/")
    video_name = input("  Enter video filename (or leave blank to skip): ").strip()
    if video_name:
        save_ans = input("  Save annotated output video? [Y/n]: ").strip().lower()
        od.run(image_id, video_name, save_output=(save_ans != 'n'))
    else:
        print("  Skipping occupancy detection.")


if __name__ == "__main__":
    main()
