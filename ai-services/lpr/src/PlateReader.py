# Reads Arabic text from license plate images

from paddleocr import PaddleOCR
import logging
import cv2
import os
import re

logging.getLogger("ppocr").setLevel(logging.WARNING)

class PlateReader:
    def __init__(self):
        self.ocr_ar = PaddleOCR(
            lang="ar",
            use_gpu=True,
            det_db_thresh=0.05,
            det_db_box_thresh=0.08,
            det_db_unclip_ratio=3.0
        )
        # Force model weights to load now so the first real OCR call has no delay.
        # PaddleOCR lazy-loads its detection and recognition models on the first
        # actual inference call — without this, the first plate read mid-stream
        # causes a visible freeze while weights are loaded into GPU memory.
        import numpy as np
        self.ocr_ar.ocr(np.zeros((64, 128, 3), dtype=np.uint8), cls=False)

    def _preprocess(self, img):
        """
        Upscale 2x. Used as a fallback when the first OCR pass finds no digits.
        Larger image gives the DB detector more pixels per stroke, pushing low-scoring
        regions above det_db_thresh without altering stroke shapes the way CLAHE can.
        """
        h, w = img.shape[:2]
        return cv2.resize(img, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)

    def read_plate_with_boxes(self, plate_img, debug_annotated_path=None):
        """
        Runs Arabic OCR and discards text blocks whose vertical center falls in
        the top 30% of the image — the country header band ("EGYPT" / "مصر").

        Returns (filtered_text, raw_text):
          - filtered_text: surviving text joined into a single string, or None
          - raw_text:      all text before filtering, for debug logging, or None
        Both are None if OCR returns no results or the image is invalid.
        """
        if plate_img is None or plate_img.size == 0:
            return None, None, 0.0

        try:
            res_ar = self.ocr_ar.ocr(plate_img, cls=False)

            # If the first pass returned no results or no Arabic digits, retry with
            # a 2x upscaled version. This handles plates where the digit region scores
            # below det_db_thresh on the original crop — more pixels per stroke pushes
            # the probability map above the threshold without altering stroke shapes.
            # Plates that already produced digits on the first pass are left untouched.
            if not res_ar or not res_ar[0] or not any(
                re.search(r"[٠-٩]", line[1][0]) for line in res_ar[0]
            ):
                print("[OCR] No digits on first pass — retrying with preprocessing")
                plate_img = self._preprocess(plate_img)
                res_ar = self.ocr_ar.ocr(plate_img, cls=False)

            if not res_ar or not res_ar[0]:
                return None, None, 0.0

            img_h = plate_img.shape[0]
            header_cutoff = img_h * 0.30  # top 30% is the header band

            raw_texts = []
            filtered_texts = []
            filtered_confidences = []

            for line in res_ar[0]:
                bbox       = line[0]           # [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]
                text       = line[1][0].strip()
                confidence = line[1][1]        # float in [0, 1]
                vertical_center = (bbox[0][1] + bbox[2][1]) / 2

                raw_texts.append(text)

                if vertical_center >= header_cutoff:
                    filtered_texts.append(text)
                    filtered_confidences.append(confidence)

            raw_text      = " ".join(raw_texts)      if raw_texts      else None
            filtered_text = " ".join(filtered_texts) if filtered_texts else None
            avg_confidence = (sum(filtered_confidences) / len(filtered_confidences)
                              if filtered_confidences else 0.0)

            if debug_annotated_path is not None:
                annotated = plate_img.copy()
                cutoff_y = int(img_h * 0.30)

                # Horizontal line showing the 30% header cutoff
                cv2.line(annotated, (0, cutoff_y), (annotated.shape[1], cutoff_y), (0, 165, 255), 1)
                cv2.putText(annotated, "30%", (2, cutoff_y - 3),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0, 165, 255), 1)

                for i, line in enumerate(res_ar[0], start=1):
                    bbox = line[0]
                    text = line[1][0].strip()
                    vertical_center = (bbox[0][1] + bbox[2][1]) / 2
                    kept = vertical_center >= cutoff_y

                    print(f"[OCR] region {i}: text={text!r} y_center={int(vertical_center)} {'KEEP' if kept else 'DROP'}")

                    color = (0, 255, 0) if kept else (0, 0, 255)  # green kept, red discarded
                    pts = [(int(p[0]), int(p[1])) for p in bbox]
                    cv2.rectangle(annotated, pts[0], pts[2], color, 1)
                    # Label shows vertical center — more useful than text since cv2 can't render Arabic
                    label = f"y={int(vertical_center)} ({'keep' if kept else 'drop'})"
                    cv2.putText(annotated, label, (pts[0][0], pts[0][1] - 3),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1)

                os.makedirs(os.path.dirname(debug_annotated_path), exist_ok=True)
                cv2.imwrite(debug_annotated_path, annotated)

            return filtered_text, raw_text, avg_confidence

        except Exception:
            return None, None, 0.0
