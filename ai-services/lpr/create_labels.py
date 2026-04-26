import os
dataset = "../lpr-dataset/Egyptian License Plate Dataset.v1i.coco"
with open(f"{dataset}/test_labels.txt", encoding="utf-8") as f, open("test_labels.csv", "w", encoding="utf-8") as out:
    for line in f:
        path, label = line.strip().split("\t")
        full_path = os.path.abspath(f"{dataset}/{path}")
        out.write(f"{full_path},{label}\n")
