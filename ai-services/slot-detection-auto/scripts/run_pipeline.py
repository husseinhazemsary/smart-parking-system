"""
run_pipeline.py — single entry point for the full LSD → slot-definer pipeline.

Usage:
    python run_pipeline.py

Replaces running:
    python lsd.py
    python slot_definer.py <image_id>
"""

import cv2
import numpy as np
import os
import sys

import lsd
import slot_definer as sd
import occupancy_detector as od

def save_converted_lines(line_dicts, image_id):
    import json, os

    os.makedirs("output/converted_lines", exist_ok=True)

    converted = []
    for l in line_dicts:
        converted.append({
            "start": list(l["start"]),  # convert tuple → list
            "end":   list(l["end"])
        })

    out_path = f"output/converted_lines/{image_id}_start_end.json"

    with open(out_path, "w") as f:
        json.dump({
            "image_id": image_id,
            "line_count": len(converted),
            "lines": converted
        }, f, indent=2)

    print(f"Saved converted lines → {out_path}")

def _run_occupancy_only():
    print("\n" + "=" * 60)
    print("  Occupancy Detection  (skip slot definition)")
    print("=" * 60)
    lot_id     = input("  Lot ID (must match an existing layout): ").strip()
    if not lot_id:
        print("  No lot ID entered. Exiting.")
        return
    video_name = input("  Video filename (in data/videos/): ").strip()
    if not video_name:
        print("  No video filename entered. Exiting.")
        return
    save_ans   = input("  Save annotated output video? [Y/n]: ").strip().lower()
    od.run(lot_id, video_name, save_output=(save_ans != 'n'))


def main():
    print("=" * 60)
    print("  Parking Slot Pipeline  (LSD → slot definer)")
    print("=" * 60)
    print("  [1] Full pipeline  (detect lines → define slots → occupancy)")
    print("  [2] Occupancy only (use an existing slot layout)")
    print("=" * 60)
    choice = input("  Select mode [1]: ").strip()
    if choice == "2":
        _run_occupancy_only()
        return

    # ── Step 1: image + ID ────────────────────────────────────────────────────
    image_path = lsd.prompt_image_path()
    img        = cv2.imread(image_path)
    if img is None:
        print(f"Error: could not read image at {image_path}")
        sys.exit(1)
    h, w = img.shape[:2]
    print(f"  Loaded image: {w}×{h}")

    stem     = __import__("pathlib").Path(image_path).stem
    image_id = input(f"  Image ID [{stem}]: ").strip() or stem
    debug_dir = os.path.join(lsd.OUTPUT_DIR, "debug", "lsd", image_id)

    # ── Step 2: LSD detection ─────────────────────────────────────────────────
    mode     = lsd.prompt_mode()
    polygons = None

    if mode == 1:
        print("\nRunning white filter only …")
        final, count, lines = lsd.detect_white_only(img, debug_dir)
        mode_str = "white_only"

    elif mode == 2:
        polygons = lsd.get_roi_for_image(img, image_path)
        if polygons is None:
            print("ROI selection cancelled. Exiting.")
            sys.exit(0)
        print(f"\nRunning white filter + ROI ({len(polygons[0])} points) …")
        final, count, lines = lsd.detect_white_plus_roi(img, polygons[0], debug_dir)
        mode_str = "white_plus_roi"

    elif mode == 3:
        polygons = lsd.get_multi_roi_for_image(img, image_path)
        if polygons is None:
            print("ROI selection cancelled. Exiting.")
            sys.exit(0)
        print(f"\nRunning white filter + {len(polygons)} ROI(s) …")
        final, count, lines = lsd.detect_white_plus_multi_roi(img, polygons, debug_dir)
        mode_str = "white_plus_roi"

    else:
        print("\nRunning white filter + automatic warp …")
        final, count, lines = lsd.detect_white_only(img, debug_dir)
        mode_str = "auto_warp"
        
    lsd.save_lines(image_path, image_id, lines, mode_str, polygons)

    print(f"  Detected {count} line segments")
    print(f"  Debug stages : {debug_dir}/")
    print(f"  Line coords  : {lsd.LINES_DIR}/{image_id}.json")

    # ── Step 3: slot definer ──────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  Building slot polygons …")
    print("=" * 60)

    img_h, img_w = img.shape[:2]
    lines_list, rois, _ = sd.load_lines(image_id)
    line_dicts = sd.lines_to_dicts(lines_list)
    print(f"  Loaded {len(line_dicts)} line segments")

    sd_debug_dir = os.path.join(sd.DEBUG_BASE, image_id)
    os.makedirs(sd_debug_dir, exist_ok=True)
    steps = []

    if mode == 4:
        print("  Auto-warp mode — estimating one ROI per detected row")

        # Show LSD-detected lines before any ROI estimation
        steps.append(("LSD detected lines", final))
        sd._save(sd_debug_dir, "00_lsd_lines.png", final)

        auto_rois = sd.auto_roi_from_boundary_extent(
            line_dicts, img_w, img_h,
            img=img, debug_dir=sd_debug_dir, steps=steps,
        )

        if auto_rois:
            rois = auto_rois
            print(f"  Auto ROIs: {len(rois)}")
        else:
            print("  Auto ROI failed — falling back to full image")
            rois = [[(0, 0), (img_w, 0), (img_w, img_h), (0, img_h)]]

    elif rois:
        print(f"  ROI(s): {len(rois)} polygon(s)")

    else:
        print("  No ROI — using full image")
        rois = [[(0, 0), (img_w, 0), (img_w, img_h), (0, img_h)]]

    all_slots = []
    multi     = len(rois) > 1
    for i, roi in enumerate(rois):
        label     = f"roi{i}" if multi else ""
        if multi:
            print(f"\n── ROI {i} ({len(roi)} points) ──────────────────────────────")
        roi_lines = sd.filter_lines_for_roi(line_dicts, roi) if multi else line_dicts
        slots     = sd._process_roi(roi_lines, roi, img, img_w, img_h,
                                    sd_debug_dir, steps, label)
        all_slots.extend(slots)
        if not slots and multi:
            print(f"  ROI {i}: no slots found — check debug images")

    if not all_slots:
        print("\nNo slots built across any ROI.")
        print("  - Check classified step: boundary lines should be RED")
        print("  - Check classified step: dividers should be BLUE")
        sd.show_steps(steps)
        sys.exit(0)

    sd.assign_ids_zones(all_slots, img_w, img_h)

    s6 = sd._draw_slots_on(img, all_slots)
    for roi in rois:
        cv2.polylines(s6, [np.array(roi, dtype=np.int32)], True, (0, 255, 0), 1)
    cv2.putText(s6, f"Detected: {len(all_slots)} slots", (10, 36),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
    sd._save(sd_debug_dir, "06_final_slots.png", s6)
    steps.append((f"Final slots  ({len(all_slots)} total)", s6))

    json_path = sd.save_slots_json(all_slots, img_w, img_h, image_id)

    print(f"\n{'=' * 60}")
    print(f"  Detected {len(all_slots)} parking slot(s)")
    print(f"  JSON saved:   {json_path}")
    print(f"  Debug images: {sd_debug_dir}/")
    print(f"{'=' * 60}")
    print("\nOpening step viewer …\n")
    sd.show_steps(steps)

    # ── Step 4: occupancy detection ───────────────────────────────────────
    print("\n" + "=" * 60)
    print("  Occupancy Detection")
    print(f"  Videos directory: data/videos/")
    print("=" * 60)
    video_name = input("  Enter video filename (or leave blank to skip): ").strip()
    if video_name:
        save_ans = input("  Save annotated output video? [Y/n]: ").strip().lower()
        save_output = save_ans != 'n'
        od.run(image_id, video_name, save_output=save_output)
    else:
        print("  Skipping occupancy detection.")


if __name__ == "__main__":
    main()
