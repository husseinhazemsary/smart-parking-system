# Reads Arabic text from license plate images

from paddleocr import PaddleOCR
import re

class PlateReader:
    def __init__(self):
        # PaddleOCR configured for Arabic
        # use_gpu=False: CPU inference (works on any machine)
        self.ocr_ar = PaddleOCR(
            lang="ar", 
            use_gpu=True,
            det_db_thresh=0.05,       # Lower threshold (default: 0.3)
            det_db_box_thresh=0.08,    # Lower box threshold (default: 0.5)
            det_db_unclip_ratio=3.0   # Larger text boxes (default: 1.5)
        )
        
        self.ocr_lat = PaddleOCR(
            lang="latin", 
            use_gpu=True,
            det_db_thresh=0.05,       # Lower threshold (default: 0.3)
            det_db_box_thresh=0.1,    # Lower box threshold (default: 0.5)
            det_db_unclip_ratio=2.5   # Larger text boxes (default: 1.5)
        )

    def read_plate(self, plate_img):
        if plate_img is None or plate_img.size == 0:
            return None
        # ---------- Arabic OCR FIRST ----------
        try:
            res_ar = self.ocr_ar.ocr(plate_img, cls=False)
            if res_ar and res_ar[0]:
                texts = []
                for line in res_ar[0]:
                    texts.append(line[1][0].strip())

                # Combine ALL Arabic OCR boxes (digits + letters)
                ar_text = " ".join(texts)
                print("OCR boxes:", res_ar[0])

                return ar_text

        except:
            pass

        # ---------- Latin OCR ONLY AS FALLBACK ----------
        try:
            res_lat = self.ocr_lat.ocr(plate_img, cls=False)
            if res_lat and res_lat[0]:
                lat_text = res_lat[0][0][1][0].strip()
                return lat_text
        except:
            pass

        return None
