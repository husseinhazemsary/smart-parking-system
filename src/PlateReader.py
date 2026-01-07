# Reads Arabic text from license plate images

from paddleocr import PaddleOCR

class PlateReader:
    def __init__(self):
        # PaddleOCR configured for Arabic
        # use_gpu=False: CPU inference (works on any machine)
        self.ocr = PaddleOCR(lang="ar", use_gpu=False)

    def read_plate(self, plate_img):
        # Safety checks 
        if plate_img is None or plate_img.size == 0:
            return None

        # Run OCR 
        # cls=False: Don't classify text angle (faster) 
        result = self.ocr.ocr(plate_img, cls=False)

        # Parse result structure
        if not result or not result[0]:
            return None

        try:
            # Extract text from first detection
            text = result[0][0][1][0]
            return text.strip()
        except Exception:
            return None
