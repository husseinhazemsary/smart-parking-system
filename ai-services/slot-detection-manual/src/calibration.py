import os
import cv2
import json
import glob
import argparse
import numpy as np

from camera_profiles import load_camera_profile


def ensure_video_list(video_pattern):
    video_files = glob.glob(video_pattern)
    if not video_files and os.path.isfile(video_pattern):
        video_files = [video_pattern]
    return sorted(video_files)


def compute_median_background(video_files, max_frames_per_video=150, sample_stride=2):
    samples = []
    frame_w, frame_h = None, None

    for video_path in video_files:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Could not open video: {video_path}")
            continue

        collected = 0
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_w is None or frame_h is None:
                frame_h, frame_w = frame.shape[:2]

            if frame_idx % sample_stride == 0:
                samples.append(frame.copy())
                collected += 1
                if collected >= max_frames_per_video:
                    break

            frame_idx += 1

        cap.release()

    if not samples:
        raise RuntimeError("No frames collected for median background.")

    stack = np.stack(samples, axis=0)
    median_bg = np.median(stack, axis=0).astype(np.uint8)
    return median_bg, frame_w, frame_h


def parse_src_points(src_points_str):
    parts = src_points_str.strip().split()
    if len(parts) != 4:
        raise ValueError("src_points must contain exactly 4 points.")

    pts = []
    for p in parts:
        x_str, y_str = p.split(",")
        pts.append([float(x_str), float(y_str)])

    return np.array(pts, dtype=np.float32)


def build_homography(src_points, warp_w, warp_h):
    dst_points = np.array(
        [
            [0, 0],
            [warp_w - 1, 0],
            [warp_w - 1, warp_h - 1],
            [0, warp_h - 1],
        ],
        dtype=np.float32,
    )

    H = cv2.getPerspectiveTransform(src_points, dst_points)
    H_inv = cv2.getPerspectiveTransform(dst_points, src_points)
    return H, H_inv, dst_points


def warp_image(image, H, warp_w, warp_h):
    return cv2.warpPerspective(image, H, (warp_w, warp_h))


def transform_points(points_xy, H):
    pts = np.array(points_xy, dtype=np.float32).reshape(-1, 1, 2)
    warped = cv2.perspectiveTransform(pts, H)
    return warped.reshape(-1, 2)


def rect_to_polygon(rect):
    x1, y1, x2, y2 = rect
    return [
        [float(x1), float(y1)],
        [float(x2), float(y1)],
        [float(x2), float(y2)],
        [float(x1), float(y2)],
    ]


def build_repeated_slots_from_first_slot(first_slot_rect, row_end_x, direction="right"):
    """
    Repeat the first slot horizontally until row_end_x.
    The last slot is kept only if it is at least 55% of a full slot width.
    """
    x1, y1, x2, y2 = [float(v) for v in first_slot_rect]
    slot_w = x2 - x1
    slot_h = y2 - y1

    if slot_w <= 0 or slot_h <= 0:
        raise RuntimeError("Invalid first slot rectangle.")

    slots = []

    if direction == "right":
        cur_x1 = x1
        cur_x2 = x2

        while cur_x1 < row_end_x:
            clipped_x2 = min(cur_x2, row_end_x)

            if clipped_x2 - cur_x1 >= slot_w * 0.55:
                slots.append([float(cur_x1), float(y1), float(clipped_x2), float(y2)])

            cur_x1 += slot_w
            cur_x2 += slot_w

    elif direction == "left":
        cur_x1 = x1
        cur_x2 = x2

        while cur_x2 > row_end_x:
            clipped_x1 = max(cur_x1, row_end_x)

            if cur_x2 - clipped_x1 >= slot_w * 0.55:
                slots.append([float(clipped_x1), float(y1), float(cur_x2), float(y2)])

            cur_x1 -= slot_w
            cur_x2 -= slot_w

        slots = list(reversed(slots))

    else:
        raise RuntimeError("direction must be 'right' or 'left'")

    return slots


def save_debug_images(
    median_bg,
    warped_bg,
    warped_slots,
    original_slots_polys,
    original_debug_out,
    warped_debug_out,
    warped_mask_out,
):
    original_debug = median_bg.copy()

    for idx, poly in enumerate(original_slots_polys, start=1):
        pts = np.array(poly, dtype=np.int32).reshape((-1, 1, 2))
        cv2.polylines(original_debug, [pts], True, (0, 255, 0), 2)

        label_pt = tuple(pts[0][0])
        cv2.putText(
            original_debug,
            f"S{idx}",
            (label_pt[0] + 4, max(18, label_pt[1] - 6)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 255, 0),
            2,
            cv2.LINE_AA,
        )

    cv2.imwrite(original_debug_out, original_debug)

    warped_debug = warped_bg.copy()

    for idx, rect in enumerate(warped_slots, start=1):
        x1, y1, x2, y2 = map(int, rect)
        cv2.rectangle(warped_debug, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(
            warped_debug,
            f"S{idx}",
            (x1 + 5, y1 + 25),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2,
            cv2.LINE_AA,
        )

    cv2.imwrite(warped_debug_out, warped_debug)

    blank_mask = np.zeros((warped_bg.shape[0], warped_bg.shape[1]), dtype=np.uint8)
    cv2.imwrite(warped_mask_out, blank_mask)


def discover_slots(
    video_pattern,
    output_json,
    median_out,
    debug_out,
    warped_debug_out,
    warped_mask_out,
    src_points_str,
    warp_w,
    warp_h,
    row_margin_top,
    row_margin_bottom,
    slot_width_override=None,
    calibration_mode="repeat_from_first_slot",
    profile_id=None,
):
    video_files = ensure_video_list(video_pattern)
    if not video_files:
        print(f"No videos found matching: {video_pattern}")
        return

    print("Building median background...")
    median_bg, frame_w, frame_h = compute_median_background(video_files)

    for path in [output_json, median_out, debug_out, warped_debug_out, warped_mask_out]:
        d = os.path.dirname(path)
        if d:
            os.makedirs(d, exist_ok=True)

    cv2.imwrite(median_out, median_bg)
    print(f"Saved median background to: {median_out}")

    src_points = parse_src_points(src_points_str)
    H, H_inv, dst_points = build_homography(src_points, warp_w, warp_h)
    warped_bg = warp_image(median_bg, H, warp_w, warp_h)

    if calibration_mode != "repeat_from_first_slot":
        raise RuntimeError("This simplified calibration only supports 'repeat_from_first_slot'.")

    if not profile_id:
        raise RuntimeError("profile_id is required.")

    profile = load_camera_profile(profile_id)
    repeat_cfg = profile.get("repeat_slot", {})

    first_slot_rect = repeat_cfg.get("first_slot_rect_warp")
    row_end_x = repeat_cfg.get("row_end_x")
    direction = repeat_cfg.get("direction", "right")

    if first_slot_rect is None or row_end_x is None:
        raise RuntimeError(
            f"Profile '{profile_id}' is missing repeat-slot setup.\n"
            f"Run:\n"
            f"  python src/repeat_slot_setup.py --video <video> --profile_id {profile_id}"
        )

    warped_slots = build_repeated_slots_from_first_slot(
        first_slot_rect=first_slot_rect,
        row_end_x=float(row_end_x),
        direction=direction,
    )

    if not warped_slots:
        raise RuntimeError("No slots were generated from first slot.")

    payload = []
    original_slot_polys = []

    for idx, rect in enumerate(warped_slots, start=1):
        poly_warp = rect_to_polygon(rect)
        poly_original = transform_points(poly_warp, H_inv).tolist()
        original_slot_polys.append(poly_original)

        payload.append(
            {
                "slot_id": idx,
                "rect_warp": [float(v) for v in rect],
                "poly_warp": [[float(x), float(y)] for x, y in poly_warp],
                "poly_original": [[float(x), float(y)] for x, y in poly_original],
            }
        )

    homography_payload = {
        "src_points": [[float(x), float(y)] for x, y in src_points.tolist()],
        "dst_points": [[float(x), float(y)] for x, y in dst_points.tolist()],
        "warp_size": [int(warp_w), int(warp_h)],
    }

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(
            {
                "homography": homography_payload,
                "slots": payload,
            },
            f,
            indent=4,
        )

    save_debug_images(
        median_bg=median_bg,
        warped_bg=warped_bg,
        warped_slots=warped_slots,
        original_slots_polys=original_slot_polys,
        original_debug_out=debug_out,
        warped_debug_out=warped_debug_out,
        warped_mask_out=warped_mask_out,
    )

    widths = [s[2] - s[0] for s in warped_slots]
    avg_width = float(np.mean(widths)) if widths else 0.0

    print(f"Final slot count         : {len(warped_slots)}")
    print(f"Average slot width       : {avg_width:.2f}")
    print(f"Saved slots to           : {output_json}")
    print(f"Saved warped debug image : {warped_debug_out}")
    print(f"Saved original debug     : {debug_out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--videos", required=True)
    parser.add_argument("--src_points", required=True)
    parser.add_argument("--profile_id", required=True)
    parser.add_argument("--warp_w", type=int, default=1400)
    parser.add_argument("--warp_h", type=int, default=500)
    parser.add_argument("--row_margin_top", type=int, default=20)
    parser.add_argument("--row_margin_bottom", type=int, default=20)
    parser.add_argument("--slot_width_override", type=float, default=None)
    parser.add_argument("--out", default="spots/spots.json")
    parser.add_argument("--median_out", default="output/median_background.jpg")
    parser.add_argument("--debug_out", default="output/slots_debug_original.jpg")
    parser.add_argument("--warped_debug_out", default="output/slots_debug_warped.jpg")
    parser.add_argument("--warped_mask_out", default="output/slots_mask_warped.jpg")

    args = parser.parse_args()

    discover_slots(
        video_pattern=args.videos,
        output_json=args.out,
        median_out=args.median_out,
        debug_out=args.debug_out,
        warped_debug_out=args.warped_debug_out,
        warped_mask_out=args.warped_mask_out,
        src_points_str=args.src_points,
        warp_w=args.warp_w,
        warp_h=args.warp_h,
        row_margin_top=args.row_margin_top,
        row_margin_bottom=args.row_margin_bottom,
        slot_width_override=args.slot_width_override,
        calibration_mode="repeat_from_first_slot",
        profile_id=args.profile_id,
    )