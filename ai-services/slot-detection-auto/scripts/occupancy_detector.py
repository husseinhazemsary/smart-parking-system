"""
occupancy_detector.py — live occupancy detection on a video using pre-defined slot polygons.

Called from run_pipeline.py after slot definition, or standalone:
    python occupancy_detector.py --lot_id <id> --video <filename>

Video must be placed in data/videos/.
Slots are loaded from data/layouts/<lot_id>_auto_slots.json  (written by slot_definer.py).
Output video saved to output/processed_videos/<stem>_occupancy.mp4

Controls while running:
    Q / Esc   quit
    S         toggle output-video saving on/off (before starting only)
"""

import argparse
import cv2
import json
import os
import sys
import numpy as np
from pathlib import Path
from ultralytics import YOLO
from shapely.geometry import Polygon as ShapelyPolygon
from shapely.geometry import box as ShapelyBox

# ── Paths (relative to slot-detection-auto/ working directory) ─────────────
LAYOUT_DIR = os.path.join("data", "layouts")
VIDEO_DIR  = os.path.join("data", "videos")
OUTPUT_DIR = os.path.join("output", "processed_videos")

# ── YOLO settings ──────────────────────────────────────────────────────────
YOLO_MODEL      = "yolov8n.pt"
VEHICLE_CLASSES = [2, 5, 7]   # car, bus, truck (COCO)
DETECT_CONF     = 0.40

# ── Frame processing ───────────────────────────────────────────────────────
FRAME_SKIP  = 5   # run YOLO every Nth frame; interpolate states in between

# ── Occupancy thresholds ───────────────────────────────────────────────────
MIN_COVERAGE   = 0.30   # vehicle bbox must cover >= this fraction of slot area
CONFIRM_FRAMES = 8      # consecutive "occupied" hits to flip state → occupied
RELEASE_FRAMES = 5      # consecutive "free" hits to flip state → free

# ── Visualisation ──────────────────────────────────────────────────────────
COLOR_FREE     = ( 30, 200,  30)   # green  (BGR)
COLOR_OCCUPIED = ( 30,  30, 220)   # red
ALPHA          = 0.38              # polygon fill opacity


# ══════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════

def load_slots(lot_id):
    path = os.path.join(LAYOUT_DIR, f"{lot_id}_auto_slots.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Slot layout not found: {path}\n"
                                f"Run run_pipeline.py first to generate it.")
    with open(path) as f:
        data = json.load(f)
    ref_w = data.get("image_width")
    ref_h = data.get("image_height")
    return data["slots"], ref_w, ref_h


def scale_slots(slots, ref_w, ref_h, vid_w, vid_h):
    """Rescale slot polygon coordinates from the reference image space to the video frame size."""
    if ref_w is None or ref_h is None or (ref_w == vid_w and ref_h == vid_h):
        return slots
    sx = vid_w / ref_w
    sy = vid_h / ref_h
    scaled = []
    for s in slots:
        ns = dict(s)
        ns["polygon"] = [[int(round(p[0] * sx)), int(round(p[1] * sy))]
                         for p in s["polygon"]]
        ns["cx"] = s.get("cx", 0) * sx
        ns["cy"] = s.get("cy", 0) * sy
        scaled.append(ns)
    return scaled


def _build_shapes(slots):
    shapes = []
    for s in slots:
        try:
            shape = ShapelyPolygon(s["polygon"]).buffer(0)
        except Exception:
            shape = None
        shapes.append(shape)
    return shapes


def _vehicle_covers_slot(bbox, slot_shape, min_coverage):
    x1, y1, x2, y2 = bbox
    veh_box = ShapelyBox(x1, y1, x2, y2)
    try:
        inter = veh_box.intersection(slot_shape)
        return inter.area / (slot_shape.area + 1e-9) >= min_coverage
    except Exception:
        return False


def _draw_slot(vis, pts, color, alpha):
    overlay = vis.copy()
    cv2.fillPoly(overlay, [pts], color)
    cv2.addWeighted(overlay, alpha, vis, 1 - alpha, 0, vis)
    cv2.polylines(vis, [pts], True, color, 2)


def _draw_hud(vis, occupied, free):
    h_pad, w_pad = 10, 10
    box_h, box_w = 80, 210
    cv2.rectangle(vis, (w_pad, h_pad), (w_pad + box_w, h_pad + box_h), (20, 20, 20), -1)
    cv2.putText(vis, f"Occupied: {occupied}", (w_pad + 8, h_pad + 32),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, COLOR_OCCUPIED, 2, cv2.LINE_AA)
    cv2.putText(vis, f"Free:     {free}", (w_pad + 8, h_pad + 65),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, COLOR_FREE, 2, cv2.LINE_AA)


# ══════════════════════════════════════════════════════════════════════════
# Main entry point
# ══════════════════════════════════════════════════════════════════════════

def run(lot_id, video_name, save_output=True):
    """
    Run occupancy detection.

    Parameters
    ----------
    lot_id      : str   — matches the image_id used in run_pipeline.py
    video_name  : str   — filename inside data/videos/ (e.g. "lot_cam.mp4")
    save_output : bool  — write annotated video to output/processed_videos/
    """
    # ── Load slots ────────────────────────────────────────────────────────
    slots, ref_w, ref_h = load_slots(lot_id)
    print(f"  Loaded {len(slots)} slot(s) from {lot_id}_auto_slots.json  "
          f"(reference image: {ref_w}×{ref_h})")

    # ── Open video ────────────────────────────────────────────────────────
    video_path = os.path.join(VIDEO_DIR, video_name)
    if not os.path.exists(video_path):
        print(f"  Error: video not found at {video_path}")
        return

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"  Error: could not open video: {video_path}")
        return

    fps    = cap.get(cv2.CAP_PROP_FPS) or 25.0
    fw     = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    fh     = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    dur    = total / fps if fps > 0 else 0

    print(f"  Video  : {fw}×{fh}  {fps:.1f} fps  "
          f"{total} frames  ({dur:.1f}s)")

    # ── Scale slot coordinates to video resolution ────────────────────────
    if ref_w and ref_h and (ref_w != fw or ref_h != fh):
        print(f"  Scaling slots from {ref_w}×{ref_h} → {fw}×{fh}  "
              f"(sx={fw/ref_w:.3f}  sy={fh/ref_h:.3f})")
    slots  = scale_slots(slots, ref_w, ref_h, fw, fh)
    shapes = _build_shapes(slots)

    print(f"  YOLO   : every {FRAME_SKIP} frame(s)  conf={DETECT_CONF}")
    print(f"  Overlap: ≥{int(MIN_COVERAGE*100)}% of slot area to count")

    # ── Debug: overlay slots on first frame ───────────────────────────────
    ret0, first_frame = cap.read()
    if not ret0:
        print("  Error: could not read first frame.")
        cap.release()
        return
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)   # rewind

    dbg = first_frame.copy()
    for i, slot in enumerate(slots):
        pts   = np.array(slot["polygon"], dtype=np.int32)
        color = (0, 200, 255)   # yellow-ish: neutral (not yet occupied/free)
        overlay = dbg.copy()
        cv2.fillPoly(overlay, [pts], color)
        cv2.addWeighted(overlay, 0.35, dbg, 0.65, 0, dbg)
        cv2.polylines(dbg, [pts], True, color, 2)
        cx = int(slot.get("cx", np.mean(pts[:, 0])))
        cy = int(slot.get("cy", np.mean(pts[:, 1])))
        cv2.putText(dbg, slot["id"], (cx - 22, cy + 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.putText(dbg, slot["id"], (cx - 22, cy + 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

    # Save debug image
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    dbg_path = os.path.join(OUTPUT_DIR, f"{lot_id}_slot_mapping_debug.png")
    cv2.imwrite(dbg_path, dbg)
    print(f"\n  [DEBUG] Slot mapping saved: {dbg_path}")
    print("  [DEBUG] Showing slot overlay on first video frame.")
    print("  [DEBUG] Check that the yellow polygons align with the actual parking slots.")
    print("  [DEBUG] Press any key to continue, or Q/Esc to abort.\n")

    cv2.imshow("Slot Mapping Debug (first frame)", dbg)
    key = cv2.waitKey(0) & 0xFF
    cv2.destroyAllWindows()
    if key in (27, ord('q'), ord('Q')):
        print("  Aborted.")
        cap.release()
        return

    print("  Press Q or Esc to quit during playback\n")

    # ── Output writer ─────────────────────────────────────────────────────
    writer   = None
    out_path = None
    if save_output:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        stem     = Path(video_name).stem
        out_path = os.path.join(OUTPUT_DIR, f"{stem}_occupancy.mp4")
        fourcc   = cv2.VideoWriter_fourcc(*"mp4v")
        out_fps  = max(1.0, fps / FRAME_SKIP)
        writer   = cv2.VideoWriter(out_path, fourcc, out_fps, (fw, fh))
        print(f"  Output : {out_path}  ({out_fps:.1f} fps)")

    # ── Load YOLO ─────────────────────────────────────────────────────────
    model = YOLO(YOLO_MODEL)

    # ── Per-slot state ────────────────────────────────────────────────────
    states = [False] * len(slots)
    scores = [0]     * len(slots)   # up = occupied evidence, down = free
    score_cap = max(CONFIRM_FRAMES, RELEASE_FRAMES) * 2

    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1

        if frame_idx % FRAME_SKIP != 0:
            continue

        # ── YOLO detection ────────────────────────────────────────────────
        results = model(frame,
                        conf=DETECT_CONF,
                        classes=VEHICLE_CLASSES,
                        verbose=False)[0]
        bboxes = (results.boxes.xyxy.cpu().numpy().tolist()
                  if results.boxes is not None else [])

        # ── Update scores and states ──────────────────────────────────────
        for i, (slot, shape) in enumerate(zip(slots, shapes)):
            if shape is None or shape.is_empty:
                continue
            hit = any(_vehicle_covers_slot(bb, shape, MIN_COVERAGE)
                      for bb in bboxes)
            if hit:
                scores[i] = min(scores[i] + 1,  score_cap)
            else:
                scores[i] = max(scores[i] - 1, -score_cap)

            if   scores[i] >= CONFIRM_FRAMES:
                states[i] = True
            elif scores[i] <= -RELEASE_FRAMES:
                states[i] = False

        # ── Visualise ─────────────────────────────────────────────────────
        vis = frame.copy()

        for i, slot in enumerate(slots):
            pts   = np.array(slot["polygon"], dtype=np.int32)
            color = COLOR_OCCUPIED if states[i] else COLOR_FREE
            _draw_slot(vis, pts, color, ALPHA)

            cx = int(slot.get("cx", np.mean(pts[:, 0])))
            cy = int(slot.get("cy", np.mean(pts[:, 1])))
            cv2.putText(vis, slot["id"],
                        (cx - 22, cy + 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42,
                        (255, 255, 255), 1, cv2.LINE_AA)

        occ  = sum(states)
        free = len(states) - occ
        _draw_hud(vis, occ, free)

        if writer:
            writer.write(vis)

        cv2.imshow("Parking Occupancy", vis)
        key = cv2.waitKey(1) & 0xFF
        if key in (27, ord('q'), ord('Q')):
            break

    cap.release()
    if writer:
        writer.release()
    cv2.destroyAllWindows()

    print(f"\n  Done — {occ} occupied, {free} free (last frame)")
    if out_path:
        print(f"  Saved : {out_path}")


# ══════════════════════════════════════════════════════════════════════════
# Standalone CLI
# ══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Occupancy detection on a video using pre-defined slot polygons."
    )
    parser.add_argument("--lot_id", required=True,
                        help="Lot/image ID (loads data/layouts/<lot_id>_auto_slots.json)")
    parser.add_argument("--video",  required=True,
                        help="Video filename inside data/videos/")
    parser.add_argument("--no_save", action="store_true",
                        help="Do not save annotated output video")
    args = parser.parse_args()

    print("=" * 60)
    print("  Parking Occupancy Detector")
    print("=" * 60)
    run(args.lot_id, args.video, save_output=not args.no_save)
