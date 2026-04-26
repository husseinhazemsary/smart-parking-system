# Reads Arabic text from license plate images

from paddleocr import PaddleOCR
import logging
import cv2
import os
import re
import numpy as np

logging.getLogger("ppocr").setLevel(logging.WARNING)

class PlateReader:
    def __init__(self):
        _rec_model = os.path.join(os.path.dirname(__file__), "..", "models", "arabic_plates_rec")
        self.ocr_ar = PaddleOCR(
            lang="ar",
            rec_model_dir=_rec_model,          # fine-tuned model
            rec_char_dict_path=os.path.join(_rec_model, "dict.txt"),  # fine-tuned dict
            use_gpu=True,
        )
        # Force model weights to load now so the first real OCR call has no delay.
        self.ocr_ar.ocr(np.zeros((64, 128, 3), dtype=np.uint8), det=False, cls=False)

    def _preprocess(self, img):
        h, w = img.shape[:2]
        return cv2.resize(img, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)

    def _run_rec(self, img):
        """
        Run recognition-only OCR on a pre-cropped image region.
        With det=False, PaddleOCR returns [[(text, conf), ...]] — no bboxes.
        Returns list of (text, confidence) pairs.
        """
        res = self.ocr_ar.ocr(img, det=False, cls=False)
        if not res or not res[0]:
            return []
        pairs = []
        for item in res[0]:
            text = item[0].strip() if isinstance(item[0], str) else ""
            conf = float(item[1]) if len(item) > 1 else 0.0
            if text:
                pairs.append((text, conf))
        return pairs

    def read_plate_with_boxes(self, plate_img, debug_annotated_path=None):
        """
        Runs Arabic OCR on a plate crop (detection skipped — crop is already isolated).
        Crops out the top 30% header band ("مصر") before recognition.

        Returns (text, raw_text, confidence):
          - text:       recognized plate string (RTL-corrected), or None
          - raw_text:   model output before reversal (for debug), or None
          - confidence: avg recognition confidence
        """
        if plate_img is None or plate_img.size == 0:
            return None, None, 0.0

        try:
            img_h = plate_img.shape[0]
            cutoff_y = int(img_h * 0.30)
            body_crop = plate_img[cutoff_y:, :]

            if debug_annotated_path is not None:
                annotated = plate_img.copy()
                cv2.line(annotated, (0, cutoff_y), (annotated.shape[1], cutoff_y), (0, 165, 255), 2)
                cv2.putText(annotated, "DROP", (2, cutoff_y - 4),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
                cv2.putText(annotated, "KEEP", (2, cutoff_y + 12),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)
                os.makedirs(os.path.dirname(debug_annotated_path), exist_ok=True)
                cv2.imwrite(debug_annotated_path, annotated)

            pairs = self._run_rec(body_crop)

            has_digits  = any(re.search(r"[٠-٩]",                        t) for t, _ in pairs)
            has_letters = any(re.search(r"[\u0600-\u065F\u0670-\u06EF]", t) for t, _ in pairs)

            if not pairs or not has_digits or not has_letters:
                print(f"[OCR] Incomplete read (digits={'yes' if has_digits else 'no'}, "
                      f"letters={'yes' if has_letters else 'no'}) — retrying with preprocessing")
                pairs = self._run_rec(self._preprocess(body_crop))

            if not pairs:
                return None, None, 0.0

            texts = [t for t, _ in pairs]
            confs = [c for _, c in pairs]

            raw_text       = "".join(texts)
            filtered_text  = raw_text          # default model reads RTL natively — no reversal needed
            # NOTE: re-enable [::-1] when switching back to the finetuned model (reads LTR)
            avg_confidence = sum(confs) / len(confs)

            return filtered_text, raw_text, avg_confidence

        except Exception:
            return None, None, 0.0
