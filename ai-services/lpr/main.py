import os
os.environ["CUDNN_PATH"] = os.path.join(os.path.dirname(__file__), "venv", "Lib", "site-packages", "nvidia", "cudnn")
import cv2
import time
import re
from db.db import check_access

from src.Car import Car
from src.PlateDetector import PlateDetector
from src.PlateReader import PlateReader
from src.utils.draw_arabic import draw_arabic_text_box
import logging
logging.getLogger("ppocr").setLevel(logging.WARNING)

last_gate_open_time = 0
GATE_COOLDOWN = 5  # seconds before the gate can open again

def extract_plate_components(filtered_text):
    """
    Extracts Arabic digits and letters from position-filtered OCR text.

    Digits: take all of them — the header band contains no Arabic digits so
            every digit in filtered_text is plate content.
    Letters: if more than 3 found, take only the last 2-3 — OCR reads blocks
             top-to-bottom so any residual header letters (مصر = م،ص،ر) appear
             earlier in the string than the actual plate letters, which sit in
             the lower portion of the plate image.
    Returns (digits_str, letters_list). digits_str is None when no digits found.
    """
    if not filtered_text:
        return None, []

    digits  = re.findall(r"[٠-٩]", filtered_text)
    letters = re.findall(r"[ء-ي]", filtered_text)

    digits_str = "".join(digits) if digits else None

    if len(letters) > 3:
        letters = letters[-3:]

    return digits_str, letters

# --- Configuration ---

INPUT_VIDEO = "input/video.mp4"
OUTPUT_VIDEO = "output/output_video_rm_header.mp4"

FONT_PATH = "fonts/Amiri-Regular.ttf"

# Set to True to print OCR results and show per-frame debug overlays
DEBUG_MODE = True
DEBUG_SAVE_PLATES = True       # Save detected plate crops to debug/plate_crops/
DEBUG_SHOW_OCR_RESULTS = True  # Print OCR output per frame to console

# Lenient mode accepts partial reads (digits or letters only).
# Useful for fast-moving cars where the full plate isn't captured in a single frame.
USE_LENIENT_VALIDATION = False

# When True, only the car inside the defined gate zone is processed.
# When False, the largest (closest) car in the frame is processed instead.
# Use gate zone mode for fixed cameras at parking entries.
USE_GATE_ZONE = False

# Relative gate zone bounds expressed as fractions of frame dimensions.
# Avoids hardcoding pixel coordinates so the config works across different camera setups.
GATE_ZONE_RELATIVE = {
    'x_start': 0.2,   # 20% from left edge
    'x_end': 0.8,     # 80% from left edge (covers the center 60% of frame width)
    'y_start': 0.6,   # 60% from top (lower portion of frame)
    'y_end': 0.95,    # 95% from top (near bottom)
}

# Computed from GATE_ZONE_RELATIVE and actual frame dimensions at runtime
GATE_ZONE = None

MAX_IDLE_TIME = 2.0  # seconds before a car is dropped from tracking if not re-detected

# Two-tier processing strategy:
# - Background tier: detect all vehicles at a slow rate to keep tracking alive without overloading the CPU
# - Gate tier: process the selected gate car at high frequency to minimize plate recognition latency
BACKGROUND_VEHICLE_DETECT_EVERY_N = 7  # run full vehicle detection every N frames
GATE_CAR_PROCESS_EVERY_N = 1           # process gate car every frame for maximum responsiveness
GATE_CAR_OCR_EVERY_N = 4               # run OCR every N frames to reduce compute on the gate car

# Minimum number of identical OCR reads before a plate is accepted as stable
PLATE_STABILITY_COUNT = 2

# --- Helper Functions ---

def valid_egyptian_plate(text):
    """
    Strict validation for Egyptian license plate format.
    Requires 2-3 Arabic letters and at least 3 Arabic digits.
    Rejects any text containing Latin characters.

    Egyptian plates use exactly 2 letters for private cars (e.g. "م ي ١٧٢٣")
    and exactly 3 letters for other vehicle categories (e.g. "و م ط ٧٢٣").
    Both formats must be accepted; requiring exactly 2 was silently rejecting
    valid 3-letter plates.
    """
    if not text:
        return False

    if re.search(r"[A-Za-z]", text):
        return False

    text = re.sub(r"\s+", " ", text).strip()

    arabic_digits = re.findall(r"[٠-٩]", text)
    arabic_letters = re.findall(r"[ء-ي]", text)

    # Accept 2-letter plates (private cars) and 3-letter plates (other categories).
    # Anything outside this range is noise or an unrecognised format.
    if not (2 <= len(arabic_letters) <= 3):
        return False
    if len(arabic_digits) < 3:
        return False

    return True


def lenient_egyptian_plate(text):
    """
    Lenient validation that accepts partial plate reads.
    Useful for fast-moving cars where OCR reads digits/letters separately.
    Returns True if text contains valid Egyptian plate components.
    """
    if not text:
        return False

    if re.search(r"[A-Za-z]", text):
        return False

    # Reject known false positives such as country header text misread as plate content
    text_clean = re.sub(r"\s+", "", text.strip().lower())
    false_positives = ["egypt", "مصر", "ملصر", "eypt", "egpt", "gypt"]
    if text_clean in false_positives:
        return False

    text = re.sub(r"\s+", " ", text).strip()

    if not re.search(r"[٠-٩ء-ي]", text):
        return False

    arabic_digits = re.findall(r"[٠-٩]", text)
    arabic_letters = re.findall(r"[ء-ي]", text)

    # Accept if the read contains a meaningful digit or letter component
    if len(arabic_digits) >= 2:
        return True

    if len(arabic_letters) >= 2:
        return True

    if len(arabic_letters) >= 1 and len(arabic_digits) >= 2:
        return True

    return False


def choose_gate_car(cars, gate_zone):
    """
    Selects the most relevant car inside the gate zone.
    Scores candidates by vertical depth (closer to gate), bounding box size
    (closer to camera), and horizontal centering (aligned with gate).
    Returns the car object or None if no car is inside the zone.
    """
    if gate_zone is None:
        return None

    gx1, gy1, gx2, gy2 = gate_zone
    gate_center_x = (gx1 + gx2) // 2
    candidates = []

    for car in cars.values():
        cx = (car.x1 + car.x2) // 2
        cy = (car.y1 + car.y2) // 2

        if gx1 <= cx <= gx2 and gy1 <= cy <= gy2:
            depth = cy
            size = (car.x2 - car.x1) * (car.y2 - car.y1)
            center_offset = abs(cx - gate_center_x)

            # Prioritize cars that are deeper (nearer the gate) and larger (nearer the camera);
            # penalize cars that are off-center relative to the gate midpoint
            score = depth * 2.0 + size * 0.01 - center_offset * 0.5
            candidates.append((score, car))

    if not candidates:
        return None

    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


def try_open_gate_with_db(plate_text):
    """
    Checks the detected plate against the database and opens the gate if access is granted.
    Enforces a cooldown period between consecutive gate openings to prevent rapid re-triggering.
    """
    global gate_open, gate_open_plate, last_gate_open_time

    decision, reason = check_access(plate_text)
    print(f"[DB] Decision: {decision} | Reason: {reason}")

    now = time.time()
    if decision == "GRANTED" and now - last_gate_open_time > GATE_COOLDOWN:
        gate_open = True
        gate_open_plate = plate_text
        last_gate_open_time = now
        print("[GATE] Gate opened (DB authorized)")
        return True

    print("[GATE] Access denied by DB")
    return False


def choose_closest_car(cars):
    """
    Returns the car with the largest bounding box, assumed to be the closest to the camera.
    Used when gate zone mode is disabled.
    """
    if not cars:
        return None

    return max(cars.values(), key=lambda c: (c.x2 - c.x1) * (c.y2 - c.y1))


def select_gate_car(cars, gate_zone, use_gate_zone):
    """
    Selects the car to process based on the active mode.
    Uses gate zone selection or closest-car fallback depending on USE_GATE_ZONE.
    """
    if use_gate_zone:
        return choose_gate_car(cars, gate_zone)
    else:
        return choose_closest_car(cars)


def reconstruct_plate_from_partials(candidates):
    """
    Reconstructs a full Egyptian plate from a list of partial OCR reads.
    Example: ['٧٢٣', '١٧٢٣', 'م ي'] → '١٧٢٣ م ي'

    Finds the most frequent digit sequence (≥3 digits) and letter pair (exactly 2 letters)
    across all candidates, then combines them into the standard Egyptian format.
    Returns the reconstructed plate string, or None if insufficient data.
    """
    if not candidates or len(candidates) < 2:
        return None

    digit_parts = []
    letter_parts = []

    for candidate in candidates:
        text = re.sub(r"\s+", " ", str(candidate).strip())

        digits = re.findall(r"[٠-٩]", text)
        letters = re.findall(r"[ء-ي]", text)

        if len(digits) >= 3:
            digit_str = ''.join(digits)
            digit_parts.append(digit_str)

        # Collect letter groups of 2 or 3, matching the two valid Egyptian plate formats.
        # The old exact-2 check caused 3-letter plates to never contribute letters to
        # letter_parts, leaving letter_parts empty and making reconstruction always fail.
        if 2 <= len(letters) <= 3:
            letter_str = ' '.join(letters)
            letter_parts.append(letter_str)

    from collections import Counter

    best_digits = None
    if digit_parts:
        digit_counter = Counter(digit_parts)
        most_common_digits = digit_counter.most_common(1)
        if most_common_digits and most_common_digits[0][1] >= 1:
            best_digits = most_common_digits[0][0]

    best_letters = None
    if letter_parts:
        letter_counter = Counter(letter_parts)
        most_common_letters = letter_counter.most_common(1)
        if most_common_letters and most_common_letters[0][1] >= 1:
            best_letters = most_common_letters[0][0]

    if best_digits and best_letters:
        # Egyptian format: digit group followed by letter pair (e.g. "١٧٢٣ م ي")
        reconstructed = f"{best_digits} {best_letters}"
        return reconstructed

    return None

def detect_and_read_plate(frame, car, plate_detector, plate_reader, frame_index,
                          debug_mode=False, save_plates=False, predetected_crop=None):
    """
    Extracts and reads the license plate for a given car in the current frame.

    If a pre-detected plate crop is provided (from background detection), it is used directly
    to avoid redundant YOLO inference. Otherwise, falls back to running the plate detector
    on the car's bounding box region.

    Returns (plate_text, debug_info). plate_text is None if detection or validation fails.
    """
    debug_info = {
        'plate_detected': False,
        'plate_crop_size': None,
        'ocr_raw': None,
        'ocr_filtered': None,
        'digits_found': None,
        'letters_found': [],
        'validation_passed': False,
        'rejection_reason': None
    }

    if predetected_crop is not None and predetected_crop.size > 0:
        # Reuse the crop already found during background detection — skip YOLO
        plate_img = predetected_crop
        debug_info['plate_detected'] = True
    else:
        # No pre-detected crop available: run plate YOLO on the car's region of interest
        x1, y1, x2, y2 = car.x1, car.y1, car.x2, car.y2
        car_roi = frame[y1:y2, x1:x2]

        if car_roi.size == 0:
            debug_info['rejection_reason'] = "Empty car ROI"
            return None, debug_info

        plate_results = plate_detector.plate_model(car_roi, verbose=False)[0]

        if len(plate_results.boxes) == 0:
            debug_info['rejection_reason'] = "No plate detected by YOLO"
            return None, debug_info

        debug_info['plate_detected'] = True

        p = plate_results.boxes[0].xyxy[0]
        px1, py1, px2, py2 = map(int, p)

        px1 = max(0, px1)
        py1 = max(0, py1)
        px2 = min(car_roi.shape[1], px2)
        py2 = min(car_roi.shape[0], py2)

        plate_img = car_roi[py1:py2, px1:px2].copy()

        if plate_img.size == 0:
            debug_info['rejection_reason'] = "Empty plate crop"
            return None, debug_info

    debug_info['plate_crop_size'] = f"{plate_img.shape[1]}x{plate_img.shape[0]}"

    # Reject crops that are too small for reliable OCR
    if plate_img.shape[1] < 60 or plate_img.shape[0] < 28:
        debug_info['rejection_reason'] = "Plate too small"
        return None, debug_info

    if save_plates:
        import os
        os.makedirs("debug/plate_crops", exist_ok=True)
        cv2.imwrite(
            f"debug/plate_crops/car_{car.id}_frame_{frame_index}.jpg",
            plate_img
        )

    debug_annotated_path = None
    if save_plates:
        debug_annotated_path = f"debug/plate_boxes/car_{car.id}_frame_{frame_index}.jpg"

    filtered_text, raw_text = plate_reader.read_plate_with_boxes(plate_img, debug_annotated_path=debug_annotated_path)
    debug_info['ocr_raw']      = raw_text      if raw_text      else "NULL"
    debug_info['ocr_filtered'] = filtered_text if filtered_text else "NULL"

    if not filtered_text:
        debug_info['rejection_reason'] = "OCR returned empty"
        return None, debug_info

    digits, letters = extract_plate_components(filtered_text)
    debug_info['digits_found']  = digits  if digits  else "NULL"
    debug_info['letters_found'] = letters if letters else []

    if digits and len(digits) >= 3:
        debug_info['validation_passed'] = True

        # Store letters whenever the count matches a valid Egyptian format (2 or 3 letters).
        # Previously this required exactly 2, so all 3-letter plate reads were stripped to
        # digits-only before being added to plate_candidates, meaning the letter portion
        # was never available for reconstruction.
        if 2 <= len(letters) <= 3:
            plate_text = f"{digits} {' '.join(letters)}"
        else:
            # No usable letter group found — store digits alone so the reconstruction
            # step can still pair them with letters captured in other reads.
            plate_text = digits

        return plate_text, debug_info

    debug_info['rejection_reason'] = f"No valid digits after filtering: '{filtered_text}'"
    return None, debug_info


# --- Initialization ---

cap = cv2.VideoCapture(INPUT_VIDEO)
assert cap.isOpened(), "Failed to open input video"

fps = cap.get(cv2.CAP_PROP_FPS)
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# Convert relative gate zone bounds to absolute pixel coordinates now that frame size is known
if USE_GATE_ZONE:
    GATE_ZONE = (
        int(w * GATE_ZONE_RELATIVE['x_start']),
        int(h * GATE_ZONE_RELATIVE['y_start']),
        int(w * GATE_ZONE_RELATIVE['x_end']),
        int(h * GATE_ZONE_RELATIVE['y_end']),
    )
else:
    GATE_ZONE = None

writer = cv2.VideoWriter(
    OUTPUT_VIDEO,
    cv2.VideoWriter_fourcc(*"mp4v"),
    fps,
    (w, h),
)

plate_detector = PlateDetector()
plate_reader = PlateReader()

cars = {}
frame_index = 0
gate_open = False
gate_open_plate = None

print("[INFO] Parking gate system started")
print(f"[INFO] Video FPS: {fps}")
print(f"[INFO] Frame dimensions: {w}x{h}")
print(f"[INFO] Debug mode: {'ENABLED' if DEBUG_MODE else 'DISABLED'}")
if DEBUG_SAVE_PLATES:
    print(f"[INFO] Plate crops will be saved to: debug/plate_crops/")
print(f"[INFO] Validation mode: {'LENIENT (accepts partial reads)' if USE_LENIENT_VALIDATION else 'STRICT (full plate required)'}")
print(f"[INFO] Gate zone mode: {'ENABLED' if USE_GATE_ZONE else 'DISABLED (processing closest car)'}")
if USE_GATE_ZONE:
    print(f"[INFO] Gate zone (adaptive): {GATE_ZONE}")
print(f"[INFO] Background vehicle detection: every {BACKGROUND_VEHICLE_DETECT_EVERY_N} frames")
print(f"[INFO] Gate car processing: every {GATE_CAR_PROCESS_EVERY_N} frames")
print(f"[INFO] Plate stability required: {PLATE_STABILITY_COUNT} identical reads")

cv2.namedWindow("Parking Gate", cv2.WINDOW_NORMAL)
cv2.resizeWindow("Parking Gate", 1280, 720)

# --- Main Loop ---

while True:
    ret, frame = cap.read()
    if not ret:
        break

    current_time = time.time()
    frame_index += 1

    # 1) Background: detect all vehicles at a slow rate to maintain tracking
    if frame_index % BACKGROUND_VEHICLE_DETECT_EVERY_N == 0:
        detections, active_ids = plate_detector.find_vehicles(frame)

        for det in detections:
            x1, y1, x2, y2, car_id, plate_crop = det

            if car_id not in cars:
                cars[car_id] = Car(car_id, (x1, y1, x2, y2))
                cars[car_id].last_plate_process_frame = -999
                cars[car_id].plate_candidates = []
            else:
                cars[car_id].update_bbox((x1, y1, x2, y2))

            cars[car_id].latest_plate_crop = plate_crop

        # Remove cars not re-detected within the idle timeout
        for cid in list(cars.keys()):
            if current_time - cars[cid].last_seen > MAX_IDLE_TIME:
                del cars[cid]

    # 2) Foreground: run intensive plate recognition on the selected gate car
    gate_car = select_gate_car(cars, GATE_ZONE, USE_GATE_ZONE)

    if gate_car is not None and not gate_car.final_plate:

        if frame_index % GATE_CAR_PROCESS_EVERY_N == 0:

            if not hasattr(gate_car, 'last_plate_process_frame'):
                gate_car.last_plate_process_frame = -999

            if frame_index - gate_car.last_plate_process_frame >= GATE_CAR_OCR_EVERY_N:
                gate_car.last_plate_process_frame = frame_index

                plate_text, debug_info = detect_and_read_plate(
                    frame,
                    gate_car,
                    plate_detector,
                    plate_reader,
                    frame_index,
                    debug_mode=DEBUG_MODE,
                    save_plates=DEBUG_SAVE_PLATES,
                    predetected_crop=getattr(gate_car, 'latest_plate_crop', None)
                )

                if DEBUG_MODE and DEBUG_SHOW_OCR_RESULTS:
                    status = "✓" if debug_info['validation_passed'] else "✗"
                    print(f"[DEBUG] Frame {frame_index} | Car {gate_car.id} | {status}")
                    print(f"  └─ Plate Detected: {debug_info['plate_detected']}")
                    if debug_info['plate_detected']:
                        print(f"  └─ Crop Size:     {debug_info['plate_crop_size']}")
                        print(f"  └─ OCR Raw:       '{debug_info['ocr_raw']}'")
                        print(f"  └─ OCR Filtered:  '{debug_info['ocr_filtered']}'")
                        print(f"  └─ Digits found:  '{debug_info['digits_found']}'")
                        print(f"  └─ Letters found: {debug_info['letters_found']}")
                    if debug_info['validation_passed']:
                        print(f"  └─ ✓ VALID PLATE")
                    else:
                        print(f"  └─ ✗ Rejection: {debug_info['rejection_reason']}")

                if plate_text:
                    if not hasattr(gate_car, 'plate_candidates'):
                        gate_car.plate_candidates = []

                    gate_car.plate_candidates.append(plate_text)

                    if DEBUG_MODE:
                        print(f"  └─ Added to candidates. Total: {len(gate_car.plate_candidates)}")

                    # After 3+ reads, attempt full plate reconstruction from partial OCR results.
                    # Collecting multiple reads allows both digit and letter parts to be captured.
                    if len(gate_car.plate_candidates) >= 3:
                        full_plate = reconstruct_plate_from_partials(gate_car.plate_candidates)

                        if full_plate and valid_egyptian_plate(full_plate):
                            gate_car.final_plate = full_plate

                            print(f"\n{'='*60}")
                            print(f"[ENTRY] Plate detected: {full_plate}")
                            print(f"[INFO] Reconstructed from: {gate_car.plate_candidates}")

                            try_open_gate_with_db(full_plate)

                            print(f"[TIMING] Approximate time: {frame_index / fps:.2f}s")
                            print(f"{'='*60}\n")

                    # Fallback: after 6+ failed reconstruction attempts, accept the most
                    # frequently seen partial read if it meets the stability threshold
                    if not gate_car.final_plate and len(gate_car.plate_candidates) >= 6:
                        from collections import Counter
                        counts = Counter(gate_car.plate_candidates)
                        most_common_text, count = counts.most_common(1)[0]

                        if count >= PLATE_STABILITY_COUNT:
                            gate_car.final_plate = most_common_text

                            print(f"\n{'='*60}")
                            print(f"[ENTRY] Plate detected (partial): {most_common_text}")
                            print(f"[WARNING] Could not reconstruct full plate")
                            print(f"[INFO] All candidates: {gate_car.plate_candidates}")

                            try_open_gate_with_db(most_common_text)

                            print(f"[TIMING] Approximate time: {frame_index / fps:.2f}s")
                            print(f"{'='*60}\n")

    # 3) Visualization: draw overlays on every frame

    for car in cars.values():
        cv2.rectangle(
            frame,
            (car.x1, car.y1),
            (car.x2, car.y2),
            (0, 255, 0),
            1,
        )

    if gate_car is not None:
        # Highlight the selected gate car with a thicker yellow box
        cv2.rectangle(
            frame,
            (gate_car.x1, gate_car.y1),
            (gate_car.x2, gate_car.y2),
            (0, 255, 255),
            3,
        )

        if gate_car.final_plate:
            draw_arabic_text_box(
                frame,
                gate_car.final_plate,
                (gate_car.x1, gate_car.y1 - 10),
                font_size=32,
                text_color=(0, 255, 0),
                box_color=(0, 0, 0),
                padding=6,
            )

        # Show how many reads have been collected toward the stability threshold
        if hasattr(gate_car, 'plate_candidates') and gate_car.plate_candidates:
            from collections import Counter
            counts = Counter(gate_car.plate_candidates)
            most_common = counts.most_common(1)[0]
            debug_text = f"Candidates: {most_common[1]}/{PLATE_STABILITY_COUNT}"

            cv2.putText(
                frame,
                debug_text,
                (gate_car.x1, gate_car.y2 + 20),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 255),
                1,
            )

            if DEBUG_MODE and len(gate_car.plate_candidates) > 0:
                unique_plates = list(set(gate_car.plate_candidates))
                y_offset = 40
                for idx, plate in enumerate(unique_plates[:3]):
                    cv2.putText(
                        frame,
                        f"{idx+1}. {plate} ({gate_car.plate_candidates.count(plate)}x)",
                        (gate_car.x1, gate_car.y2 + y_offset),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.4,
                        (255, 255, 0),
                        1,
                    )
                    y_offset += 20

    if USE_GATE_ZONE and GATE_ZONE:
        gx1, gy1, gx2, gy2 = GATE_ZONE
        cv2.rectangle(frame, (gx1, gy1), (gx2, gy2), (255, 0, 0), 2)
        cv2.putText(
            frame,
            "GATE ZONE",
            (gx1, gy1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 0, 0),
            2,
        )
    elif not USE_GATE_ZONE:
        cv2.putText(
            frame,
            "MODE: Closest Car",
            (50, 120),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 165, 0),
            2,
        )

    if gate_open:
        cv2.rectangle(frame, (40, 30), (250, 80), (0, 255, 0), -1)
        cv2.putText(
            frame,
            "GATE OPEN",
            (50, 65),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.2,
            (0, 0, 0),
            3,
        )
    else:
        cv2.rectangle(frame, (40, 30), (250, 80), (0, 0, 255), -1)
        cv2.putText(
            frame,
            "GATE CLOSED",
            (50, 65),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (255, 255, 255),
            2,
        )

    cv2.putText(
        frame,
        f"Frame: {frame_index} | Cars: {len(cars)}",
        (50, h - 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2,
    )

    cv2.imshow("Parking Gate", frame)
    writer.write(frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# --- Cleanup ---

cap.release()
writer.release()
cv2.destroyAllWindows()

print("\n" + "="*50)
print("[INFO] System stopped")
if gate_open:
    print(f"[INFO] Final gate open plate: {gate_open_plate}")
    print(f"[INFO] Gate opened at frame {frame_index}")
    print(f"[INFO] Approximate time to open: {frame_index / fps:.2f}s")
else:
    print("[INFO] Gate never opened during video")
print("="*50)
