"""
Test the fixed slot detection with debug mode
"""

import cv2
from core.auto_slot_detector import AutoSlotDetector

image_path = "data/blueprints/parking_blueprint.png"

print("\n" + "="*60)
print("FIXED AUTOMATIC SLOT DETECTION (WITH DEBUG)")
print("="*60)

detector = AutoSlotDetector(image_path)

# STEP 1: Generate debug visualization FIRST
print("\nGenerating debug visualization...")
debug_viz = detector.visualize_debug()
cv2.imwrite("debug_lines.jpg", debug_viz)
print("✓ Debug visualization saved: debug_lines.jpg")
print("  (This shows all detected lines grouped by angle)")

# STEP 2: Detect slots with adjusted parameters
print("\nDetecting slots...")
slots = detector.detect_slots(
    min_slot_width=20,    # Adjusted for perspective
    max_slot_width=250    # Adjusted for perspective
)

if len(slots) > 0:
    print(f"\n✓ Detected {len(slots)} parking slots!")
    
    # Show sample slots
    print("\nSample detected slots:")
    for slot in slots[:10]:  # Show first 10
        print(f"  {slot['zone']}: Width={slot['width']:.0f}px, Area={slot['area']:.0f}px²")
    
    # Visualize final result
    result = detector.visualize_detected_slots()
    cv2.imwrite("fixed_detection.jpg", result)
    
    print("\n✓ Visualization saved: fixed_detection.jpg")
    print("\nShowing both visualizations...")
    
    # Show debug first
    cv2.imshow("Debug - Line Groups", debug_viz)
    cv2.waitKey(0)
    
    # Then show final result
    cv2.imshow("Final - Detected Slots", result)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    
    # Save config
    detector.save_slots("fixed_parking_slots.json")
    
    print("\n" + "="*60)
    print("SUCCESS!")
    print("Files created:")
    print("  - debug_lines.jpg (shows detected line groups)")
    print("  - fixed_detection.jpg (shows final slots)")
    print("  - fixed_parking_slots.json (configuration file)")
    print("="*60)
else:
    print("\n✗ No slots detected")
    print("\nCheck debug_lines.jpg to see what lines were detected")
    print("You may need to adjust:")
    print("  - min_slot_width / max_slot_width")
    print("  - Line merging parameters")
    
    # Still show debug
    cv2.imshow("Debug - Why no slots?", debug_viz)
    cv2.waitKey(0)
    cv2.destroyAllWindows()