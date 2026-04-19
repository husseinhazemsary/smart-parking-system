# generate_test_csv.py
# Converts test_labels.txt into test_labels.csv for evaluate_finetuned.py

import os
import csv

DATASET_DIR = os.path.join("..", "lpr-dataset", "Egyptian License Plate Dataset.v1i.coco")
LABELS_FILE = os.path.join(DATASET_DIR, "test_labels.txt")
OUTPUT_CSV  = "test_labels.csv"

rows = []
missing = []

with open(LABELS_FILE, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        parts = line.split("\t")
        if len(parts) != 2:
            continue
        rel_path, gt = parts[0].strip(), parts[1].strip()
        abs_path = os.path.normpath(os.path.join(DATASET_DIR, rel_path))

        if not os.path.exists(abs_path):
            missing.append(abs_path)
            continue

        rows.append([abs_path, gt])

with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"Written {len(rows)} rows to {OUTPUT_CSV}")
if missing:
    print(f"Skipped {len(missing)} entries (image not found):")
    for p in missing[:5]:
        print(f"  {p}")
    if len(missing) > 5:
        print(f"  ... and {len(missing) - 5} more")
