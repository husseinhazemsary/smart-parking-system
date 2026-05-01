# occupancy.py
import os
import cv2
import json
import argparse
import numpy as np
from ultralytics import YOLO


def load_spots_payload(spots_json):
    with open(spots_json, "r") as f:
        data = json.load(f)
    return data


def build_homography_from_json(homography_data):
    src_points = np.array(homography_data["src_points"], dtype=np.float32)
    dst_points = np.array(homography_data["dst_points"], dtype=np.float32)
    warp_w, warp_h = homography_data["warp_size"]

    H = cv2.getPerspectiveTransform(src_points, dst_points)
    H_inv = cv2.getPerspectiveTransform(dst_points, src_points)

    return H, H_inv, int(warp_w), int(warp_h)


def warp_image(image, H, warp_w, warp_h):
    return cv2.warpPerspective(image, H, (warp_w, warp_h))


def iou(box_a, box_b):
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    x1 = max(ax1, bx1)
    y1 = max(ay1, by1)
    x2 = min(ax2, bx2)
    y2 = min(ay2, by2)

    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter_area = inter_w * inter_h

    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)

    return inter_area / (area_a + area_b - inter_area + 1e-6)


def expand_box(box, frame_w, frame_h, pad_x=0.0, pad_y=0.0):
    x1, y1, x2, y2 = box
    w = x2 - x1
    h = y2 - y1

    x1 = max(0, int(round(x1 - w * pad_x)))
    y1 = max(0, int(round(y1 - h * pad_y)))
    x2 = min(frame_w - 1, int(round(x2 + w * pad_x)))
    y2 = min(frame_h - 1, int(round(y2 + h * pad_y)))

    return [x1, y1, x2, y2]


def compute_motion_mask(frame, background):
    diff = cv2.absdiff(frame, background)
    gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    _, mask = cv2.threshold(gray, 28, 255, cv2.THRESH_BINARY)

    kernel_small = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    kernel_big = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))

    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_small, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_big, iterations=2)

    return mask


def motion_ratio_in_slot(slot_box, motion_mask):
    x1, y1, x2, y2 = map(int, slot_box)

    if x2 <= x1 or y2 <= y1:
        return 0.0

    roi = motion_mask[y1:y2, x1:x2]
    if roi.size == 0:
        return 0.0

    changed = np.count_nonzero(roi)
    total = roi.size
    return changed / float(total + 1e-6)


def slot_coverage_by_vehicle(slot_box, detections, min_coverage=0.80):
    x1, y1, x2, y2 = slot_box
    slot_area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    if slot_area == 0:
        return False

    for det in detections:
        dx1, dy1, dx2, dy2 = det
        ix1 = max(x1, dx1)
        iy1 = max(y1, dy1)
        ix2 = min(x2, dx2)
        iy2 = min(y2, dy2)
        inter_area = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
        if inter_area / slot_area >= min_coverage:
            return True

    return False


def draw_text(img, text, org, color, scale=0.7, thickness=2):
    cv2.putText(
        img,
        text,
        org,
        cv2.FONT_HERSHEY_SIMPLEX,
        scale,
        color,
        thickness,
        cv2.LINE_AA,
    )


def polygon_label_anchor(poly):
    pts = np.array(poly, dtype=np.float32)
    cx = int(np.mean(pts[:, 0]))
    cy = int(np.mean(pts[:, 1]))
    return cx, cy


def run_occupancy(
    video_path,
    model_path,
    spots_json,
    background_path,
    save_path=None,
    show_window=True,
):
    payload = load_spots_payload(spots_json)
    slots = payload["slots"]
    homography_data = payload["homography"]

    H, H_inv, warp_w, warp_h = build_homography_from_json(homography_data)

    background = cv2.imread(background_path)
    if background is None:
        raise FileNotFoundError(f"Could not load median background image: {background_path}")

    warped_background = warp_image(background, H, warp_w, warp_h)

    model = YOLO(model_path)
    vehicle_classes = [2, 5, 7]

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Could not open video: {video_path}")

    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25.0

    if background.shape[1] != frame_w or background.shape[0] != frame_h:
        background = cv2.resize(background, (frame_w, frame_h))
        warped_background = warp_image(background, H, warp_w, warp_h)

    writer = None
    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True) if os.path.dirname(save_path) else None
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(save_path, fourcc, fps, (frame_w, frame_h))

    slot_states = {slot["slot_id"]: False for slot in slots}
    slot_scores = {slot["slot_id"]: 0 for slot in slots}

    yolo_conf = 0.30
    motion_occ_threshold = 0.06
    motion_release_threshold = 0.025

    confirm_seconds = 3.0      # car must stay this long to count as occupied
    release_seconds = 1.5      # slot must be clear this long to count as free

    activate_score = int(confirm_seconds * fps)
    deactivate_score = -int(release_seconds * fps)
    score_cap = activate_score * 2

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        warped_frame = warp_image(frame, H, warp_w, warp_h)
        motion_mask = compute_motion_mask(warped_frame, warped_background)

        results = model(warped_frame, conf=yolo_conf, classes=vehicle_classes, verbose=False)

        detections = []
        if results and results[0].boxes is not None and len(results[0].boxes) > 0:
            detections = results[0].boxes.xyxy.cpu().numpy().tolist()

        occupied_count = 0
        free_count = 0

        for slot in slots:
            sid = slot["slot_id"]
            rect_warp = slot["rect_warp"]
            x1, y1, x2, y2 = map(int, rect_warp)

            motion_box = expand_box([x1, y1, x2, y2], warp_w, warp_h, pad_x=-0.06, pad_y=-0.08)
            m_ratio = motion_ratio_in_slot(motion_box, motion_mask)

            center_hit = slot_coverage_by_vehicle([x1, y1, x2, y2], detections, min_coverage=0.65)

            occupied_candidate = center_hit or (m_ratio >= motion_occ_threshold)
            free_candidate = (not center_hit) and (m_ratio <= motion_release_threshold)

            if occupied_candidate:
                slot_scores[sid] = min(slot_scores[sid] + 1, score_cap)
            elif free_candidate:
                slot_scores[sid] = max(slot_scores[sid] - 1, -score_cap)

            if slot_scores[sid] >= activate_score:
                slot_states[sid] = True
            elif slot_scores[sid] <= deactivate_score:
                slot_states[sid] = False

            if slot_states[sid]:
                occupied_count += 1
            else:
                free_count += 1

        vis = frame.copy()

        for slot in slots:
            sid = slot["slot_id"]
            poly_original = np.array(slot["poly_original"], dtype=np.int32).reshape((-1, 1, 2))

            if slot_states[sid]:
                color = (0, 0, 255)
                label = f"S{sid}: OCCUPIED"
            else:
                color = (0, 255, 0)
                label = f"S{sid}: FREE"

            cv2.polylines(vis, [poly_original], True, color, 2)

            anchor_x, anchor_y = polygon_label_anchor(slot["poly_original"])
            draw_text(vis, label, (anchor_x - 25, max(20, anchor_y - 8)), color, scale=0.65, thickness=2)

        draw_text(vis, f"Occupied: {occupied_count}", (25, 45), (0, 0, 255), scale=1.0, thickness=3)
        draw_text(vis, f"Free: {free_count}", (25, 88), (0, 255, 0), scale=1.0, thickness=3)

        if writer is not None:
            writer.write(vis)

        if show_window:
            cv2.imshow("Parking Occupancy", vis)
            key = cv2.waitKey(1) & 0xFF
            if key == 27:
                break

    cap.release()
    if writer is not None:
        writer.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True, help="Path to input video")
    parser.add_argument("--model", required=True, help="Path to YOLO model")
    parser.add_argument("--spots", required=True, help="Path to spots.json")
    parser.add_argument("--background", required=True, help="Path to saved median background image")
    parser.add_argument("--save", default=None, help="Optional output video path")
    parser.add_argument("--no_show", action="store_true", help="Do not show OpenCV window")

    args = parser.parse_args()

    run_occupancy(
        video_path=args.video,
        model_path=args.model,
        spots_json=args.spots,
        background_path=args.background,
        save_path=args.save,
        show_window=not args.no_show,
    )