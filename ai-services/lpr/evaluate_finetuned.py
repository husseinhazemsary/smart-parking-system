# evaluate_finetuned.py
import os, csv, re
import matplotlib.pyplot as plt
from Levenshtein import distance as edit_distance
from src.PlateReader import PlateReader

# CSV format: image_path, ground_truth
# e.g.:  plates/img1.jpg, د ج ب ٢٣٤٥
TEST_CSV = "test_labels.csv"

reader = PlateReader()

results = {"exact_match": 0, "total": 0, "cer_list": [], "conf_list": []}

with open(TEST_CSV) as f:
  for row in csv.reader(f):
      img_path, gt = row[0].strip(), row[1].strip()
      import cv2
      img = cv2.imread(img_path)
      pred, _, conf = reader.read_plate_with_boxes(img)
      pred = pred or ""

      results["total"] += 1
      results["conf_list"].append(conf)

      # Character Error Rate
      max_len = max(len(gt), len(pred), 1)
      cer = edit_distance(gt, pred) / max_len
      results["cer_list"].append(cer)

      if pred.strip() == gt.strip():
          results["exact_match"] += 1

exact_acc = results["exact_match"] / results["total"]
avg_cer   = sum(results["cer_list"]) / len(results["cer_list"])
avg_conf  = sum(results["conf_list"]) / len(results["conf_list"])

print(f"Exact Match Accuracy: {exact_acc:.2%}")
print(f"Avg Character Error Rate: {avg_cer:.4f}")
print(f"Avg OCR Confidence: {avg_conf:.4f}")

# Bar chart of summary metrics
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

axes[0].bar(["Exact Acc", "Avg Conf"], [exact_acc, avg_conf], color=["steelblue", "orange"])
axes[0].set_ylim(0, 1); axes[0].set_title("Summary Metrics")
axes[0].set_ylabel("Score")

axes[1].hist(results["cer_list"], bins=20, color="salmon", edgecolor="black")
axes[1].set_title("Character Error Rate Distribution")
axes[1].set_xlabel("CER"); axes[1].set_ylabel("# Plates")

plt.tight_layout()
plt.savefig("eval_results.png", dpi=150)
plt.show()