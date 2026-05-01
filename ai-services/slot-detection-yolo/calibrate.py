"""
Calibration step: given a reference image of a full parking lot
(ideally every slot occupied), detect all cars using YOLO segmentation,
compute the minimum-area rotated rectangle from each car's mask contour,
and save the angled slot polygons.
"""

import cv2
import json
import os
import numpy as np
from ultralytics import YOLO
from config import (VEHICLE_MODEL, VEHICLE_CLASSES, DETECTION_CONF,
                    SHRINK_FACTOR, SLOTS_DIR, DEBUG_DIR)


def mask_to_hull(mask_contour, shrink):
    """
    Compute the convex hull of the mask contour, shrunk toward its centroid.
    Returns (hull points as [[x,y],...], cx, cy) or None if contour too small.
    """
    if len(mask_contour) < 3:
        return None
    pts = mask_contour.astype(np.float32)
    hull = cv2.convexHull(pts).squeeze()
    if hull.ndim < 2 or len(hull) < 3:
        return None
    cx, cy = float(hull[:, 0].mean()), float(hull[:, 1].mean())
    shrunk = ((hull - [cx, cy]) * shrink + [cx, cy])
    return shrunk.tolist(), cx, cy


def calibrate(reference_image_path, lot_id):
    image = cv2.imread(reference_image_path)
    if image is None:
        raise FileNotFoundError(f"Could not load image: {reference_image_path}")

    h, w = image.shape[:2]
    print(f"Reference image: {w}x{h}")

    model   = YOLO(VEHICLE_MODEL)
    results = model(image, conf=DETECTION_CONF, classes=VEHICLE_CLASSES, verbose=False)[0]

    if results.masks is None or len(results.masks) == 0:
        print("No vehicles detected. Try lowering DETECTION_CONF in config.py")
        return None

    slots = []
    for mask_xy in results.masks.xy:
        result = mask_to_hull(mask_xy, SHRINK_FACTOR)
        if result is None:
            continue
        polygon, cx, cy = result
        slots.append({
            "id": len(slots) + 1,
            "polygon": polygon,
            "cx": float(cx),
            "cy": float(cy),
        })

    if not slots:
        print("Could not compute rotated rectangles. Check that masks are valid.")
        return None

    os.makedirs(SLOTS_DIR, exist_ok=True)
    slots_path = os.path.join(SLOTS_DIR, f"{lot_id}_slots.json")
    with open(slots_path, "w") as f:
        json.dump({
            "lot_id": lot_id,
            "total_slots": len(slots),
            "reference_image": reference_image_path,
            "image_width": w,
            "image_height": h,
            "slots": slots
        }, f, indent=2)

    # Debug visualization — draw rotated polygons
    os.makedirs(DEBUG_DIR, exist_ok=True)
    debug   = image.copy()
    overlay = debug.copy()
    for slot in slots:
        pts = np.array(slot["polygon"], dtype=np.int32).reshape(-1, 1, 2)
        cv2.fillPoly(overlay, [pts], (0, 255, 0))
        cv2.polylines(debug, [pts], True, (0, 255, 0), 2)
        cv2.putText(debug, str(slot["id"]),
                    (int(slot["cx"]) - 8, int(slot["cy"]) + 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

    debug = cv2.addWeighted(overlay, 0.25, debug, 0.75, 0)
    cv2.putText(debug, f"Slots: {len(slots)}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)

    debug_path = os.path.join(DEBUG_DIR, f"{lot_id}_calibration.jpg")
    cv2.imwrite(debug_path, debug)

    print(f"Detected {len(slots)} slots")
    print(f"Slots saved  → {slots_path}")
    print(f"Debug image  → {debug_path}")
    return slots_path
