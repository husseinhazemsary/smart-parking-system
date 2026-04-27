"""
Automatic parking slot detection - no manual drawing needed
Just provide an empty parking lot image and video
"""

import cv2
import os
from core.auto_slot_detector import AutoSlotDetector
from config.settings import LAYOUT_DIR, OUTPUT_DIR


def auto_calibrate(empty_lot_image, lot_id):
    """
    Automatically detect parking slots from empty lot image

    Args:
        empty_lot_image: Path to image of empty parking lot
        lot_id: Unique identifier for this parking lot

    Returns:
        Path to saved slot configuration JSON
    """
    print("\n" + "="*60)
    print("AUTOMATIC SLOT DETECTION")
    print("="*60)
    print(f"\nProcessing: {empty_lot_image}")

    debug_dir = os.path.join(OUTPUT_DIR, 'debug', lot_id)
    os.makedirs(debug_dir, exist_ok=True)

    # Create detector
    detector = AutoSlotDetector(empty_lot_image, debug_dir=debug_dir)

    # Detect slots
    slots = detector.detect_slots(
        min_slot_width=20
    )

    if len(slots) == 0:
        print("\nWARNING: No slots detected!")
        print("Tips:")
        print("  - Make sure parking lines are clearly visible")
        print("  - Try adjusting min_area and max_area parameters")
        print("  - Image should show parking lot from above (bird's eye view works best)")
        return None

    # Visualize results
    print("\nGenerating visualization...")
    result_image = detector.visualize_detected_slots()

    # Save visualization into the per-lot debug folder
    viz_path = os.path.join(debug_dir, f"{lot_id}_detected_slots.jpg")
    cv2.imwrite(viz_path, result_image)
    print(f"OK Visualization saved to: {viz_path}")
    
    # Save slot configuration
    config_path = os.path.join(LAYOUT_DIR, f"{lot_id}_auto_slots.json")
    detector.save_slots(config_path)
    
    # Show visualization
    print("\nShowing detected slots... (press any key to continue)")
    cv2.imshow("Detected Parking Slots", result_image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    
    print("\n" + "="*60)
    print(f"OK Automatic detection complete!")
    print(f"OK Detected {len(slots)} parking slots")
    print(f"OK Configuration saved to: {config_path}")
    print(f"OK Debug images saved to:  {debug_dir}")
    print("="*60)

    return config_path


if __name__ == "__main__":
    print("\n" + "="*60)
    print("AUTOMATIC PARKING SLOT DETECTION")
    print("="*60)

    lot_id = input("\nEnter parking lot ID: ").strip()
    empty_lot_image = input("Enter path to empty parking lot image: ").strip()

    if not os.path.exists(empty_lot_image):
        print(f"Error: Image not found: {empty_lot_image}")
        exit()

    config_path = auto_calibrate(empty_lot_image, lot_id)

    if config_path:
        debug_dir = os.path.join(OUTPUT_DIR, 'debug', lot_id)
        print("\nNext steps:")
        print(f"1. Review debug images in: {debug_dir}/")
        print(f"2. Edit {config_path} to adjust slot types (regular/disabled/ev)")
        print(f"3. Run: python main.py (option 2) to process videos")