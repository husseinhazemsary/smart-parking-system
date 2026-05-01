"""
Video processing: load saved slot definitions (rotated polygons) and
determine occupancy for each slot on every processed frame.
Uses YOLO segmentation → minAreaRect for oriented car detection.
"""

import cv2
import json
import os
import numpy as np
from ultralytics import YOLO
from config import (VEHICLE_MODEL, VEHICLE_CLASSES, DETECTION_CONF,
                    FRAME_SKIP, MIN_COVERAGE, CONFIRM_SECONDS, RELEASE_SECONDS,
                    OUTPUT_VIDEOS_DIR, COLOR_OCCUPIED, COLOR_FREE)


def load_slots(slots_path):
    with open(slots_path) as f:
        data = json.load(f)

    slots = data["slots"]
    for slot in slots:
        # Old calibrate.py saved axis-aligned bbox instead of polygon.
        # Convert bbox [x1,y1,x2,y2] → 4-corner polygon.
        if "bbox" in slot and "polygon" not in slot:
            x1, y1, x2, y2 = slot["bbox"]
            slot["polygon"] = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]

        # Compute centroid if slot_definer or old calibrate didn't include it.
        if "cx" not in slot or "cy" not in slot:
            pts = slot["polygon"]
            slot["cx"] = float(np.mean([p[0] for p in pts]))
            slot["cy"] = float(np.mean([p[1] for p in pts]))

    return slots, data.get("image_width"), data.get("image_height")


def polygon_overlap_ratio(slot_poly, det_poly):
    """Fraction of slot_poly area covered by det_poly (convex polygon intersection)."""
    slot_area = cv2.contourArea(slot_poly)
    if slot_area == 0:
        return 0.0
    ret, inter_pts = cv2.intersectConvexConvex(slot_poly, det_poly)
    if ret == 0 or inter_pts is None:
        return 0.0
    return cv2.contourArea(inter_pts) / slot_area


def is_slot_occupied(slot_poly, detection_polys):
    for det_poly in detection_polys:
        if polygon_overlap_ratio(slot_poly, det_poly) >= MIN_COVERAGE:
            return True
    return False


def scale_polygon(polygon, sx, sy):
    return [[p[0] * sx, p[1] * sy] for p in polygon]


def process_video(video_path, slots_path, lot_id):
    slots, ref_w, ref_h = load_slots(slots_path)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Could not open video: {video_path}")

    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps     = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total   = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if ref_w and ref_h and (frame_w != ref_w or frame_h != ref_h):
        sx, sy = frame_w / ref_w, frame_h / ref_h
        print(f"Scaling slots from {ref_w}x{ref_h} to {frame_w}x{frame_h}")
        for slot in slots:
            slot["polygon"] = scale_polygon(slot["polygon"], sx, sy)

    slot_polys = {
        slot["id"]: np.array(slot["polygon"], dtype=np.float32).reshape(-1, 1, 2)
        for slot in slots
    }

    model = YOLO(VEHICLE_MODEL)

    activate_score   =  int(CONFIRM_SECONDS * fps / FRAME_SKIP)
    deactivate_score = -int(RELEASE_SECONDS * fps / FRAME_SKIP)
    score_cap        = activate_score * 2

    slot_scores = {s["id"]: 0     for s in slots}
    slot_states = {s["id"]: False for s in slots}

    os.makedirs(OUTPUT_VIDEOS_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_VIDEOS_DIR, f"{lot_id}_output.mp4")
    writer   = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*"mp4v"),
                               fps / FRAME_SKIP, (frame_w, frame_h))

    frame_idx = 0
    print(f"Processing {total} frames (every {FRAME_SKIP}th)...")

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1

        if frame_idx % FRAME_SKIP != 0:
            continue

        results = model(frame, conf=DETECTION_CONF,
                        classes=VEHICLE_CLASSES, verbose=False)[0]

        # Build rotated detection polygons from segmentation masks
        det_polys = []
        if results.masks is not None:
            for mask_xy in results.masks.xy:
                if len(mask_xy) < 3:
                    continue
                hull = cv2.convexHull(mask_xy.astype(np.float32))
                if hull is not None and len(hull) >= 3:
                    det_polys.append(hull)

        occupied_count = 0
        free_count     = 0

        for slot in slots:
            sid = slot["id"]
            hit = is_slot_occupied(slot_polys[sid], det_polys)

            slot_scores[sid] = (min(slot_scores[sid] + 1, score_cap) if hit
                                else max(slot_scores[sid] - 1, -score_cap))

            if slot_scores[sid] >= activate_score:
                slot_states[sid] = True
            elif slot_scores[sid] <= deactivate_score:
                slot_states[sid] = False

            if slot_states[sid]:
                occupied_count += 1
            else:
                free_count += 1

        vis     = frame.copy()
        overlay = vis.copy()
        for slot in slots:
            sid   = slot["id"]
            pts   = np.array(slot["polygon"], dtype=np.int32).reshape(-1, 1, 2)
            color = COLOR_OCCUPIED if slot_states[sid] else COLOR_FREE
            cv2.fillPoly(overlay, [pts], color)
            cv2.polylines(vis, [pts], True, color, 2)
            cx_i = int(slot["cx"])
            cy_i = int(slot["cy"])
            cv2.putText(vis, str(sid), (cx_i - 8, cy_i + 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        vis = cv2.addWeighted(overlay, 0.3, vis, 0.7, 0)
        cv2.putText(vis, f"Occupied: {occupied_count}", (20, 45),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.1, COLOR_OCCUPIED, 2)
        cv2.putText(vis, f"Free:     {free_count}",     (20, 90),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.1, COLOR_FREE,     2)

        writer.write(vis)

        if frame_idx % (FRAME_SKIP * 50) == 0:
            pct = frame_idx / total * 100
            print(f"  {frame_idx}/{total} ({pct:.0f}%) — "
                  f"Occupied: {occupied_count}  Free: {free_count}")

    cap.release()
    writer.release()
    print(f"Done. Output saved → {out_path}")
    return out_path
