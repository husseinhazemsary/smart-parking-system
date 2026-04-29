from pathlib import Path

from ultralytics import YOLO
import cv2
import os

model = YOLO("models/best.pt")

print("Test input type:")
print("1. Video")
print("2. Image")
choice = input("Enter choice (1 or 2): ").strip()

if choice == "1":
    video_path = input("Enter video path (or press Enter for default): ").strip()
    filename = Path(video_path).name
    if not video_path:
        video_path = "data/videos/ai_vid.mp4"
    frame_num = input("Enter frame number to grab (or press Enter for 30): ").strip()
    frame_num = int(frame_num) if frame_num else 30

    cap = cv2.VideoCapture(video_path)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        print(f"Could not read frame {frame_num} from video: {video_path}")
        exit(1)

elif choice == "2":
    image_path = input("Enter image path: ").strip()
    filename = Path(image_path).name
    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        exit(1)
    frame = cv2.imread(image_path)
    if frame is None:
        print(f"Could not load image: {image_path}")
        exit(1)

else:
    print("Invalid choice")
    exit(1)

results = model(frame, conf=0.3)[0]

os.makedirs("output", exist_ok=True)
annotated = results.plot()
cv2.imwrite(f"output/test/best_pt_test_{filename}", annotated)
print(f"Detected {len(results.obb) if results.obb is not None else 0} slots")
print(f"Saved to output/test/best_pt_test_{filename}")
