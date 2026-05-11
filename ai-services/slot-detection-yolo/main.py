import os
import shutil
from calibrate import calibrate
from detect import process_video
from config import SLOTS_DIR


def main():
    print("\n" + "=" * 50)
    print("  FULL-LOT PARKING DETECTION SYSTEM")
    print("=" * 50)
    print("\n1. Calibrate from reference image (YOLO — lot must be full)")
    print("2. Process video with existing calibration")
    print("3. Import slot definitions from line detection (slot_definer.py)")

    choice = input("\nEnter choice (1/2/3): ").strip()

    if choice == "1":
        lot_id     = input("Parking lot ID: ").strip()
        image_path = input("Path to reference image: ").strip()

        if not os.path.exists(image_path):
            print(f"Image not found: {image_path}")
            return

        slots_path = calibrate(image_path, lot_id)

        if slots_path:
            go = input("\nCalibration done. Process a video now? (y/n): ").strip().lower()
            if go == "y":
                video_path = input("Path to video: ").strip()
                if os.path.exists(video_path):
                    process_video(video_path, slots_path, lot_id)
                else:
                    print(f"Video not found: {video_path}")

    elif choice == "2":
        lot_id     = input("Parking lot ID: ").strip()
        slots_path = os.path.join(SLOTS_DIR, f"{lot_id}_slots.json")

        if not os.path.exists(slots_path):
            print(f"No calibration found for '{lot_id}'. Run option 1 or 3 first.")
            return

        video_path = input("Path to video: ").strip()
        if not os.path.exists(video_path):
            print(f"Video not found: {video_path}")
            return

        process_video(video_path, slots_path, lot_id)

    elif choice == "3":
        print("\nImport slots from slot_definer.py output.")
        print("Run slot_definer.py first:  python scripts/slot_definer.py <image> <lot_id>")
        print("It saves to:  old-slot-detection/data/layouts/<lot_id>_auto_slots.json\n")

        src_path = input("Path to slot_definer JSON file: ").strip().strip('"').strip("'")
        if not os.path.exists(src_path):
            print(f"File not found: {src_path}")
            return

        lot_id = input("Parking lot ID (used for the output video filename): ").strip()

        os.makedirs(SLOTS_DIR, exist_ok=True)
        dst_path = os.path.join(SLOTS_DIR, f"{lot_id}_slots.json")
        shutil.copy2(src_path, dst_path)
        print(f"Slots copied → {dst_path}")

        go = input("\nProcess a video now? (y/n): ").strip().lower()
        if go == "y":
            video_path = input("Path to video: ").strip()
            if os.path.exists(video_path):
                process_video(video_path, dst_path, lot_id)
            else:
                print(f"Video not found: {video_path}")

    else:
        print("Invalid choice.")


if __name__ == "__main__":
    main()
