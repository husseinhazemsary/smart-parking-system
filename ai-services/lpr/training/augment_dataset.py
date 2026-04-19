"""
Offline data augmentation for the PaddleOCR Egyptian license plate training set.

Reads an existing PaddleOCR-format labels file (tab-separated: image_path<TAB>text),
applies N random augmentation variants per image, saves them next to the originals,
and writes a new labels file that includes both the originals and every augmented copy.

Augmentations applied (random subset each time):
  - Brightness / contrast shift  (simulate changing lighting)
  - Random rotation ±8°          (simulate tilted plates)
  - Gaussian noise               (simulate low-quality cameras)
  - Random blur (gaussian or motion)  (simulate focus / motion issues)
  - Perspective distortion       (simulate off-angle cameras)

Usage:
    python training/augment_dataset.py \\
        --labels  /path/to/train_labels.txt \\
        --output  /path/to/train_labels_augmented.txt \\
        --n       5

The --labels paths are resolved relative to the current working directory.
Augmented images are saved in the same folder as each source image.
"""

import os
import sys
import random
import argparse
from pathlib import Path

import cv2
import numpy as np


# ---------------------------------------------------------------------------
# Individual augmentation helpers
# ---------------------------------------------------------------------------

def random_brightness_contrast(img, brightness=(-40, 40), contrast=(0.7, 1.3)):
    alpha = random.uniform(*contrast)
    beta  = random.uniform(*brightness)
    return cv2.convertScaleAbs(img, alpha=alpha, beta=beta)


def random_rotation(img, max_angle=8):
    angle  = random.uniform(-max_angle, max_angle)
    h, w   = img.shape[:2]
    M      = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    return cv2.warpAffine(img, M, (w, h),
                          flags=cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_REPLICATE)


def random_gaussian_noise(img, max_std=20):
    std   = random.uniform(3, max_std)
    noise = np.random.normal(0, std, img.shape).astype(np.float32)
    return np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)


def random_blur(img):
    choice = random.choices(['gaussian', 'motion', 'none'], weights=[0.35, 0.30, 0.35])[0]
    if choice == 'gaussian':
        k = random.choice([3, 5])
        return cv2.GaussianBlur(img, (k, k), 0)
    if choice == 'motion':
        k = random.choice([3, 5, 7])
        kernel          = np.zeros((k, k), dtype=np.float32)
        kernel[k // 2]  = 1.0 / k
        return cv2.filter2D(img, -1, kernel)
    return img


def random_perspective(img, strength=0.03):
    h, w = img.shape[:2]

    def jitter():
        return random.uniform(-strength, strength)

    src = np.float32([[0,   0  ],
                      [w-1, 0  ],
                      [w-1, h-1],
                      [0,   h-1]])
    dst = np.float32([[w * jitter(),         h * jitter()        ],
                      [w - w * jitter(),     h * jitter()        ],
                      [w - w * jitter(),     h - h * jitter()    ],
                      [w * jitter(),         h - h * jitter()    ]])
    M = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(img, M, (w, h),
                               flags=cv2.INTER_LINEAR,
                               borderMode=cv2.BORDER_REPLICATE)


# ---------------------------------------------------------------------------
# Composite augment
# ---------------------------------------------------------------------------

def augment(img):
    """Apply a randomised combination of augmentations."""
    img = random_brightness_contrast(img)          # always applied (mild)
    if random.random() < 0.60:
        img = random_rotation(img)
    if random.random() < 0.50:
        img = random_gaussian_noise(img)
    if random.random() < 0.50:
        img = random_blur(img)
    if random.random() < 0.40:
        img = random_perspective(img)
    return img


# ---------------------------------------------------------------------------
# Main routine
# ---------------------------------------------------------------------------

def augment_dataset(labels_file: str, output_file: str, n_augments: int) -> None:
    labels_path = Path(labels_file)
    if not labels_path.is_file():
        sys.exit(f"[ERROR] Labels file not found: {labels_path}")

    # Relative paths in the labels file are resolved against the labels file's
    # parent directory (the dataset root), not the current working directory.
    dataset_root = labels_path.resolve().parent

    with open(labels_path, 'r', encoding='utf-8') as f:
        lines = [l.strip() for l in f if l.strip()]

    print(f"[INFO] {len(lines)} entries in {labels_path}")
    print(f"[INFO] Dataset root  : {dataset_root}")
    print(f"[INFO] Generating {n_augments} augment(s) per image  "
          f"→ up to {len(lines) * n_augments} new images\n")

    # new_lines starts empty — we write resolved absolute paths for every entry
    # (both originals and augmented) so the output file is consistent.
    new_lines = []
    missing   = 0
    done      = 0

    for idx, line in enumerate(lines, 1):
        if '\t' not in line:
            continue

        img_path_str, text = line.split('\t', 1)
        img_path = Path(img_path_str)

        # Resolve relative paths against the dataset root
        if not img_path.is_absolute():
            img_path = dataset_root / img_path

        if not img_path.is_file():
            missing += 1
            continue

        img = cv2.imread(str(img_path))
        if img is None:
            missing += 1
            continue

        # Write original entry as-is (already in train/filename.jpg relative format)
        new_lines.append(line)

        stem   = img_path.stem
        suffix = img_path.suffix
        parent = img_path.parent

        for j in range(n_augments):
            aug_name = f"{stem}_aug{j:03d}{suffix}"
            aug_path = parent / aug_name
            aug_img  = augment(img.copy())
            cv2.imwrite(str(aug_path), aug_img)
            # Write as relative path (same format as originals: train/filename.jpg)
            rel_path = aug_path.relative_to(dataset_root).as_posix()
            new_lines.append(f"{rel_path}\t{text}")

        done += 1
        if idx % 200 == 0:
            print(f"  {idx}/{len(lines)} processed...")

    output_path = Path(output_file)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

    print(f"\n[DONE]")
    print(f"  Images processed : {done}")
    print(f"  Images skipped   : {missing} (missing or unreadable)")
    print(f"  New aug images   : {done * n_augments}")
    print(f"  Total entries    : {len(new_lines)}")
    print(f"  Output written   : {output_path}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Offline augmentation for PaddleOCR training data')
    parser.add_argument('--labels',  required=True,
                        help='Input labels file  (tab-separated: path<TAB>text)')
    parser.add_argument('--output',  required=True,
                        help='Output labels file (original + augmented entries)')
    parser.add_argument('--n',       type=int, default=5,
                        help='Number of augmented variants per image (default: 5)')
    args = parser.parse_args()

    augment_dataset(args.labels, args.output, args.n)
