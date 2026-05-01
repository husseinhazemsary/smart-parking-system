"""
Debug script: visualize raw YOLO segmentation mask contour points and dump
all point coordinates per car to a text file for analysis.

Usage:
    python debug_masks.py                  # defaults to uni2.png
    python debug_masks.py parking.png
"""

import sys
import cv2
import numpy as np
from ultralytics import YOLO
from config import VEHICLE_MODEL, VEHICLE_CLASSES, DETECTION_CONF, DEBUG_DIR
import os

COLORS = [
    (255,  60,  60), ( 60, 255,  60), (  60,  60, 255),
    (255, 200,   0), (   0, 200, 255), ( 200,   0, 255),
    (255, 120,   0), (   0, 255, 150), ( 150,   0, 255),
    (255,   0, 120), (   0, 120, 255), ( 120, 255,   0),
]


def main():
    image_name = sys.argv[1] if len(sys.argv) > 1 else "uni2.png"
    image_path = os.path.join(os.path.dirname(__file__), "input", image_name)

    image = cv2.imread(image_path)
    if image is None:
        print(f"Could not load: {image_path}")
        return

    model = YOLO(VEHICLE_MODEL)
    results = model(image, conf=DETECTION_CONF, classes=VEHICLE_CLASSES, verbose=False)[0]

    if results.masks is None or len(results.masks) == 0:
        print("No detections.")
        return

    vis = image.copy()
    os.makedirs(DEBUG_DIR, exist_ok=True)
    stem = os.path.splitext(image_name)[0]
    txt_path = os.path.join(DEBUG_DIR, f"{stem}_points.txt")

    with open(txt_path, "w") as f:
        f.write(f"Image: {image_name}  ({image.shape[1]}x{image.shape[0]})\n")
        f.write(f"Detections: {len(results.masks)}\n\n")

        for i, mask_xy in enumerate(results.masks.xy):
            car_id = i + 1
            color  = COLORS[i % len(COLORS)]
            pts    = mask_xy.astype(np.int32)

            # Convex hull
            hull     = cv2.convexHull(mask_xy.astype(np.float32)).squeeze().astype(np.int32)
            cx       = int(pts[:, 0].mean())
            cy       = int(pts[:, 1].mean())
            y_min    = int(pts[:, 1].min())
            y_max    = int(pts[:, 1].max())
            x_min    = int(pts[:, 0].min())
            x_max    = int(pts[:, 0].max())

            # --- draw contour outline (thin) ---
            cv2.polylines(vis, [pts.reshape(-1, 1, 2)], True, color, 1)

            # --- draw every contour point as a dot ---
            for px, py in pts:
                cv2.circle(vis, (px, py), 2, color, -1)

            # --- draw convex hull (thick) ---
            cv2.polylines(vis, [hull.reshape(-1, 1, 2)], True, color, 2)

            # --- label ---
            cv2.putText(vis, str(car_id), (cx - 8, cy + 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

            # --- console summary ---
            print(f"Car {car_id:2d}: {len(pts):3d} contour pts | "
                  f"hull {len(hull)} pts | "
                  f"center=({cx},{cy}) | "
                  f"bbox x=[{x_min},{x_max}] y=[{y_min},{y_max}] | "
                  f"size={x_max-x_min}x{y_max-y_min}")

            # --- text file: full point dump ---
            f.write(f"--- Car {car_id} ---\n")
            f.write(f"  contour points : {len(pts)}\n")
            f.write(f"  centroid       : ({cx}, {cy})\n")
            f.write(f"  bbox           : x=[{x_min},{x_max}]  y=[{y_min},{y_max}]  "
                    f"size={x_max-x_min}x{y_max-y_min}\n")
            f.write(f"  hull points    : {len(hull)}\n")
            f.write(f"  hull coords    : {hull.tolist()}\n")
            f.write(f"  all contour coords (x,y):\n")
            for j, (px, py) in enumerate(pts):
                f.write(f"    [{j:3d}] ({px:4d}, {py:4d})\n")
            f.write("\n")

    cv2.putText(vis,
                "Thin = contour  |  Thick = convex hull  |  Dots = contour points",
                (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

    img_path = os.path.join(DEBUG_DIR, f"{stem}_mask_points.jpg")
    cv2.imwrite(img_path, vis)
    print(f"\nImage  → {img_path}")
    print(f"Points → {txt_path}")


if __name__ == "__main__":
    main()
