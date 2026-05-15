import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import numpy as np
import cv2
from PIL import Image, ExifTags
import io
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PlateReader import PlateReader

app = FastAPI()
_reader = PlateReader()

def _format_plate(text: str) -> str:
    """Space out Arabic letter groups but keep digit groups intact.
    '٢٥٩ سجط' → '٢٥٩ س ج ط'
    """
    import re
    result = []
    for group in text.split():
        # Group contains Arabic letters → separate each character
        if re.search(r'[؀-ٰٟ-ۯ]', group):
            result.append(' '.join(group))
        else:
            result.append(group)
    return ' '.join(result)

_DEBUG_DIR = os.path.join(os.path.dirname(__file__), 'debug', 'scan_api')
os.makedirs(_DEBUG_DIR, exist_ok=True)

_request_counter = 0


@app.post("/scan-plate")
async def scan_plate(image: UploadFile = File(...)):
    global _request_counter
    _request_counter += 1
    req_id = _request_counter

    print(f"\n[SCAN #{req_id}] ---- incoming request ----")
    print(f"[SCAN #{req_id}] filename={image.filename!r}  content_type={image.content_type!r}")

    data = await image.read()
    print(f"[SCAN #{req_id}] received {len(data)} bytes")

    if len(data) == 0:
        print(f"[SCAN #{req_id}] ERROR: empty payload")
        return JSONResponse(
            {"plate": None, "confidence": 0.0, "valid": False, "debug": "empty payload"},
            status_code=400,
        )

    # Apply EXIF rotation before decoding — cv2.imdecode ignores EXIF orientation,
    # so camera shots arrive sideways/upside-down while gallery images are pre-rotated.
    try:
        pil_img = Image.open(io.BytesIO(data))
        exif = pil_img._getexif()
        if exif:
            orientation_key = next(
                (k for k, v in ExifTags.TAGS.items() if v == 'Orientation'), None
            )
            orientation = exif.get(orientation_key) if orientation_key else None
            rotation_map = {3: 180, 6: 270, 8: 90}
            if orientation in rotation_map:
                pil_img = pil_img.rotate(rotation_map[orientation], expand=True)
        img = cv2.cvtColor(np.array(pil_img.convert('RGB')), cv2.COLOR_RGB2BGR)
    except Exception:
        arr = np.frombuffer(data, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        print(f"[SCAN #{req_id}] ERROR: cv2.imdecode returned None — not a valid image")
        raw_path = os.path.join(_DEBUG_DIR, f"req{req_id}_raw.bin")
        with open(raw_path, "wb") as f:
            f.write(data)
        print(f"[SCAN #{req_id}] raw bytes saved → {raw_path}")
        return JSONResponse(
            {"plate": None, "confidence": 0.0, "valid": False, "debug": "imdecode failed"},
            status_code=400,
        )

    h, w = img.shape[:2]
    print(f"[SCAN #{req_id}] image decoded OK: {w}x{h} px")

    recv_path = os.path.join(_DEBUG_DIR, f"req{req_id}_received.jpg")
    cv2.imwrite(recv_path, img)
    print(f"[SCAN #{req_id}] saved received image → {recv_path}")

    annotated_path = os.path.join(_DEBUG_DIR, f"req{req_id}_annotated.jpg")
    filtered_text, raw_text, confidence = _reader.read_plate_with_boxes(
        img, debug_annotated_path=annotated_path
    )

    print(f"[SCAN #{req_id}] raw_text      = {raw_text!r}")
    print(f"[SCAN #{req_id}] filtered_text = {filtered_text!r}")
    print(f"[SCAN #{req_id}] confidence    = {confidence:.4f}")

    if filtered_text is None:
        print(f"[SCAN #{req_id}] result: NO PLATE DETECTED")
        return {"plate": None, "confidence": 0.0, "valid": False}

    formatted = _format_plate(filtered_text)
    print(f"[SCAN #{req_id}] formatted     = {formatted!r}")
    print(f"[SCAN #{req_id}] result: OK → {formatted!r}")
    return {"plate": formatted, "confidence": round(confidence, 4), "valid": True}
