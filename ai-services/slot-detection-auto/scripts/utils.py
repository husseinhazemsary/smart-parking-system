"""Utility functions for slot detection scripts, such as drawing lines and saving debug images."""

import cv2
import os

def draw_lines(img, lines, color=(0, 0, 255), show_numbers=False):
    """Draw lines on a copy of the image. Returns the new image and the count of lines drawn."""
    out = img.copy()
    count = 0
    if lines is not None:
        for i, l in enumerate(lines):
            x1, y1 = int(l['start'][0]), int(l['start'][1])
            x2, y2 = int(l['end'][0]),   int(l['end'][1])
            cv2.line(out, (x1, y1), (x2, y2), color, 2)
            if show_numbers:
                mid_x = (x1 + x2) // 2
                mid_y = (y1 + y2) // 2
                cv2.putText(out, str(i), (mid_x, mid_y),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1, cv2.LINE_AA)
            count += 1
    return out, count

def save_debug(debug_dir: str, stage_name: str, image):
    """Save an intermediate image for debugging. Creates debug_dir if it doesn't exist."""
    os.makedirs(debug_dir, exist_ok=True)
    cv2.imwrite(os.path.join(debug_dir, f"{stage_name}.png"), image)