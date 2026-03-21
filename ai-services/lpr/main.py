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

# --- Configuration ---

INPUT_VIDEO = "input/captured (3).mp4"
OUTPUT_VIDEO = "output/output_video_cap3.mp4"

FONT_PATH = "fonts/Amiri-Regular.ttf"

# Set to True to print OCR results and show per-frame debug overlays
DEBUG_MODE = True
DEBUG_SAVE_PLATES = True       # Save detected plate crops to debug/plate_crops/
DEBUG_SHOW_OCR_RESULTS = True  # Print OCR output per frame to console

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

def valid_egyptian_plate(text):
    """
    Strict validation for Egyptian license plate format.
    Requires 2-3 Arabic letters and exactly 3-4 Arabic digits.
    Rejects any text containing Latin characters.

    Egyptian plates use exactly 2 letters for private cars (e.g. "م ي ١٧٢٣")
    and exactly 3 letters for other vehicle categories (e.g. "و م ط ٧٢٣").
    Both formats must be accepted;
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
    # Egyptian plates have 3–4 digits. More than 4 means OCR merged a noise
    # region into the digit string (e.g. upscaling picked up a border artifact).
    if not (3 <= len(arabic_digits) <= 4):
        return False

    return True

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
    Reconstructs a full Egyptian plate from a list of (text, confidence) reads.
    Example: [('٧٢٣', 0.91), ('١٧٢٣ م ي', 0.95)] → '١٧٢٣ م ي'

    Uses confidence-weighted voting — each read's contribution is weighted by its
    OCR confidence score so high-confidence reads outweigh uncertain ones.
    Digits and letters are voted on independently and then combined.
    Returns the reconstructed plate string, or None if insufficient data.
    """
    if not candidates or len(candidates) < 2:
        return None

    from collections import defaultdict

    digit_weights  = defaultdict(float)
    letter_weights = defaultdict(float)

    for candidate, confidence in candidates:
        text = re.sub(r"\s+", " ", str(candidate).strip())

        digits  = re.findall(r"[٠-٩]", text)
        letters = re.findall(r"[ء-ي]", text)

        if 3 <= len(digits) <= 4:
            digit_weights[''.join(digits)] += confidence

        if 2 <= len(letters) <= 3:
            letter_weights[' '.join(letters)] += confidence

    best_digits  = max(digit_weights,  key=digit_weights.get)  if digit_weights  else None
    best_letters = max(letter_weights, key=letter_weights.get) if letter_weights else None

    if best_digits and best_letters:
        reconstructed = f"{best_digits} {best_letters}"

        # Tiebreaker check: if the single highest-confidence FULL read (one that contains
        # both valid digits and valid letters) disagrees with the weighted winner, the vote
        # is uncertain — defer and collect one more read.
        # Partial reads (digits only, no letters) are skipped — they cannot speak to whether
        # the letter component is correct and would cause false tiebreaker triggers.
        # In the common case (all reads agree) this check passes immediately with no delay.
        full_reads = [
            (t, c) for t, c in candidates
            if 2 <= len(re.findall(r"[ء-ي]", t)) <= 3
        ]
        if full_reads:
            best_full_text, _ = max(full_reads, key=lambda x: x[1])
            best_full_letters = ' '.join(re.findall(r"[ء-ي]", best_full_text))

            # Only check letters — digit disagreement between full and partial reads
            # is handled by the weighted digit vote, not the tiebreaker.
            if best_full_letters != best_letters:
                return None  # letter disagreement — wait for more reads to break the tie

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
        'ocr_confidence': 0.0,
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

    filtered_text, raw_text, avg_confidence = plate_reader.read_plate_with_boxes(plate_img, debug_annotated_path=debug_annotated_path)
    debug_info['ocr_raw']        = raw_text      if raw_text      else "NULL"
    debug_info['ocr_filtered']   = filtered_text if filtered_text else "NULL"
    debug_info['ocr_confidence'] = avg_confidence

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

            if plate_crop is not None:
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
                        print(f"  └─ Confidence:    {debug_info['ocr_confidence']:.2f}")
                    if debug_info['validation_passed']:
                        print(f"  └─ ✓ VALID PLATE")
                    else:
                        print(f"  └─ ✗ Rejection: {debug_info['rejection_reason']}")

                if plate_text:
                    if not hasattr(gate_car, 'plate_candidates'):
                        gate_car.plate_candidates = []

                    gate_car.plate_candidates.append((plate_text, debug_info['ocr_confidence']))

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
                            print(f"[INFO] Reconstructed from: {[t for t, _ in gate_car.plate_candidates]}")

                            try_open_gate_with_db(full_plate)

                            print(f"[TIMING] Approximate time: {frame_index / fps:.2f}s")
                            print(f"{'='*60}\n")

                    # Fallback: after 6+ failed reconstruction attempts, accept the
                    # highest confidence-weighted partial read if seen enough times
                    if not gate_car.final_plate and len(gate_car.plate_candidates) >= 6:
                        from collections import defaultdict
                        weight_map = defaultdict(float)
                        count_map  = defaultdict(int)
                        for t, conf in gate_car.plate_candidates:
                            weight_map[t] += conf
                            count_map[t]  += 1

                        most_common_text = max(weight_map, key=weight_map.get)

                        if count_map[most_common_text] >= PLATE_STABILITY_COUNT:
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
            from collections import defaultdict
            count_map = defaultdict(int)
            for t, _ in gate_car.plate_candidates:
                count_map[t] += 1
            best_text  = max(count_map, key=count_map.get)
            debug_text = f"Candidates: {count_map[best_text]}/{PLATE_STABILITY_COUNT}"

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
                unique_plates = list(dict.fromkeys(t for t, _ in gate_car.plate_candidates))
                y_offset = 40
                for idx, plate in enumerate(unique_plates[:3]):
                    cv2.putText(
                        frame,
                        f"{idx+1}. {plate} ({count_map[plate]}x)",
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
