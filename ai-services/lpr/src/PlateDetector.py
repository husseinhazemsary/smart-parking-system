# Detects vehicles and their license plates using two YOLO models
# Model 1: General vehicle detector (cars, motorcycles, buses, trucks)
# Model 2: Custom trained license plate detector

import cv2
import numpy as np
from ultralytics import YOLO

class PlateDetector:
    def __init__(self):
        # YOLOv8 Nano pretrained on COCO — vehicle detector
        self.vehicle_model = YOLO("yolov8n.pt")
        self.vehicle_model.to('cuda')

        # Custom trained YOLOv8 Nano — license plate detector
        self.plate_model = YOLO("PlateDetectorNano.pt")
        self.plate_model.to('cuda')

        # COCO vehicle class IDs: car=2, motorcycle=3, bus=5, truck=7
        self.vehicle_classes = {2, 3, 5, 7}

        self.next_car_id = 0
        self.tracks = {}  # {car_id: bbox}

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

    def find_vehicles(self, frame):
        results = []
        active_ids = set()

        detections = self.vehicle_model(frame, verbose=False, device='cuda')[0]

        for box in detections.boxes:
            cls = int(box.cls[0])
            if cls not in self.vehicle_classes:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            bbox = (x1, y1, x2, y2)

            car_id = self._match_or_create_id(bbox)
            active_ids.add(car_id)

            plate_crop = None
            car_roi = frame[y1:y2, x1:x2]

            if car_roi.size > 0:
                plate_results = self.plate_model(car_roi, verbose=False, device='cuda')[0]

                if len(plate_results.boxes) > 0:
                    p = plate_results.boxes[0].xyxy[0]
                    px1, py1, px2, py2 = map(int, p)

                    px1 = max(0, px1)
                    py1 = max(0, py1)
                    px2 = min(car_roi.shape[1], px2)
                    py2 = min(car_roi.shape[0], py2)

                    plate_crop = car_roi[py1:py2, px1:px2].copy()

            results.append((x1, y1, x2, y2, car_id, plate_crop))

        # Remove tracks for cars no longer detected so stale IDs don't
        # accumulate or accidentally match new arrivals at old positions.
        for stale_id in list(self.tracks.keys()):
            if stale_id not in active_ids:
                del self.tracks[stale_id]

        return results, active_ids

    def _match_or_create_id(self, bbox):
        for car_id, prev_bbox in self.tracks.items():
            if self._iou(prev_bbox, bbox) > 0.4:
                self.tracks[car_id] = bbox
                return car_id

        car_id = self.next_car_id
        self.tracks[car_id] = bbox
        self.next_car_id += 1
        return car_id
