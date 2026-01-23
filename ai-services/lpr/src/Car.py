# Car class to track vehicles and their license plates

import time
import os
import cv2
import re


class Car:
    def __init__(self, car_id, bbox):
        self.id = car_id    # Unique identifier

        # Position - Bounding box
        self.x1, self.y1, self.x2, self.y2 = bbox

        # Plate logic
        self.plate_candidates = []  # All OCR readings
        self.final_plate = None  # Locked plate text
        self.last_seen = time.time()
        self.printed = False

        # Visualization
        self.color = (0, 255, 0) # Green box

        # Debug saving
        self.saved_debug = False

    # Update bounding box
    def update_bbox(self, bbox):
        # Update position (called every frame vehicle is detected)
        self.x1, self.y1, self.x2, self.y2 = bbox
        self.last_seen = time.time()    # Reset timeout

    # Attempt to read plate from given image crop
    def try_read_plate(self, plate_img):
        """
        Simpler validation logic used in early versions.
        Current system uses validation in main_clean.py instead.
        """
        from src.PlateReader import PlateReader
        reader = PlateReader()

        text = reader.read_plate(plate_img)
        if not text:
            return

        text = str(text).strip()

        # FILTER 1: Reject country labels
        if text.lower() in {"egypt", "مصر"}:
            return

        # FILTER 2: Must have Arabic content
        if not re.search(r"[0-9\u0621-\u064A]", text):
            return

        # FILTER 3: Minimum length
        if len(text) < 4:
            return

        #  Add to candidates
        self.plate_candidates.append(text)

        # STABILITY CHECK: Lock after 2 identical reads
        if self.plate_candidates.count(text) >= 2:
            self.final_plate = text
            self._save_debug_plate(plate_img)

    # Debug: Save plate image once final plate is determined
    def _save_debug_plate(self, plate_img):
        if self.saved_debug:
            return

        os.makedirs("debug/plates", exist_ok=True)

        path = f"debug/plates/car_{self.id}_{self.final_plate}.jpg"
        cv2.imwrite(path, plate_img)

        self.saved_debug = True