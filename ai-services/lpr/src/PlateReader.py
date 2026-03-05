# Reads Arabic text from license plate images

from paddleocr import PaddleOCR
import re

class PlateReader:
    def __init__(self):
        self.ocr_ar = PaddleOCR(
            lang="ar", 
            use_gpu=True,
            det_db_thresh=0.05,
            det_db_box_thresh=0.08,
            det_db_unclip_ratio=3.0
        )
        self.ocr_lat = None  # Don't load until needed

    def read_plate(self, plate_img):
        if plate_img is None or plate_img.size == 0:
            return None

        try:
            res_ar = self.ocr_ar.ocr(plate_img, cls=False)
            if res_ar and res_ar[0]:
                texts = [line[1][0].strip() for line in res_ar[0]]
                ar_text = " ".join(texts)
                print("OCR boxes:", res_ar[0])
                return ar_text
        except:
            pass

        # Latin fallback — initialize only on first use
        try:
            if self.ocr_lat is None:
                self.ocr_lat = PaddleOCR(
                    lang="latin",
                    use_gpu=True,
                    det_db_thresh=0.05,
                    det_db_box_thresh=0.1,
                    det_db_unclip_ratio=2.5
                )
            res_lat = self.ocr_lat.ocr(plate_img, cls=False)
            if res_lat and res_lat[0]:
                return res_lat[0][0][1][0].strip()
        except:
            pass

        return None
    