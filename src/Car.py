import time
import os
import cv2
import re


class Car:
    def __init__(self, car_id, bbox):
        self.id = car_id

        # Bounding box
        self.x1, self.y1, self.x2, self.y2 = bbox

        # Plate logic
        self.plate_candidates = []
        self.final_plate = None
        self.last_seen = time.time()
        self.printed = False

        # Visualization
        self.color = (0, 255, 0)

        # Debug saving
        self.saved_debug = False

    # ---------------- UPDATE ----------------
    def update_bbox(self, bbox):
        self.x1, self.y1, self.x2, self.y2 = bbox
        self.last_seen = time.time()

    # ---------------- OCR ----------------
    def try_read_plate(self, plate_img):
        """
        Try OCR until we lock a final REAL plate (not headers like Egypt).
        """
        from src.PlateReader import PlateReader
        reader = PlateReader()

        text = reader.read_plate(plate_img)
        if not text:
            return

        text = str(text).strip()

        # ❌ Reject very short
        if len(text) < 4:
            return

        # ❌ Reject known header-only words
        lower = text.lower()
        if lower in ["egypt", "arab republic", "مصر", "جمهورية", "العربية"]:
            return

        # ❌ Must contain at least one digit (Arabic or English)
        if not re.search(r"[0-9٠-٩]", text):
            return

        self.plate_candidates.append(text)

        # ✅ Lock only after repetition
        if self.plate_candidates.count(text) >= 2:
            self.final_plate = text
            self._save_debug_plate(plate_img)

    # ---------------- DEBUG ----------------
    def _save_debug_plate(self, plate_img):
        if self.saved_debug:
            return

        os.makedirs("debug/plates", exist_ok=True)
        path = f"debug/plates/car_{self.id}_{self.final_plate}.jpg"
        cv2.imwrite(path, plate_img)

        self.saved_debug = True
