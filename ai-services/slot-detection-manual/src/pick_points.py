import cv2
import argparse

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


def main(video_path):
    global display_image, clicked_points

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Could not open video: {video_path}")

    ret, frame = cap.read()
    cap.release()

    if not ret:
        raise RuntimeError("Could not read first frame from video.")

    display_image = frame.copy()

    print("Click 4 points in this order:")
    print("1 = top-left")
    print("2 = top-right")
    print("3 = bottom-right")
    print("4 = bottom-left")
    print("Press ESC when done.")

    cv2.namedWindow("Pick 4 Points", cv2.WINDOW_NORMAL)
    cv2.setMouseCallback("Pick 4 Points", mouse_callback)

    while True:
        cv2.imshow("Pick 4 Points", display_image)
        key = cv2.waitKey(1) & 0xFF

        if key == 27:
            break

    cv2.destroyAllWindows()

    if len(clicked_points) != 4:
        print("You must click exactly 4 points.")
        return

    result = " ".join([f"{x},{y}" for x, y in clicked_points])
    print("\nUse this in --src_points:")
    print(result)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", required=True, help="Path to input video")
    args = parser.parse_args()
    main(args.video)