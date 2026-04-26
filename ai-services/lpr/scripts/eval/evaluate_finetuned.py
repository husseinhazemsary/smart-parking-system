# evaluate_finetuned.py
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import csv, re
import matplotlib.pyplot as plt
from Levenshtein import distance as edit_distance
from src.PlateReader import PlateReader
import cv2

TEST_CSV = "test_labels.csv"

reader = PlateReader()

results = {
    "exact_match": 0,
    "reversed_match": 0,
    "total": 0,
    "cer_list": [],
    "conf_list": [],
}

error_counts = {
    "empty":          0,
    "exact":          0,
    "reversed_exact": 0,
    "digit_error":    0,
    "multi_box":      0,
    "digits_only_gt": 0,
    "wrong":          0,
}

def normalize(text):
    """Strip spaces; used for direction-agnostic comparison."""
    return (text or "").replace(" ", "")

def classify_error(gt, pred_raw, pred_rev):
    if not pred_raw:
        return "empty"
    gt_norm = normalize(gt)
    # Digits-only GT
    if re.fullmatch(r"[٠-٩]+", gt_norm):
        return "digits_only_gt"
    if normalize(pred_raw) == gt_norm:
        return "exact"
    if pred_rev == gt_norm:
        return "reversed_exact"
    if " " in pred_raw.strip():
        return "multi_box"
    # Check for digit count mismatch
    gt_digits = re.sub(r"[^٠-٩]", "", gt_norm)
    pred_digits_rev = re.sub(r"[^٠-٩]", "", pred_rev)
    if gt_digits and pred_digits_rev and len(gt_digits) != len(pred_digits_rev):
        return "digit_error"
    return "wrong"

with open(TEST_CSV, encoding="utf-8") as f:
    for row in csv.reader(f):
        img_path, gt = row[0].strip(), row[1].strip()
        img = cv2.imread(img_path)
        pred_raw, _, conf = reader.read_plate_with_boxes(img)
        pred_raw = pred_raw or ""

        gt_norm   = normalize(gt)
        pred_norm = normalize(pred_raw)
        pred_rev  = pred_norm[::-1]

        # CER: use whichever direction is closer to GT
        cer_fwd = edit_distance(pred_norm, gt_norm) / max(len(gt_norm), len(pred_norm), 1)
        cer_rev = edit_distance(pred_rev,  gt_norm) / max(len(gt_norm), len(pred_rev),  1)
        cer = min(cer_fwd, cer_rev)

        results["total"] += 1
        results["conf_list"].append(conf)
        results["cer_list"].append(cer)

        exact    = pred_norm == gt_norm
        reversed_exact = pred_rev == gt_norm
        if exact:
            results["exact_match"] += 1
        if reversed_exact or exact:
            results["reversed_match"] += 1

        category = classify_error(gt, pred_raw, pred_rev)
        error_counts[category] += 1

        if exact:
            status = "[OK] "
        elif reversed_exact:
            status = "[REV]"
        else:
            status = "[X]  "
        print(f"{status}{os.path.basename(img_path):<50}  GT: {gt:<14}  Pred: {pred_raw:<20}  Rev: {pred_rev}")

exact_acc    = results["exact_match"]   / results["total"]
rev_acc      = results["reversed_match"] / results["total"]
avg_cer      = sum(results["cer_list"]) / len(results["cer_list"])
avg_conf     = sum(results["conf_list"]) / len(results["conf_list"])

print()
print("=" * 60)
print(f"Total images         : {results['total']}")
print(f"Exact Match Accuracy : {exact_acc:.2%}  (raw, no direction fix)")
print(f"Reversed Accuracy    : {rev_acc:.2%}  (model reads RTL correctly)")
print(f"Avg CER (best dir.)  : {avg_cer:.4f}")
print(f"Avg OCR Confidence   : {avg_conf:.4f}")
print()
print("Error breakdown:")
for k, v in error_counts.items():
    print(f"  {k:<20}: {v}")
print("=" * 60)

# Plots
fig, axes = plt.subplots(1, 3, figsize=(16, 4))

axes[0].bar(
    ["Exact\n(raw)", "Reversed\nAccuracy", "Avg Conf"],
    [exact_acc, rev_acc, avg_conf],
    color=["salmon", "steelblue", "orange"]
)
axes[0].set_ylim(0, 1)
axes[0].set_title("Summary Metrics")
axes[0].set_ylabel("Score")

axes[1].hist(results["cer_list"], bins=20, color="salmon", edgecolor="black")
axes[1].set_title("CER Distribution (best direction)")
axes[1].set_xlabel("CER")
axes[1].set_ylabel("# Plates")

labels = [k for k, v in error_counts.items() if v > 0]
sizes  = [v for v in error_counts.values() if v > 0]
axes[2].pie(sizes, labels=labels, autopct="%1.0f%%", startangle=140)
axes[2].set_title("Error Categories")

plt.tight_layout()
plt.savefig("eval_results.png", dpi=150)
plt.show()
