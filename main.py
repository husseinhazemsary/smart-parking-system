import cv2
import time
import re
from db.db import check_access


from src.Car import Car
from src.PlateDetector import PlateDetector
from src.PlateReader import PlateReader
from src.utils.draw_arabic import draw_arabic_text_box
import re

last_gate_open_time = 0
GATE_COOLDOWN = 5  # seconds

HEADER_PATTERNS = [
    r"\bEGYPT\b",
    r"\bEGYPTI\b",
    r"\bLEGYPTE\b",
    r"\bCEGYPT\b",
    r"\bEGTP\b",
    r"\bEGTPT\b",
    r"\bEGYP\b",
    r"\bEGYPT[A-Z]*\b",
    r"مصر",
    r"مصـر",
    r"مصان",
    r"مطير",
    r"مطى",
]

def remove_plate_header(text):
    if not text:
        return text

    cleaned = text.upper()
    for pattern in HEADER_PATTERNS:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)

    # Normalize spaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def extract_arabic_digits(text):
    digits = re.findall(r"[٠-٩]", text)
    return "".join(digits) if digits else None

def extract_arabic_letters(text):
    letters = re.findall(r"[ء-ي]", text)
    return letters if letters else []

# ==============================
# CONFIG
# ==============================

INPUT_VIDEO = "input/video.mp4"
OUTPUT_VIDEO = "output/output_video.mp4"

FONT_PATH = "fonts/Amiri-Regular.ttf"

# ==============================
# DEBUG MODE
# ==============================
# Enable detailed debugging information
DEBUG_MODE = True
DEBUG_SAVE_PLATES = True  # Save detected plate crops to debug folder
DEBUG_SHOW_OCR_RESULTS = True  # Show all OCR results in console

# ==============================
# VALIDATION MODE
# ==============================
# Use lenient validation for fast-moving cars (accepts partial reads)
USE_LENIENT_VALIDATION = False

# ==============================
# GATE ZONE TOGGLE
# ==============================
# Set to True to use gate zone (recommended for fixed parking gates)
# Set to False to process closest car (useful for mobile cameras or testing)
USE_GATE_ZONE = False

# Gate zone configuration (only used if USE_GATE_ZONE = True)
# Instead of hardcoded coordinates, use relative positioning
# This makes the system portable across different camera setups
GATE_ZONE_RELATIVE = {
    'x_start': 0.2,   # 20% from left edge
    'x_end': 0.8,     # 80% from left edge (covers center 60% width)
    'y_start': 0.6,   # 60% from top (lower portion of frame)
    'y_end': 0.95,    # 95% from top (near bottom)
}

# Will be calculated from frame dimensions (set in main loop)
GATE_ZONE = None

MAX_IDLE_TIME = 2.0  # seconds

# Two-tier processing strategy:
# - Background: Track all vehicles slowly (saves compute)
# - Gate car: Process intensively and quickly (reduces wait time)

BACKGROUND_VEHICLE_DETECT_EVERY_N = 7  # Detect all vehicles every 7 frames
GATE_CAR_PROCESS_EVERY_N = 1           # Process gate car EVERY frame (max speed for fast cars)
GATE_CAR_OCR_EVERY_N = 1               # OCR gate car EVERY frame (max speed)

# Number of identical reads required to open gate
PLATE_STABILITY_COUNT = 2

# ==============================
# HELPERS
# ==============================

def valid_egyptian_plate(text):
    """
    Validates if text matches Egyptian license plate format:
    - No Latin characters
    - Exactly 2 Arabic letters
    - At least 3 Arabic digits
    """
    if not text:
        return False

    # Reject Latin characters
    if re.search(r"[A-Za-z]", text):
        return False

    # Normalize spaces
    text = re.sub(r"\s+", " ", text).strip()

    arabic_digits = re.findall(r"[٠-٩]", text)
    arabic_letters = re.findall(r"[ء-ي]", text)

    # Expect exactly 2 letters (like "ج ع") and >= 3 digits (e.g. "٤٧٣٨")
    if len(arabic_letters) != 2:
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

    # Reject Latin characters
    if re.search(r"[A-Za-z]", text):
        return False
    
    # Reject common false positives (country labels)
    text_clean = re.sub(r"\s+", "", text.strip().lower())
    false_positives = ["egypt", "مصر", "ملصر", "eypt", "egpt", "gypt"]
    if text_clean in false_positives:
        return False
    
    # Normalize spaces
    text = re.sub(r"\s+", " ", text).strip()
    
    # Must have at least some Arabic content
    if not re.search(r"[٠-٩ء-ي]", text):
        return False
    
    arabic_digits = re.findall(r"[٠-٩]", text)
    arabic_letters = re.findall(r"[ء-ي]", text)
    
    # Accept if we have:
    # - At least 2 digits OR
    # - Exactly 2 letters OR
    # - Mix of 1+ letters and 2+ digits
    
    if len(arabic_digits) >= 2:  # Has digit component
        return True
    
    if len(arabic_letters) >= 2:  # Has letter component
        return True
    
    if len(arabic_letters) >= 1 and len(arabic_digits) >= 2:  # Has both
        return True
    
    return False


def choose_gate_car(cars, gate_zone):
    """
    From all cars, pick ONE that is inside gate zone.
    Strategy: Score based on:
    1. Vertical position (deeper = closer to gate)
    2. Size (larger = closer to camera)
    3. Horizontal centering (centered = more likely at gate)
    Returns the car object or None.
    """
    if gate_zone is None:
        return None
    
    gx1, gy1, gx2, gy2 = gate_zone
    gate_center_x = (gx1 + gx2) // 2
    candidates = []

    for car in cars.values():
        cx = (car.x1 + car.x2) // 2
        cy = (car.y1 + car.y2) // 2
        
        # Check if car is in gate zone
        if gx1 <= cx <= gx2 and gy1 <= cy <= gy2:
            # Calculate composite score
            depth = cy  # Vertical position (higher = closer)
            size = (car.x2 - car.x1) * (car.y2 - car.y1)  # Bounding box area
            center_offset = abs(cx - gate_center_x)  # Distance from gate center
            
            # Weighted score: prioritize depth, then size, penalize off-center
            score = depth * 2.0 + size * 0.01 - center_offset * 0.5
            candidates.append((score, car))

    if not candidates:
        return None

    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


def try_open_gate_with_db(plate_text):
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
    Pick the car with the largest bounding box (closest to camera).
    Used when gate zone is disabled.
    Returns the car object or None.
    """
    if not cars:
        return None
    
    # Find car with largest bounding box area
    return max(cars.values(), key=lambda c: (c.x2 - c.x1) * (c.y2 - c.y1))


def select_gate_car(cars, gate_zone, use_gate_zone):
    """
    Wrapper function to select gate car based on configuration.
    Returns the selected car or None.
    """
    if use_gate_zone:
        return choose_gate_car(cars, gate_zone)
    else:
        return choose_closest_car(cars)


def reconstruct_plate_from_partials(candidates):
    """
    Try to reconstruct a full plate from partial OCR reads.
    Example: ['٧٢٣', '١٧٢٣', 'م ي'] → '١٧٢٣ م ي'
    
    Strategy:
    1. Find the most common digit sequence (3-4 digits)
    2. Find the most common letter pair (2 letters)
    3. Combine them if both exist
    """
    if not candidates or len(candidates) < 2:
        return None
    
    digit_parts = []
    letter_parts = []
    
    for candidate in candidates:
        text = re.sub(r"\s+", " ", str(candidate).strip())
        
        # Extract digits and letters
        digits = re.findall(r"[٠-٩]", text)
        letters = re.findall(r"[ء-ي]", text)
        
        # Collect digit sequences (3-4 digits)
        if len(digits) >= 3:
            digit_str = ''.join(digits)
            digit_parts.append(digit_str)
        
        # Collect letter pairs (exactly 2 letters)
        if len(letters) == 2:
            letter_str = ' '.join(letters)
            letter_parts.append(letter_str)
    
    # Find most common digit sequence
    from collections import Counter
    
    best_digits = None
    if digit_parts:
        digit_counter = Counter(digit_parts)
        most_common_digits = digit_counter.most_common(1)
        if most_common_digits and most_common_digits[0][1] >= 1:
            best_digits = most_common_digits[0][0]
    
    # Find most common letter pair
    best_letters = None
    if letter_parts:
        letter_counter = Counter(letter_parts)
        most_common_letters = letter_counter.most_common(1)
        if most_common_letters and most_common_letters[0][1] >= 1:
            best_letters = most_common_letters[0][0]
    
    # Reconstruct full plate
    if best_digits and best_letters:
        # Egyptian format: digits + letters (e.g. "١٧٢٣ م ي")
        reconstructed = f"{best_digits} {best_letters}"
        return reconstructed
    
    return None

def detect_and_read_plate(frame, car, plate_detector, plate_reader, frame_index,
                          debug_mode=False, save_plates=False):

    debug_info = {
        'plate_detected': False,
        'plate_crop_size': None,
        'ocr_result': None,
        'validation_passed': False,
        'rejection_reason': None
    }

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

    # -------- OCR --------
    raw_text = plate_reader.read_plate(plate_img)
    debug_info['ocr_result'] = raw_text if raw_text else "NULL"

    if not raw_text:
        debug_info['rejection_reason'] = "OCR returned empty"
        return None, debug_info

    # -------- HEADER REMOVAL --------
    cleaned_text = remove_plate_header(raw_text)

    # -------- DIGIT EXTRACTION --------
    digits = extract_arabic_digits(cleaned_text)
    letters = extract_arabic_letters(cleaned_text)

    # Accept if digits exist
    if digits and len(digits) >= 3:
        debug_info['validation_passed'] = True

        # Use letters only if we have exactly 2 (Egyptian format)
        if len(letters) == 2:
            plate_text = f"{digits} {' '.join(letters)}"
        else:
            plate_text = digits  # fallback

        return plate_text, debug_info

    debug_info['rejection_reason'] = f"No valid digits after cleaning: '{cleaned_text}'"
    return None, debug_info


# ==============================
# INIT
# ==============================

cap = cv2.VideoCapture(INPUT_VIDEO)
assert cap.isOpened(), "Failed to open input video"

fps = cap.get(cv2.CAP_PROP_FPS)
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# Calculate adaptive gate zone from frame dimensions (only if enabled)
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

# Create resizable window for display
cv2.namedWindow("Parking Gate", cv2.WINDOW_NORMAL)
# Optionally set initial window size (adjust to your screen)
cv2.resizeWindow("Parking Gate", 1280, 720)

# ==============================
# MAIN LOOP
# ==============================

while True:
    ret, frame = cap.read()
    if not ret:
        break

    current_time = time.time()
    frame_index += 1

    # ----------------------------------
    # 1) BACKGROUND: Detect all vehicles (slow rate)
    # ----------------------------------
    if frame_index % BACKGROUND_VEHICLE_DETECT_EVERY_N == 0:
        detections, active_ids = plate_detector.find_vehicles(frame)

        # Update or create car objects
        for det in detections:
            x1, y1, x2, y2, car_id, plate_crop = det

            if car_id not in cars:
                cars[car_id] = Car(car_id, (x1, y1, x2, y2))
                cars[car_id].last_plate_process_frame = -999
                cars[car_id].plate_candidates = []
            else:
                cars[car_id].update_bbox((x1, y1, x2, y2))

        # Cleanup cars not seen recently
        for cid in list(cars.keys()):
            if current_time - cars[cid].last_seen > MAX_IDLE_TIME:
                del cars[cid]

    # ----------------------------------
    # 2) FOREGROUND: Fast gate car processing
    # ----------------------------------
    gate_car = select_gate_car(cars, GATE_ZONE, USE_GATE_ZONE)

    # If there's a gate car and it doesn't have a final plate yet
    if gate_car is not None and not gate_car.final_plate:
        
        # Process gate car at fast rate
        if frame_index % GATE_CAR_PROCESS_EVERY_N == 0:
            
            # Update the last processing frame
            if not hasattr(gate_car, 'last_plate_process_frame'):
                gate_car.last_plate_process_frame = -999
            
            # Perform OCR at configured rate
            if frame_index - gate_car.last_plate_process_frame >= GATE_CAR_OCR_EVERY_N:
                gate_car.last_plate_process_frame = frame_index
                
                plate_text, debug_info = detect_and_read_plate(
                    frame, 
                    gate_car, 
                    plate_detector, 
                    plate_reader,
                    frame_index,
                    debug_mode=DEBUG_MODE,
                    save_plates=DEBUG_SAVE_PLATES
                )
                
                # Debug logging
                if DEBUG_MODE and DEBUG_SHOW_OCR_RESULTS:
                    status = "✓" if debug_info['validation_passed'] else "✗"
                    print(f"[DEBUG] Frame {frame_index} | Car {gate_car.id} | {status}")
                    print(f"  └─ Plate Detected: {debug_info['plate_detected']}")
                    if debug_info['plate_detected']:
                        print(f"  └─ Crop Size: {debug_info['plate_crop_size']}")
                        print(f"  └─ OCR Result: '{debug_info['ocr_result']}'")
                    if debug_info['validation_passed']:
                        print(f"  └─ ✓ VALID PLATE")
                    else:
                        print(f"  └─ ✗ Rejection: {debug_info['rejection_reason']}")
                
                if plate_text:
                    # Initialize plate_candidates if not exists
                    if not hasattr(gate_car, 'plate_candidates'):
                        gate_car.plate_candidates = []
                    
                    gate_car.plate_candidates.append(plate_text)
                    
                    if DEBUG_MODE:
                        print(f"  └─ Added to candidates. Total: {len(gate_car.plate_candidates)}")
                    
                    # Strategy: Try reconstruction first (needs at least 3 attempts)
                    # This allows time to collect both digit and letter parts
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
                    
                    # Fallback: If we have many attempts (6+) but no reconstruction,
                    # accept partial plate (digit-only or letter-only) as last resort
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

    # ----------------------------------
    # 3) VISUALIZATION (every frame)
    # ----------------------------------

    # Draw all cars (thin green boxes for debugging)
    for car in cars.values():
        cv2.rectangle(
            frame,
            (car.x1, car.y1),
            (car.x2, car.y2),
            (0, 255, 0),
            1,
        )

    # Highlight gate car with thick yellow box
    if gate_car is not None:
        cv2.rectangle(
            frame,
            (gate_car.x1, gate_car.y1),
            (gate_car.x2, gate_car.y2),
            (0, 255, 255),
            3,
        )

        # Draw final plate text if locked
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

        # Show candidate count for debugging
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
            
            # Show all unique candidates
            if DEBUG_MODE and len(gate_car.plate_candidates) > 0:
                unique_plates = list(set(gate_car.plate_candidates))
                y_offset = 40
                for idx, plate in enumerate(unique_plates[:3]):  # Show max 3
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

    # Draw gate zone (only if enabled)
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
        # Show "NO GATE ZONE" indicator
        cv2.putText(
            frame,
            "MODE: Closest Car",
            (50, 120),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 165, 0),  # Orange
            2,
        )

    # Visualize gate state
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

    # Show frame info
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

# ==============================
# CLEANUP
# ==============================

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