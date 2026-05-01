import os
import json


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def get_camera_profile_dir(profile_id):
    return os.path.join("camera_profiles", profile_id)


def get_camera_profile_path(profile_id):
    return os.path.join(get_camera_profile_dir(profile_id), "profile.json")


def get_camera_output_paths(profile_id):
    base_dir = get_camera_profile_dir(profile_id)

    return {
        "base_dir": base_dir,
        "profile_json": os.path.join(base_dir, "profile.json"),
        "spots_json": os.path.join(base_dir, "spots.json"),
        "median_bg": os.path.join(base_dir, "median_background.jpg"),
        "debug_original": os.path.join(base_dir, "slots_debug_original.jpg"),
        "debug_warped": os.path.join(base_dir, "slots_debug_warped.jpg"),
        "mask_warped": os.path.join(base_dir, "slots_mask_warped.jpg"),
        "result_video": os.path.join(base_dir, "parking_result.mp4"),
    }


def profile_exists(profile_id):
    return os.path.exists(get_camera_profile_path(profile_id))


def save_camera_profile(
    profile_id,
    src_points,
    warp_w,
    warp_h,
    row_margin_top,
    row_margin_bottom,
):
    profile_dir = get_camera_profile_dir(profile_id)
    ensure_dir(profile_dir)

    profile_data = {
        "profile_id": profile_id,
        "src_points": src_points,
        "calibration_mode": "repeat_from_first_slot",
        "warp_w": int(warp_w),
        "warp_h": int(warp_h),
        "row_margin_top": int(row_margin_top),
        "row_margin_bottom": int(row_margin_bottom),
        "repeat_slot": {
            "first_slot_rect_warp": None,
            "row_start_x": None,
            "row_end_x": None,
            "direction": "right"
        }
    }

    with open(get_camera_profile_path(profile_id), "w", encoding="utf-8") as f:
        json.dump(profile_data, f, indent=4)

    return get_camera_profile_path(profile_id)


def load_camera_profile(profile_id):
    profile_path = get_camera_profile_path(profile_id)

    if not os.path.exists(profile_path):
        raise FileNotFoundError(f"Profile not found: {profile_path}")

    with open(profile_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_profile_data(profile_id, profile_data):
    profile_path = get_camera_profile_path(profile_id)
    ensure_dir(os.path.dirname(profile_path))

    with open(profile_path, "w", encoding="utf-8") as f:
        json.dump(profile_data, f, indent=4)

    return profile_path


def update_repeat_slot_setup(
    profile_id,
    first_slot_rect_warp,
    row_end_x,
    row_start_x=None,
    direction="right",
):
    profile = load_camera_profile(profile_id)

    if "repeat_slot" not in profile:
        profile["repeat_slot"] = {}

    profile["calibration_mode"] = "repeat_from_first_slot"
    profile["repeat_slot"]["first_slot_rect_warp"] = [float(v) for v in first_slot_rect_warp]
    profile["repeat_slot"]["row_end_x"] = float(row_end_x)
    profile["repeat_slot"]["row_start_x"] = None if row_start_x is None else float(row_start_x)
    profile["repeat_slot"]["direction"] = direction

    save_profile_data(profile_id, profile)
    return profile