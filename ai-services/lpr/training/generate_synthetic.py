"""
Synthetic Egyptian license plate image generator for PaddleOCR recognition training.

Generates fake plate images with guaranteed correct labels, using only the characters
present in models/arabic_plates_rec/dict.txt (18 Arabic letters + 10 Arabic-Indic digits).

Egyptian plate layout (private-car white plate):
  ┌──────────────────────────────┐
  │          م ص ر               │  ← red header strip (~28% height)
  ├──────────────────────────────┤
  │  ٢٣٤٥  │  ه أ               │  ← digits left, letters right
  └──────────────────────────────┘

Label format (matching prepare_dataset.py convention):
    letters (RTL order) + digits (LTR order)
    e.g.  "هأ٢٣٤٥"

Each generated image also receives a random set of the same augmentations used
in augment_dataset.py so the synthetic images look realistically degraded.

Usage:
    python training/generate_synthetic.py \\
        --output_dir  /path/to/dataset/synthetic \\
        --n           5000 \\
        --labels      /path/to/dataset/synthetic_labels.txt \\
        --font        ai-services/lpr/fonts/Amiri-Regular.ttf

Then append synthetic_labels.txt to train_labels_augmented.txt and re-train.
"""

import os
import sys
import random
import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except ImportError:
    sys.exit("[ERROR] arabic_reshaper / python-bidi not installed.\n"
             "        Run: pip install arabic-reshaper python-bidi")


# ---------------------------------------------------------------------------
# Character sets — must match models/arabic_plates_rec/dict.txt exactly
# ---------------------------------------------------------------------------

LETTERS = list('أبجدرزسصطعفقلمنهوي')   # 18 letters from dict.txt
DIGITS  = list('٠١٢٣٤٥٦٧٨٩')           # 10 Arabic-Indic digits


# ---------------------------------------------------------------------------
# Augmentation helpers (same logic as augment_dataset.py)
# ---------------------------------------------------------------------------

def _brightness_contrast(img, brightness=(-40, 40), contrast=(0.7, 1.3)):
    alpha = random.uniform(*contrast)
    beta  = random.uniform(*brightness)
    return cv2.convertScaleAbs(img, alpha=alpha, beta=beta)


def _rotation(img, max_angle=8):
    angle = random.uniform(-max_angle, max_angle)
    h, w  = img.shape[:2]
    M     = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    return cv2.warpAffine(img, M, (w, h),
                          flags=cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_REPLICATE)


def _gaussian_noise(img, max_std=20):
    std   = random.uniform(3, max_std)
    noise = np.random.normal(0, std, img.shape).astype(np.float32)
    return np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)


def _blur(img):
    choice = random.choices(['gaussian', 'motion', 'none'], weights=[0.35, 0.30, 0.35])[0]
    if choice == 'gaussian':
        k = random.choice([3, 5])
        return cv2.GaussianBlur(img, (k, k), 0)
    if choice == 'motion':
        k = random.choice([3, 5, 7])
        kernel         = np.zeros((k, k), dtype=np.float32)
        kernel[k // 2] = 1.0 / k
        return cv2.filter2D(img, -1, kernel)
    return img


def _perspective(img, strength=0.03):
    h, w = img.shape[:2]

    def j():
        return random.uniform(-strength, strength)

    src = np.float32([[0,   0  ], [w-1, 0  ], [w-1, h-1], [0,   h-1]])
    dst = np.float32([[w*j(),    h*j()    ], [w-w*j(),  h*j()    ],
                      [w-w*j(),  h-h*j()  ], [w*j(),    h-h*j()  ]])
    M = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(img, M, (w, h),
                               flags=cv2.INTER_LINEAR,
                               borderMode=cv2.BORDER_REPLICATE)


def augment(img: np.ndarray) -> np.ndarray:
    img = _brightness_contrast(img)
    if random.random() < 0.60:
        img = _rotation(img)
    if random.random() < 0.50:
        img = _gaussian_noise(img)
    if random.random() < 0.50:
        img = _blur(img)
    if random.random() < 0.40:
        img = _perspective(img)
    return img


# ---------------------------------------------------------------------------
# Arabic rendering helper
# ---------------------------------------------------------------------------

def _reshape(text: str) -> str:
    """Apply Arabic shaping + BiDi algorithm for correct visual display."""
    return get_display(arabic_reshaper.reshape(text))


# ---------------------------------------------------------------------------
# Plate image generator
# ---------------------------------------------------------------------------

def _load_font(font_path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(font_path, size=size)
    except Exception:
        return ImageFont.load_default()


def generate_plate_image(
    letters: str,
    digits: str,
    font_path: str,
    width: int  = 320,
    height: int = 100,
) -> np.ndarray:
    """
    Render a synthetic Egyptian license plate as a NumPy BGR image.

    Layout:
      - White background with thin dark border
      - Red header strip (top ~28%) with "مصر" centred in white
      - Digits rendered left-of-centre, letters rendered right-of-centre
      - Thin vertical separator line in the middle

    The label for this image is:  letters + digits
    (matching the prepare_dataset.py convention)
    """

    # --- canvas ---
    img  = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # outer border
    draw.rectangle([0, 0, width - 1, height - 1], outline=(40, 40, 40), width=2)

    # --- header strip ---
    header_h    = int(height * 0.28)
    header_col  = (random.randint(150, 200), random.randint(20, 50), random.randint(20, 50))
    draw.rectangle([1, 1, width - 2, header_h], fill=header_col)

    header_font = _load_font(font_path, size=max(10, int(header_h * 0.75)))
    misr_vis    = _reshape('مصر')
    bbox        = draw.textbbox((0, 0), misr_vis, font=header_font)
    tw, th      = bbox[2] - bbox[0], bbox[3] - bbox[1]
    # Subtract bbox offsets so the visible text is truly centred in the header
    draw.text(
        ((width - tw) // 2 - bbox[0], (header_h - th) // 2 - bbox[1]),
        misr_vis,
        fill=(255, 255, 255),
        font=header_font,
    )

    # --- main area ---
    main_top = header_h + 3
    main_h   = height - main_top - 4

    plate_font = _load_font(font_path, size=max(12, int(main_h * 0.82)))

    # separator line
    sep_x = width // 2
    draw.line([(sep_x, main_top + 4), (sep_x, height - 6)],
              fill=(160, 160, 160), width=1)

    # --- digits (left side) ---
    digits_vis  = _reshape(digits)
    db          = draw.textbbox((0, 0), digits_vis, font=plate_font)
    dw, dh      = db[2] - db[0], db[3] - db[1]
    left_margin = int(width * 0.06)
    dx = left_margin - db[0]
    # Subtract db[1] so the visible glyph is vertically centred, not the draw origin
    dy = main_top + (main_h - dh) // 2 - db[1]
    draw.text((dx, dy), digits_vis, fill=(0, 0, 0), font=plate_font)

    # --- letters (right side) ---
    letters_vis  = _reshape(letters)
    lb           = draw.textbbox((0, 0), letters_vis, font=plate_font)
    lw, lh       = lb[2] - lb[0], lb[3] - lb[1]
    right_margin = int(width * 0.06)
    lx = width - right_margin - lw - lb[0]
    # Same offset correction for vertical centering
    ly = main_top + (main_h - lh) // 2 - lb[1]
    draw.text((lx, ly), letters_vis, fill=(0, 0, 0), font=plate_font)

    # PIL → OpenCV BGR
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)


# ---------------------------------------------------------------------------
# Random plate text
# ---------------------------------------------------------------------------

def random_plate():
    """Return (letters_str, digits_str) for a valid Egyptian plate."""
    n_letters = random.randint(2, 3)
    n_digits  = random.randint(3, 4)
    letters   = ''.join(random.choices(LETTERS, k=n_letters))
    digits    = ''.join(random.choices(DIGITS,  k=n_digits))
    return letters, digits


# ---------------------------------------------------------------------------
# Dataset generation
# ---------------------------------------------------------------------------

def generate_dataset(
    output_dir: str,
    n_images:   int,
    font_path:  str,
    labels_file: str,
    apply_augmentation: bool = True,
) -> None:
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    font_path = str(Path(font_path).resolve())
    if not Path(font_path).is_file():
        print(f"[WARN] Font not found at {font_path}. PIL default font will be used.")

    print(f"[INFO] Generating {n_images} synthetic plate images → {out}")

    label_lines: list[str] = []
    digits_in_label = len(str(n_images))  # zero-pad width

    for i in range(n_images):
        letters, digits = random_plate()

        # label: letters (RTL order, already single string) + digits
        label = letters + digits

        # Vary canvas size slightly to add diversity (±10%)
        w = random.randint(288, 352)
        h = random.randint(88, 112)

        plate_bgr = generate_plate_image(letters, digits, font_path, width=w, height=h)

        if apply_augmentation:
            plate_bgr = augment(plate_bgr)

        filename = f"syn_{i:0{digits_in_label}d}.jpg"
        img_path = out / filename
        cv2.imwrite(str(img_path), plate_bgr,
                    [cv2.IMWRITE_JPEG_QUALITY, random.randint(75, 95)])

        # Use path relative to the labels file's parent (dataset root) so the
        # label file stays portable across machines and Kaggle datasets.
        labels_parent = Path(labels_file).resolve().parent
        try:
            rel_path = img_path.resolve().relative_to(labels_parent).as_posix()
        except ValueError:
            # synthetic folder is outside the dataset root — fall back to absolute
            rel_path = str(img_path.resolve())

        label_lines.append(f"{rel_path}\t{label}")

        if (i + 1) % 500 == 0:
            print(f"  {i + 1}/{n_images} generated…")

    labels_path = Path(labels_file)
    labels_path.parent.mkdir(parents=True, exist_ok=True)
    with open(labels_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(label_lines))

    print(f"\n[DONE]  {n_images} images written to  {out}")
    print(f"        Label file written to          {labels_path}")
    print(f"\nNext step: append this label file to your augmented training labels:")
    print(f"  cat train_labels_augmented.txt {labels_path} > train_labels_final.txt")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    # Resolve default font relative to this script's location
    _script_dir  = Path(__file__).resolve().parent          # training/
    _lpr_dir     = _script_dir.parent                       # ai-services/lpr/
    _default_font = str(_lpr_dir / 'fonts' / 'Amiri-Regular.ttf')

    parser = argparse.ArgumentParser(
        description='Generate synthetic Egyptian license plate images for OCR training')
    parser.add_argument('--output_dir', required=True,
                        help='Directory to save generated images')
    parser.add_argument('--n',          type=int, default=5000,
                        help='Number of images to generate (default: 5000)')
    parser.add_argument('--labels',     required=True,
                        help='Output labels file (path<TAB>text, one per line)')
    parser.add_argument('--font',       default=_default_font,
                        help=f'Path to Arabic TTF font (default: {_default_font})')
    parser.add_argument('--no_augment', action='store_true',
                        help='Skip augmentation (generate clean plates only)')
    args = parser.parse_args()

    generate_dataset(
        output_dir          = args.output_dir,
        n_images            = args.n,
        font_path           = args.font,
        labels_file         = args.labels,
        apply_augmentation  = not args.no_augment,
    )
