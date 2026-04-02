"""
test_ocr_on_images.py

Bypasses vehicle detection and plate detection entirely.
Feeds a plate image (or folder of images) directly to PlateReader
to test OCR quality — useful for evaluating dirty/degraded plates
without needing a video or running the full pipeline.

Usage:
    python test_ocr_on_images.py path/to/plate.jpg
    python test_ocr_on_images.py path/to/folder/
"""

import os
os.environ["CUDNN_PATH"] = os.path.join(os.path.dirname(__file__), "venv", "Lib", "site-packages", "nvidia", "cudnn")

import sys
import re
import cv2

from src.PlateReader import PlateReader

SAVE_DEBUG_ANNOTATED = True   # Save annotated image with bounding boxes to debug/ocr_image_test/
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}


# --- Helpers (duplicated from main.py to avoid importing it, since main.py runs on import) ---

def extract_plate_components(filtered_text):
    if not filtered_text:
        return None, []

    digits  = re.findall(r"[٠-٩]", filtered_text)
    letters = re.findall(r"[ء-ي]", filtered_text)

    digits_str = "".join(digits) if digits else None

    if len(letters) > 3:
        letters = letters[-3:]

    return digits_str, letters


def valid_egyptian_plate(text):
    if not text:
        return False
    if re.search(r"[A-Za-z]", text):
        return False

    text = re.sub(r"\s+", " ", text).strip()
    arabic_digits  = re.findall(r"[٠-٩]", text)
    arabic_letters = re.findall(r"[ء-ي]", text)

    if not (2 <= len(arabic_letters) <= 3):
        return False
    if not (3 <= len(arabic_digits) <= 4):
        return False

    return True


# --- Core test function ---

def test_image(image_path, reader):
    img = cv2.imread(image_path)
    if img is None:
        print(f"[ERROR] Could not read image: {image_path}")
        return

    basename = os.path.splitext(os.path.basename(image_path))[0]
    debug_path = None
    if SAVE_DEBUG_ANNOTATED:
        os.makedirs("debug/ocr_image_test", exist_ok=True)
        debug_path = f"debug/ocr_image_test/{basename}_annotated.jpg"

    print(f"\n{'='*60}")
    print(f"[IMAGE] {image_path}  ({img.shape[1]}x{img.shape[0]})")

    filtered_text, raw_text, avg_confidence = reader.read_plate_with_boxes(
        img, debug_annotated_path=debug_path
    )

    print(f"  OCR Raw:        '{raw_text or 'NULL'}'")
    print(f"  OCR Filtered:   '{filtered_text or 'NULL'}'")
    print(f"  Confidence:     {avg_confidence:.2f}")

    digits, letters = extract_plate_components(filtered_text)
    print(f"  Digits found:   '{digits or 'NULL'}'")
    print(f"  Letters found:  {letters}")

    if digits and letters:
        plate_text = f"{digits} {' '.join(letters)}"
    elif digits:
        plate_text = digits
    else:
        plate_text = None

    if plate_text and valid_egyptian_plate(plate_text):
        print(f"  Validation:     PASS")
        print(f"  Plate:          {plate_text}")
    else:
        print(f"  Validation:     FAIL — '{plate_text or 'no readable text'}'")

    if SAVE_DEBUG_ANNOTATED and debug_path:
        print(f"  Annotated:      {debug_path}")

    print(f"{'='*60}")


# --- Entry point ---

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_ocr_on_images.py <image_or_folder>")
        sys.exit(1)

    target = sys.argv[1]
    reader = PlateReader()

    if os.path.isdir(target):
        images = [
            os.path.join(target, f)
            for f in sorted(os.listdir(target))
            if os.path.splitext(f)[1].lower() in SUPPORTED_EXTENSIONS
        ]
        if not images:
            print(f"[ERROR] No supported images found in: {target}")
            sys.exit(1)
        print(f"[INFO] Found {len(images)} image(s) in {target}")
        for path in images:
            test_image(path, reader)
    elif os.path.isfile(target):
        test_image(target, reader)
    else:
        print(f"[ERROR] Path not found: {target}")
        sys.exit(1)


if __name__ == "__main__":
    main()
