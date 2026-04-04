# run_pipeline.py
import os
import cv2
import argparse
from calibration import discover_slots
from occupancy import run_occupancy
from camera_profiles import (
    save_camera_profile,
    load_camera_profile,
    profile_exists,
    get_camera_output_paths,
)
 
clicked_points = []
display_image = None
 
 
def mouse_callback(event, x, y, flags, param):
    global clicked_points, display_image
 
    if event == cv2.EVENT_LBUTTONDOWN:
        if len(clicked_points) < 4:
            clicked_points.append((x, y))
            cv2.circle(display_image, (x, y), 6, (0, 0, 255), -1)
            cv2.putText(
                display_image,
                f"{len(clicked_points)}",
                (x + 8, y - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )
            cv2.imshow("Pick 4 Points", display_image)
 
 
def pick_src_points_from_video(video_path):
    global clicked_points, display_image
    clicked_points = []
 
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Could not open video: {video_path}")
 
    ret, frame = cap.read()
    cap.release()
 
    if not ret:
        raise RuntimeError("Could not read first frame from video.")
 
    display_image = frame.copy()
 
    print("\nClick 4 points in this order:")
    print("1 = top-left")
    print("2 = top-right")
    print("3 = bottom-right")
    print("4 = bottom-left")
    print("Press ESC when done.\n")
 
    cv2.namedWindow("Pick 4 Points", cv2.WINDOW_NORMAL)
    cv2.setMouseCallback("Pick 4 Points", mouse_callback)
 
    while True:
        cv2.imshow("Pick 4 Points", display_image)
        key = cv2.waitKey(1) & 0xFF
        if key == 27:
            break
 
    cv2.destroyAllWindows()
 
    if len(clicked_points) != 4:
        raise RuntimeError("You must click exactly 4 points before pressing ESC.")
 
    src_points = " ".join([f"{x},{y}" for x, y in clicked_points])
    print(f"Using src_points: {src_points}")
    return src_points
 
 
def get_or_create_profile(
    profile_id,
    video_path,
    warp_w,
    warp_h,
    row_margin_top,
    row_margin_bottom,
    reuse_profile=False,
):
    if reuse_profile and profile_exists(profile_id):
        print(f"\nLoading existing profile: {profile_id}")
        return load_camera_profile(profile_id)
 
    print(f"\nCreating new profile: {profile_id}")
    src_points = pick_src_points_from_video(video_path)
 
    save_path = save_camera_profile(
        profile_id=profile_id,
        src_points=src_points,
        warp_w=warp_w,
        warp_h=warp_h,
        row_margin_top=row_margin_top,
        row_margin_bottom=row_margin_bottom,
    )
 
    print(f"Saved profile to: {save_path}")
    return load_camera_profile(profile_id)
 
 
def run_full_pipeline(
    video_path,
    profile_id,
    model_path="yolov8n.pt",
    warp_w=1400,
    warp_h=500,
    row_margin_top=20,
    row_margin_bottom=20,
    slot_width_override=None,
    show_window=True,
    reuse_profile=False,
):
    paths = get_camera_output_paths(profile_id)
 
    print("\n========== STEP 0: PROFILE ==========")
    profile = get_or_create_profile(
        profile_id,
        video_path,
        warp_w,
        warp_h,
        row_margin_top,
        row_margin_bottom,
        reuse_profile=reuse_profile,
    )
 
    src_points = profile["src_points"]
    warp_w = profile["warp_w"]
    warp_h = profile["warp_h"]
    row_margin_top = profile["row_margin_top"]
    row_margin_bottom = profile["row_margin_bottom"]
    calibration_mode = profile.get("calibration_mode", "repeat_from_first_slot")
 
    print("\n========== STEP 1: CALIBRATION ==========")
 
    discover_slots(
        video_pattern=video_path,
        output_json=paths["spots_json"],
        median_out=paths["median_bg"],
        debug_out=paths["debug_original"],
        warped_debug_out=paths["debug_warped"],
        warped_mask_out=paths["mask_warped"],
        src_points_str=src_points,
        warp_w=warp_w,
        warp_h=warp_h,
        row_margin_top=row_margin_top,
        row_margin_bottom=row_margin_bottom,
        slot_width_override=slot_width_override,
        calibration_mode=calibration_mode,
        profile_id=profile_id,          # ← required for repeat mode
    )
 
    if not os.path.exists(paths["spots_json"]):
        raise RuntimeError(
            "Calibration did not produce spots.json.\n"
            "If you haven't set up the first slot yet, run:\n"
            f"  python src/repeat_slot_setup.py --video <video> --profile_id {profile_id}"
        )
 
    print("\n========== STEP 2: OCCUPANCY ==========")
 
    run_occupancy(
        video_path=video_path,
        model_path=model_path,
        spots_json=paths["spots_json"],
        background_path=paths["median_bg"],
        save_path=paths["result_video"],
        show_window=show_window,
    )
 
    print("\n========== DONE ==========")
    print(f"Profile ID : {profile_id}")
    print(f"Output     : {paths['result_video']}")
 
 
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True, help="Path to video")
    parser.add_argument("--profile_id", required=True, help="e.g. camera_1_top or camera_1_bottom")
    parser.add_argument("--model", default="yolov8n.pt")
    parser.add_argument("--warp_w", type=int, default=1400)
    parser.add_argument("--warp_h", type=int, default=500)
    parser.add_argument("--row_margin_top", type=int, default=20)
    parser.add_argument("--row_margin_bottom", type=int, default=20)
    parser.add_argument("--slot_width", type=float, default=None)
    parser.add_argument("--reuse_profile", action="store_true")
    parser.add_argument("--no_show", action="store_true")
 
    args = parser.parse_args()
 
    run_full_pipeline(
        video_path=args.video,
        profile_id=args.profile_id,
        model_path=args.model,
        warp_w=args.warp_w,
        warp_h=args.warp_h,
        row_margin_top=args.row_margin_top,
        row_margin_bottom=args.row_margin_bottom,
        slot_width_override=args.slot_width,
        show_window=not args.no_show,
        reuse_profile=args.reuse_profile,
    )