import cv2
import argparse
import logging

from src.PlateDetector import PlateDetector
from src.Car import Car
from src.utils.draw_arabic import draw_arabic_text_box


# Silence noisy libraries
logging.getLogger("ppocr").setLevel(logging.ERROR)
logging.getLogger("ultralytics").setLevel(logging.ERROR)
logging.getLogger("PIL").setLevel(logging.ERROR)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--input", required=True, help="Input video path")
    parser.add_argument("-d", "--display", action="store_true", help="Display output")
    return parser.parse_args()


def main():
    args = parse_args()

    detector = PlateDetector()
    cap = cv2.VideoCapture(args.input)

    if not cap.isOpened():
        raise RuntimeError("Cannot open input video")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    out = cv2.VideoWriter(
        "output_video.mp4",
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height)
    )

    if args.display:
        cv2.namedWindow("ALPR", cv2.WINDOW_NORMAL)
        cv2.resizeWindow("ALPR", width, height)

    cars = {}

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        detections, active_ids = detector.find_vehicles(frame)

        for x1, y1, x2, y2, car_id, plate_img in detections:
            if car_id not in cars:
                cars[car_id] = Car(car_id, (x1, y1, x2, y2))

            car = cars[car_id]
            car.update_bbox((x1, y1, x2, y2))

            if not car.final_plate and plate_img is not None:
                car.try_read_plate(plate_img)

        for car_id in active_ids:
            car = cars.get(car_id)
            if not car:
                continue

            cv2.rectangle(
                frame,
                (car.x1, car.y1),
                (car.x2, car.y2),
                car.color,
                2
            )

            if car.final_plate:
                draw_arabic_text_box(
                    frame,
                    car.final_plate,
                    (car.x1, car.y1 - 10)
                )

                if not car.printed:
                    print(f"[PLATE] {car.final_plate}")
                    car.printed = True

        out.write(frame)

        if args.display:
            cv2.imshow("ALPR", frame)
            if cv2.waitKey(1) & 0xFF == 27:
                break

    cap.release()
    out.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
