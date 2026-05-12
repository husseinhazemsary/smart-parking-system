import cv2
import numpy as np
import argparse
import json
import os


# ── State ─────────────────────────────────────────────────────────────────────
points = []
dragging_idx = None
DRAG_RADIUS = 15


# ── Geometry ──────────────────────────────────────────────────────────────────
def order_points(pts):
    pts = np.array(pts, dtype="float32")
    by_y = pts[np.argsort(pts[:, 1])]
    top = by_y[:2][np.argsort(by_y[:2, 0])]
    bot = by_y[2:][np.argsort(by_y[2:, 0])]
    # TL, TR, BR, BL
    return np.array([top[0], top[1], bot[1], bot[0]], dtype="float32")


def compute_output_size(src, max_dim=1200):
    """Derive output W×H from the real-world shape of the selected quad."""
    tl, tr, br, bl = src
    w = float(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl)))
    h = float(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr)))
    scale = max_dim / max(w, h)
    return int(w * scale), int(h * scale)


def build_matrix(src, out_w, out_h):
    dst = np.float32([
        [0,         0        ],
        [out_w - 1, 0        ],
        [out_w - 1, out_h - 1],
        [0,         out_h - 1],
    ])
    return cv2.getPerspectiveTransform(src, dst)


# ── Mouse callback ─────────────────────────────────────────────────────────────
def _nearest(x, y):
    if not points:
        return None
    dists = [np.hypot(x - p[0], y - p[1]) for p in points]
    idx = int(np.argmin(dists))
    return idx if dists[idx] < DRAG_RADIUS else None


def mouse_callback(event, x, y, flags, param):
    global points, dragging_idx

    if event == cv2.EVENT_LBUTTONDOWN:
        idx = _nearest(x, y)
        if idx is not None:
            dragging_idx = idx          # start drag
        elif len(points) < 4:
            points.append([x, y])       # place new point

    elif event == cv2.EVENT_MOUSEMOVE:
        if dragging_idx is not None:
            points[dragging_idx] = [x, y]

    elif event == cv2.EVENT_LBUTTONUP:
        dragging_idx = None


# ── Calibration UI ────────────────────────────────────────────────────────────
_COLORS = [(0, 0, 255), (0, 165, 255), (0, 255, 0), (255, 0, 0)]
_LABELS = ["TL", "TR", "BR", "BL"]


def _draw_ui(frame):
    disp = frame.copy()
    for i, p in enumerate(points):
        px, py = int(p[0]), int(p[1])
        cv2.circle(disp, (px, py), 8, _COLORS[i % 4], -1)
        cv2.circle(disp, (px, py), DRAG_RADIUS, _COLORS[i % 4], 1)
        cv2.putText(disp, _LABELS[i], (px + 12, py - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, _COLORS[i % 4], 2)

    if len(points) == 4:
        cv2.polylines(disp, [np.array(points, dtype=np.int32)], True, (0, 255, 255), 2)
        hint = "Drag corners to adjust  |  ENTER = confirm  |  R = reset"
    else:
        hint = f"Click corner {len(points) + 1}/4  |  R = reset  |  ESC = quit"

    cv2.putText(disp, hint, (10, disp.shape[0] - 12),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
    return disp


def select_points(frame):
    """Interactive calibration: click + drag 4 corners, live bird's-eye preview."""
    global points
    points = []

    cv2.namedWindow("Calibration — select 4 corners", cv2.WINDOW_NORMAL)
    cv2.setMouseCallback("Calibration — select 4 corners", mouse_callback)

    print("\nCalibration:")
    print("  Click the 4 corners of the parking area (any order).")
    print("  Drag any corner to fine-tune.")
    print("  A live bird's-eye preview updates automatically.")
    print("  ENTER to confirm | R to reset | ESC to quit\n")

    while True:
        cv2.imshow("Calibration — select 4 corners", _draw_ui(frame))

        if len(points) == 4:
            ordered = order_points(points)
            w, h = compute_output_size(ordered)
            preview = cv2.warpPerspective(frame, build_matrix(ordered, w, h), (w, h))
            cv2.namedWindow("Bird's-eye preview", cv2.WINDOW_NORMAL)
            cv2.imshow("Bird's-eye preview", preview)

        key = cv2.waitKey(16) & 0xFF

        if key == ord("r"):
            points = []
            print("  Points reset.")
            try:
                cv2.destroyWindow("Bird's-eye preview")
            except Exception:
                pass

        elif key == 13:  # ENTER
            if len(points) == 4:
                break
            print("  Need exactly 4 points first.")

        elif key == 27:  # ESC
            cv2.destroyAllWindows()
            raise SystemExit("Cancelled.")

    cv2.destroyAllWindows()
    return order_points(points)


# ── Main processing ───────────────────────────────────────────────────────────
def warp_video(input_path, output_path, calibration_path):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise SystemExit(f"Cannot open video: {input_path}")

    ret, first_frame = cap.read()
    if not ret:
        raise SystemExit("Cannot read first frame.")

    # ── load or run calibration ───────────────────────────────────────────────
    if calibration_path and os.path.exists(calibration_path):
        with open(calibration_path) as f:
            cal = json.load(f)
        src = np.array(cal["points"], dtype="float32")
        out_w, out_h = cal["width"], cal["height"]
        print(f"Loaded calibration: {calibration_path}  ({out_w}×{out_h})")
    else:
        src = select_points(first_frame)
        out_w, out_h = compute_output_size(src)
        if calibration_path:
            with open(calibration_path, "w") as f:
                json.dump({"points": src.tolist(), "width": out_w, "height": out_h}, f, indent=2)
            print(f"Calibration saved: {calibration_path}")

    M = build_matrix(src, out_w, out_h)

    # ── writer ────────────────────────────────────────────────────────────────
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    fourcc = cv2.VideoWriter_fourcc(*"XVID")
    writer = cv2.VideoWriter(output_path, fourcc, fps, (out_w, out_h))
    if not writer.isOpened():
        raise SystemExit(f"Cannot open VideoWriter: {output_path}")

    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"\nProcessing {total} frames → {out_w}×{out_h} @ {fps:.1f} fps")
    print("(ESC in preview window to stop early)\n")

    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        warped = cv2.warpPerspective(frame, M, (out_w, out_h))
        writer.write(warped)
        idx += 1

        if idx % 60 == 0 or idx == total:
            pct = idx / total * 100 if total else 0
            print(f"  {idx}/{total}  ({pct:.0f}%)")

        cv2.imshow("Bird's-eye output (ESC to stop)", warped)
        if cv2.waitKey(1) & 0xFF == 27:
            print("Stopped early by user.")
            break

    cap.release()
    writer.release()
    cv2.destroyAllWindows()
    print(f"\nSaved: {output_path}")


# ── CLI ───────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser(
        description="Warp a parking-lot video to a bird's-eye (top-down) view."
    )
    ap.add_argument("--input",       required=True,
                    help="Path to input video")
    ap.add_argument("--output",      default="warped_output.avi",
                    help="Path to output video (.avi)")
    ap.add_argument("--calibration", default="calibration.json",
                    help="JSON file for saving/loading calibration (default: calibration.json)")
    args = ap.parse_args()

    warp_video(args.input, args.output, args.calibration)


if __name__ == "__main__":
    main()
