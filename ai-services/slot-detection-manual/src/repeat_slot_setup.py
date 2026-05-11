# repeat_slot_setup.py
import cv2
import argparse
import numpy as np
 
from calibration import parse_src_points, build_homography, warp_image
from camera_profiles import (
    load_camera_profile,
    get_camera_output_paths,
    update_repeat_slot_setup,
)
 
 
clicked_points = []
warped_base = None
warped_display = None
 
first_slot_rect = None
row_end_x = None
 
 
def normalize_rect(p1, p2):
    x1 = min(p1[0], p2[0])
    y1 = min(p1[1], p2[1])
    x2 = max(p1[0], p2[0])
    y2 = max(p1[1], p2[1])
    return [float(x1), float(y1), float(x2), float(y2)]
 
 
def redraw():
    global warped_display, warped_base, first_slot_rect, row_end_x
 
    warped_display = warped_base.copy()
 
    if first_slot_rect is not None:
        x1, y1, x2, y2 = map(int, first_slot_rect)
        cv2.rectangle(warped_display, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(
            warped_display,
            "FIRST SLOT",
            (x1 + 5, max(20, y1 - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2,
            cv2.LINE_AA,
        )
 
    if row_end_x is not None:
        x = int(round(row_end_x))
        cv2.line(warped_display, (x, 0), (x, warped_display.shape[0] - 1), (255, 255, 0), 2)
        cv2.putText(
            warped_display,
            "ROW END",
            (x + 5, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
            2,
            cv2.LINE_AA,
        )
 
 
def mouse_callback(event, x, y, flags, param):
    global clicked_points, first_slot_rect, row_end_x
 
    if event == cv2.EVENT_LBUTTONDOWN:
        clicked_points.append((x, y))
 
        # First two clicks = first slot corners
        if len(clicked_points) == 2 and first_slot_rect is None:
            first_slot_rect = normalize_rect(clicked_points[0], clicked_points[1])
            clicked_points = []
            redraw()
 
        # Third click = row end boundary
        elif first_slot_rect is not None and row_end_x is None:
            row_end_x = float(x)
            clicked_points = []
            redraw()
 
 
def main(video_path, profile_id):
    global warped_base, warped_display, first_slot_rect, row_end_x, clicked_points
 
    profile = load_camera_profile(profile_id)
    paths = get_camera_output_paths(profile_id)
 
    src_points = parse_src_points(profile["src_points"])
    warp_w = int(profile["warp_w"])
    warp_h = int(profile["warp_h"])
 
    H, H_inv, dst_points = build_homography(src_points, warp_w, warp_h)
 
    # Use saved median background if available, otherwise grab first frame
    import os
    ref = None
    if os.path.exists(paths["median_bg"]):
        ref = cv2.imread(paths["median_bg"])
 
    if ref is None:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise FileNotFoundError(f"Could not open video: {video_path}")
        ret, frame = cap.read()
        cap.release()
        if not ret:
            raise RuntimeError("Could not read first frame from video.")
        ref = frame
 
    warped = warp_image(ref, H, warp_w, warp_h)
 
    clicked_points = []
    first_slot_rect = None
    row_end_x = None
 
    warped_base = warped.copy()
    warped_display = warped.copy()
 
    print("\n=== Repeat-from-first-slot setup ===")
    print("Step 1: Click the TOP-LEFT corner of the first slot")
    print("Step 2: Click the BOTTOM-RIGHT corner of the first slot")
    print("Step 3: Click anywhere on the RIGHT EDGE where the row ends")
    print("\nControls:")
    print("  ENTER = save and continue")
    print("  C     = clear and start over")
    print("  ESC   = cancel without saving\n")
 
    cv2.namedWindow("Repeat Slot Setup", cv2.WINDOW_NORMAL)
    cv2.setMouseCallback("Repeat Slot Setup", mouse_callback)
 
    redraw()
 
    while True:
        cv2.imshow("Repeat Slot Setup", warped_display)
        key = cv2.waitKey(1) & 0xFF
 
        if key == 13:  # Enter
            break
        elif key == ord("c"):
            clicked_points = []
            first_slot_rect = None
            row_end_x = None
            redraw()
            print("Cleared. Start over.")
        elif key == 27:  # ESC
            cv2.destroyAllWindows()
            print("Cancelled. Nothing saved.")
            return
 
    cv2.destroyAllWindows()
 
    if first_slot_rect is None or row_end_x is None:
        print("Setup incomplete — need both the first slot and the row end. Nothing saved.")
        return
 
    update_repeat_slot_setup(
        profile_id=profile_id,
        first_slot_rect_warp=first_slot_rect,
        row_end_x=row_end_x,
        row_start_x=first_slot_rect[0],
        direction="right",
    )
 
    print(f"\nSaved repeat-slot setup to: {paths['profile_json']}")
    print(f"  First slot rect: {first_slot_rect}")
    print(f"  Row end x:       {row_end_x}")
    print("\nNow run:")
    print(f"  python src/run_pipeline.py --video <your_video> --profile_id {profile_id} --reuse_profile")
 
 
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True, help="Path to input video")
    parser.add_argument("--profile_id", required=True, help="Profile ID, e.g. camera_1_top")
    args = parser.parse_args()
 
    main(args.video, args.profile_id)