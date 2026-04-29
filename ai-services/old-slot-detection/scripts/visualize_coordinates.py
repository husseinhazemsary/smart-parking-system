import cv2
import json
import math
import numpy as np

image_path = "output/ai_white_only.png"
json_path = "output/lines/ai.json"
output_path = "output/coordinate_visual_debug.png"

# -----------------------------
# Load image and JSON
# -----------------------------
img = cv2.imread(image_path)

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

lines = data["lines"]
h, w = img.shape[:2]

# -----------------------------
# Settings
# -----------------------------
grid_step = 100
table_height = 260
margin = 40

canvas_w = w + margin * 2
canvas_h = h + table_height + margin * 2

canvas = np.ones((canvas_h, canvas_w, 3), dtype=np.uint8) * 245

# Place image
img_x = margin
img_y = table_height + margin
canvas[img_y:img_y+h, img_x:img_x+w] = img

# -----------------------------
# Draw coordinate table
# -----------------------------
title = "LINE NUMBER → COORDINATES (x1, y1) → (x2, y2)"
cv2.putText(canvas, title, (canvas_w // 2 - 330, 35),
            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)

cols = 6
rows_per_col = math.ceil(len(lines) / cols)
col_w = canvas_w // cols

for idx, line in enumerate(lines, start=1):
    col = (idx - 1) // rows_per_col
    row = (idx - 1) % rows_per_col

    x = col * col_w + 15
    y = 70 + row * 24

    text = f"{idx}: ({line['x1']},{line['y1']}) → ({line['x2']},{line['y2']})"

    cv2.putText(canvas, text, (x, y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45,
                (0, 0, 0), 1, cv2.LINE_AA)

    # separator line between columns
    if row == 0 and col > 0:
        cv2.line(canvas, (col * col_w, 50), (col * col_w, table_height - 10),
                 (0, 0, 0), 1)

# -----------------------------
# Draw grid on image
# -----------------------------
grid_color = (210, 210, 210)

# vertical grid lines
for x in range(0, w + 1, grid_step):
    px = img_x + x
    cv2.line(canvas, (px, img_y), (px, img_y + h), grid_color, 1)

    cv2.putText(canvas, str(x), (px + 5, img_y + 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

# horizontal grid lines
for y in range(0, h + 1, grid_step):
    py = img_y + y
    cv2.line(canvas, (img_x, py), (img_x + w, py), grid_color, 1)

    cv2.putText(canvas, str(y), (img_x + 5, py + 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

# -----------------------------
# Draw lines + line numbers
# -----------------------------
for idx, line in enumerate(lines, start=1):
    x1, y1 = line["x1"], line["y1"]
    x2, y2 = line["x2"], line["y2"]

    pt1 = (img_x + x1, img_y + y1)
    pt2 = (img_x + x2, img_y + y2)

    cv2.line(canvas, pt1, pt2, (0, 0, 255), 2)

    # midpoint for label
    mx = img_x + int((x1 + x2) / 2)
    my = img_y + int((y1 + y2) / 2)

    label = str(idx)

    # label box
    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)

    cv2.rectangle(canvas,
                  (mx - 6, my - th - 8),
                  (mx + tw + 6, my + 6),
                  (255, 255, 255),
                  -1)

    cv2.rectangle(canvas,
                  (mx - 6, my - th - 8),
                  (mx + tw + 6, my + 6),
                  (0, 0, 0),
                  1)

    cv2.putText(canvas, label, (mx, my),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                (0, 0, 255), 2, cv2.LINE_AA)

# -----------------------------
# Save output
# -----------------------------
cv2.imwrite(output_path, canvas)
print(f"Saved: {output_path}")