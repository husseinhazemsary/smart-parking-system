# Detects vehicles and their license plates using two YOLO models
# Model 1: General vehicle detector (cars, motorcycles, buses, trucks)
# Model 2: Custom trained license plate detector

import cv2
import numpy as np
from ultralytics import YOLO

class PlateDetector:
    def __init__(self):
        # Model 1: YOLOv8 Nano (pretrained COCO)
        # Vehicle detector (cars, motorcycles, buses, trucks)
        self.vehicle_model = YOLO("yolov8n.pt")
        self.vehicle_model.to('cpu')

        # Model 2: Custom trained YOLOv8 Nano
        # License plate detector
        self.plate_model = YOLO("PlateDetectorNano.pt")
        self.plate_model.to('cpu')

        # Vehicle classes from COCO dataset
        # 2: car, 3: motorcycle, 5: bus, 7: truck
        self.vehicle_classes = {2, 3, 5, 7}  
        
        # Tracking state 
        # Counter for assigning unique IDs to new cars
        self.next_car_id = 0
        # Dictionary that remembers where each car was last seen 
        self.tracks = {}  # {car_id: (x1, y1, x2, y2)}

    # IoU (Intersection over Union) Calculation
    def _iou(self, a, b):
        # Find intersection rectangle
        xA = max(a[0], b[0])    # Left edge
        yA = max(a[1], b[1])    # Top edge
        xB = min(a[2], b[2])    # Right edge
        yB = min(a[3], b[3])    # Bottom edge

        # Calculate intersection area
        inter = max(0, xB - xA) * max(0, yB - yA)
        if inter == 0:
            return 0.0

        # Calculate union area
        areaA = (a[2] - a[0]) * (a[3] - a[1])
        areaB = (b[2] - b[0]) * (b[3] - b[1])

        # IoU = Intersection / Union
        return inter / (areaA + areaB - inter)

    # Main method to find vehicles and their plates
    def find_vehicles(self, frame):
        results = []
        active_ids = set()

        # Detect all vehicles in frame
        detections = self.vehicle_model(frame, verbose=False, device='cpu')[0]

        for box in detections.boxes:
            cls = int(box.cls[0])
            
            # Filter: Only keep vehicles (ignore people, bikes, etc.)
            if cls not in self.vehicle_classes:
                continue

            # Extract bounding box
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            bbox = (x1, y1, x2, y2)

            # Track vehicle (assign persistent ID)
            car_id = self._match_or_create_id(bbox)
            active_ids.add(car_id)

            # Detect plate within vehicle ROI
            plate_crop = None
            car_roi = frame[y1:y2, x1:x2]   # Crop to vehicle only

            if car_roi.size > 0:
                # Run plate detector on vehicle crop
                plate_results = self.plate_model(car_roi, verbose=False, device='cpu')[0]

                if len(plate_results.boxes) > 0:
                    # Get first (highest confidence) plate detection
                    p = plate_results.boxes[0].xyxy[0]
                    px1, py1, px2, py2 = map(int, p)

                    # Bounds checking
                    px1 = max(0, px1)
                    py1 = max(0, py1)
                    px2 = min(car_roi.shape[1], px2)
                    py2 = min(car_roi.shape[0], py2)

                    # Extract plate crop
                    plate_crop = car_roi[py1:py2, px1:px2].copy()

            results.append((x1, y1, x2, y2, car_id, plate_crop))

        return results, active_ids

    # Assigns consistent IDs to vehicles across frames
    def _match_or_create_id(self, bbox):
        # Try to match with existing tracked vehicles
        for car_id, prev_bbox in self.tracks.items():
            if self._iou(prev_bbox, bbox) > 0.4: # 40% overlap threshold
                self.tracks[car_id] = bbox  # Update position
                return car_id

        # New vehicle detected - assign new ID
        car_id = self.next_car_id
        self.tracks[car_id] = bbox
        self.next_car_id += 1
        return car_id