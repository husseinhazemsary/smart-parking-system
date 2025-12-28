import cv2
import numpy as np
from ultralytics import YOLO


class PlateDetector:
    def __init__(self):
        # Vehicle detector (cars, motorcycles, buses, trucks)
        self.vehicle_model = YOLO("yolov8n.pt")

        # License plate detector
        self.plate_model = YOLO("PlateDetectorNano.pt")  # <-- make sure this exists

        self.vehicle_classes = {2, 3, 5, 7}  # car, motorcycle, bus, truck
        self.next_car_id = 0
        self.tracks = {}  # car_id -> bbox

    # ---------------- IOU ----------------
    def _iou(self, a, b):
        xA = max(a[0], b[0])
        yA = max(a[1], b[1])
        xB = min(a[2], b[2])
        yB = min(a[3], b[3])

        inter = max(0, xB - xA) * max(0, yB - yA)
        if inter == 0:
            return 0.0

        areaA = (a[2] - a[0]) * (a[3] - a[1])
        areaB = (b[2] - b[0]) * (b[3] - b[1])

        return inter / (areaA + areaB - inter)

    # ---------------- MAIN ----------------
    def find_vehicles(self, frame):
        results = []
        active_ids = set()

        detections = self.vehicle_model(frame, verbose=False)[0]

        for box in detections.boxes:
            cls = int(box.cls[0])
            if cls not in self.vehicle_classes:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            bbox = (x1, y1, x2, y2)

            car_id = self._match_or_create_id(bbox)
            active_ids.add(car_id)

            # ---------------- PLATE DETECTION ----------------
            plate_crop = None
            car_roi = frame[y1:y2, x1:x2]

            if car_roi.size > 0:
                plate_results = self.plate_model(car_roi, verbose=False)[0]

                if len(plate_results.boxes) > 0:
                    p = plate_results.boxes[0].xyxy[0]
                    px1, py1, px2, py2 = map(int, p)

                    px1 = max(0, px1)
                    py1 = max(0, py1)
                    px2 = min(car_roi.shape[1], px2)
                    py2 = min(car_roi.shape[0], py2)

                    plate_crop = car_roi[py1:py2, px1:px2].copy()

            results.append((x1, y1, x2, y2, car_id, plate_crop))

        return results, active_ids

    # ---------------- TRACKING ----------------
    def _match_or_create_id(self, bbox):
        for car_id, prev_bbox in self.tracks.items():
            if self._iou(prev_bbox, bbox) > 0.4:
                self.tracks[car_id] = bbox
                return car_id

        car_id = self.next_car_id
        self.tracks[car_id] = bbox
        self.next_car_id += 1
        return car_id
