from paddleocr import PaddleOCR


class PlateReader:
    def __init__(self):
        self.ocr = PaddleOCR(lang="ar", use_gpu=False)

    def read_plate(self, plate_img):
        if plate_img is None or plate_img.size == 0:
            return None

        result = self.ocr.ocr(plate_img, cls=False)

        if not result or not result[0]:
            return None

        try:
            text = result[0][0][1][0]
            return text.strip()
        except Exception:
            return None
