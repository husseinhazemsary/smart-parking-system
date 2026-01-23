# Renders Arabic text correctly on OpenCV frames

from PIL import Image, ImageDraw, ImageFont
import numpy as np
import arabic_reshaper
from bidi.algorithm import get_display

FONT_PATH = "doc/fonts/arial.ttf"

def draw_arabic_text_box(
    frame,
    text,
    position,
    font_size=32,
    text_color=(0, 0, 0),
    box_color=(255, 255, 255),
    padding=6
):
    # Reshape Arabic text (connect letters) 
    reshaped = arabic_reshaper.reshape(str(text))
    
    # Apply BiDi algorithm (reverse for RTL) - Reverses text for right-to-left display
    bidi_text = get_display(reshaped)

    # Convert OpenCV frame to PIL Image
    img_pil = Image.fromarray(frame)
    draw = ImageDraw.Draw(img_pil)

    # Load Arabic font
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except:
        font = ImageFont.load_default()

    # Calculate text dimensions
    text_width, text_height = draw.textsize(bidi_text, font=font)

    # Draw box and text
    x, y = position
    y = max(0, y - text_height - padding * 2)

    draw.rectangle(
        [
            x,
            y,
            x + text_width + padding * 2,
            y + text_height + padding * 2
        ],
        fill=box_color
    )

    # Draw text on box
    draw.text(
        (x + padding, y + padding),
        bidi_text,
        fill=text_color,
        font=font
    )

    # Convert back to OpenCV format
    frame[:] = np.array(img_pil)
