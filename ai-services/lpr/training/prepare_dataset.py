"""
Converts the Roboflow COCO JSON annotations (Egyptian License Plate dataset)
into PaddleOCR recognition training format.

Each image has per-character bounding box annotations.
This script:
  1. Groups character boxes by image
  2. Sorts them right-to-left (Arabic reading order)
  3. Maps class names to Arabic characters
  4. Writes a label file: image_path<TAB>plate_text

Usage:
    python prepare_dataset.py <path_to_dataset_root>

Example:
    python prepare_dataset.py C:/datasets/egyptian-license-plate

The dataset root should contain train/, valid/, test/ subfolders,
each with images and _annotations.coco.json.

Output: train_labels.txt, valid_labels.txt, test_labels.txt
        written into the dataset root folder.

---
Notes on the 79 classes in this dataset:
  The dataset was labeled by multiple people using three inconsistent schemes:
    1. Full transliterated Arabic names: ain, lam, meem, taa ...
    2. Single-letter Latin abbreviations: e, l, m, t ...
    3. Direct Arabic Unicode characters: ع, ل, م, ط ...
  All three refer to the same characters. This script maps all aliases
  to a single canonical Arabic character.
"""

import json
import os
import sys
from collections import defaultdict


# ---------------------------------------------------------------------------
# Character mapping: Roboflow class name → Arabic character
#
# Three naming schemes are unified here.
# Digits map to Arabic-Indic numerals as used on Egyptian plates.
# ---------------------------------------------------------------------------
CHAR_MAP = {
    # --- Digits ---
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',

    # --- Arabic-Indic digits (if annotated directly) ---
    '٠': '٠', '١': '١', '٢': '٢', '٣': '٣', '٤': '٤',
    '٥': '٥', '٦': '٦', '٧': '٧', '٨': '٨', '٩': '٩',

    # --- Arabic letters: full transliterated names ---
    'alf':  'أ',   
    'a':    'أ',   
    'aa':   'ع',   
    'ain':  'ع',   
    'aain': 'ع',   
    'baa':  'ب',
    'dal':  'د',
    'faa':  'ف',
    'geem': 'ج',
    'haa':  'ه',
    'kaf':  'ق',   
    'lam':  'ل',
    'meem': 'م',
    'non':  'ن',
    'raa':  'ر',
    'sad':  'ص',
    'sen':  'س',   
    'ss':   'ص',   
    'taa':  'ط',   
    'waaw': 'و',
    'yaa':  'ي',
    'zen':  'ز',

    # --- Arabic letters: single-letter Latin abbreviations ---
    'b': 'ب',
    'c': 'س',   
    'd': 'د',
    'e': 'ع',   
    'f': 'ف',
    'g': 'ج',
    'h': 'ه',   
    'k': 'ق',   
    'l': 'ل',
    'm': 'م',
    'n': 'ن',
    'r': 'ر',
    's': 'ص',   
    't': 'ط',   
    'w': 'و',
    'y': 'ي',

    # --- Direct Arabic Unicode class names ---
    'ا': 'ا', 'أ': 'أ', 'إ': 'إ', 'آ': 'آ',
    'ب': 'ب', 'ت': 'ت', 'ث': 'ث',
    'ج': 'ج', 'ح': 'ح', 'خ': 'خ',
    'د': 'د', 'ذ': 'ذ', 'ر': 'ر', 'ز': 'ز',
    'س': 'س', 'ش': 'ش', 'ص': 'ص', 'ض': 'ض',
    'ط': 'ط', 'ظ': 'ظ', 'ع': 'ع', 'غ': 'غ',
    'ف': 'ف', 'ق': 'ق', 'ك': 'ك', 'ل': 'ل',
    'م': 'م', 'ن': 'ن', 'ه': 'ه', 'و': 'و',
    'ي': 'ي', 'ى': 'ى',

    # --- Separators and plate-level bounding box: skip ---
    '-':                     None,
    '--':                    None,
    '\\':                    None,
    '.':                     None,
    'Egyptian-License-Plate': None,
}


def convert_split(split_dir, output_label_path):
    annotations_path = os.path.join(split_dir, '_annotations.coco.json')

    if not os.path.exists(annotations_path):
        print(f"[SKIP] No annotations file found in {split_dir}")
        return

    with open(annotations_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # category_id → Arabic character (None = skip)
    cat_map = {}
    unknown_classes = set()
    for cat in data['categories']:
        name = cat['name']
        if name in CHAR_MAP:
            cat_map[cat['id']] = CHAR_MAP[name]
        else:
            cat_map[cat['id']] = None
            unknown_classes.add(name)

    if unknown_classes:
        print(f"  [WARNING] Unknown class names (skipped): {sorted(unknown_classes)}")

    # Group character annotations by image_id, storing (center_x, char)
    ann_by_image = defaultdict(list)
    for ann in data['annotations']:
        char = cat_map.get(ann['category_id'])
        if char is not None:
            x, y, w, h = ann['bbox']  # COCO: top-left x, y, width, height
            center_x = x + w / 2
            ann_by_image[ann['image_id']].append((center_x, char))

    # image_id → filename
    id_to_file = {img['id']: img['file_name'] for img in data['images']}

    # Build (image_path, text) pairs first, before consistency filtering
    candidates = []
    skipped = 0

    for image_id, chars in ann_by_image.items():
        if not chars:
            skipped += 1
            continue

        # Egyptian plates: letters on the right (RTL), digits on the left (LTR).
        # Applying a single RTL sort to everything reverses the digit group.
        # Fix: sort each group by its own reading direction, then concatenate.
        is_digit = lambda ch: '\u0660' <= ch <= '\u0669'
        letters = [(cx, ch) for cx, ch in chars if not is_digit(ch)]
        digits  = [(cx, ch) for cx, ch in chars if is_digit(ch)]

        letters.sort(key=lambda item: item[0], reverse=True)  # RTL
        digits.sort(key=lambda item: item[0])                  # LTR

        text = ''.join(ch for _, ch in letters) + ''.join(ch for _, ch in digits)

        # Skip partial crops (fewer than 4 characters — not a complete plate)
        if len(text) < 4:
            skipped += 1
            continue

        filename = id_to_file[image_id]
        split_name = os.path.basename(split_dir)
        image_path = f"{split_name}/{filename}"
        candidates.append((image_path, text, filename))

    # -----------------------------------------------------------------------
    # Consistency filter: group augmented versions of the same source image
    # and keep only those whose text matches the longest (most complete) text
    # in the group. This discards cropped augmentations that lost characters.
    #
    # Source image is identified by stripping the ".rf.<hash>" Roboflow suffix.
    # e.g. "00292_jpg.rf.2f83ef04...jpg" → source key "00292_jpg"
    # -----------------------------------------------------------------------
    from collections import defaultdict as _dd

    groups = _dd(list)  # source_key → [(image_path, text)]
    for image_path, text, filename in candidates:
        # filename looks like: 00292_jpg.rf.2f83ef04....jpg
        source_key = filename.split('.rf.')[0] if '.rf.' in filename else filename
        groups[source_key].append((image_path, text))

    labels = []
    consistency_skipped = 0
    for source_key, entries in groups.items():
        longest = max(len(text) for _, text in entries)
        for image_path, text in entries:
            if len(text) == longest:
                labels.append(f"{image_path}\t{text}")
            else:
                consistency_skipped += 1
                skipped += 1

    with open(output_label_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(labels))

    print(f"  [OK] {len(labels)} labels written ({skipped} images skipped)")
    if consistency_skipped:
        print(f"       {consistency_skipped} cropped augmentations removed (inconsistent text vs source image)")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python prepare_dataset.py <path_to_dataset_root>")
        print("Example: python prepare_dataset.py C:/datasets/egyptian-license-plate")
        sys.exit(1)

    dataset_root = sys.argv[1]

    if not os.path.isdir(dataset_root):
        print(f"[ERROR] Directory not found: {dataset_root}")
        sys.exit(1)

    print(f"[INFO] Dataset root: {dataset_root}\n")

    for split in ['train', 'valid', 'test']:
        split_dir = os.path.join(dataset_root, split)
        output_path = os.path.join(dataset_root, f'{split}_labels.txt')
        print(f"[{split.upper()}] Converting {split_dir}")
        convert_split(split_dir, output_path)

    print("\n[DONE] Label files ready.")
    print("       Review a few lines from train_labels.txt to verify the output.")
