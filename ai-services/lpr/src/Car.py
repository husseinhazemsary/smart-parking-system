# Car class to track vehicles and their license plates

import time


class Car:
    def __init__(self, car_id, bbox):
        self.id = car_id

        self.x1, self.y1, self.x2, self.y2 = bbox

        self.plate_candidates = []       # list of (text, confidence) OCR reads
        self.final_plate = None          # locked plate text once stable
        self.last_seen = time.time()
        self.latest_plate_crop = None    # most recent plate image crop from background detection
        self.last_plate_process_frame = -999  # frame index of last OCR attempt

    def update_bbox(self, bbox):
        self.x1, self.y1, self.x2, self.y2 = bbox
        self.last_seen = time.time()
