# plot_training.py — Parse PaddleOCR training log and plot smoothed training curves
import re
import numpy as np
import matplotlib.pyplot as plt

LOG_PATH = "train.log"   # path to your PaddleOCR training log file
SMOOTH_WINDOW = 15       # increase for a smoother line, decrease for more detail

# Synthetic starting point at epoch 1 (before fine-tuning logs begin)
EPOCH_START   = 1
ACC_START     = 0.0    # model starts with no accuracy
NED_START     = 0.0    # no edit distance similarity yet
LOSS_START    = 1.0    # high initial loss


def smooth(values, window):
    """Rolling average over `window` steps."""
    if len(values) < window:
        return values
    kernel = np.ones(window) / window
    return np.convolve(values, kernel, mode="valid")


epochs, acc, loss, ned = [], [], [], []

with open(LOG_PATH, encoding="utf-8") as f:
    for line in f:
        m = re.search(
            r"epoch.*?(\d+).*?acc[:\s]+([\d.]+).*?norm_edit_dis[:\s]+([\d.]+).*?loss[:\s]+([\d.]+)",
            line, re.IGNORECASE
        )
        if m:
            epochs.append(int(m.group(1)))
            acc.append(float(m.group(2)))
            ned.append(float(m.group(3)))
            loss.append(float(m.group(4)))

if not epochs:
    print("No training data found — check that LOG_PATH points to your train.log file.")
    exit(1)

print(f"Parsed {len(epochs)} log entries  |  epochs {epochs[0]}–{epochs[-1]}")
print(f"  Final loss:     {loss[-1]:.4f}   (started {loss[0]:.4f})")
print(f"  Final accuracy: {acc[-1]:.4f}   (started {acc[0]:.4f})")
print(f"  Final NED:      {ned[-1]:.4f}   (started {ned[0]:.4f})")

# Smooth the logged portion
s_loss = smooth(loss, SMOOTH_WINDOW)
s_acc  = smooth(acc,  SMOOTH_WINDOW)
s_ned  = smooth(ned,  SMOOTH_WINDOW)
x_raw    = epochs
x_smooth = epochs[SMOOTH_WINDOW - 1:]

fig, axes = plt.subplots(1, 3, figsize=(16, 4))
fig.suptitle("PaddleOCR Fine-Tuning — Training Curves (Epoch 1–300)", fontsize=13, fontweight="bold")

configs = [
    (axes[0], loss, s_loss, "Training Loss",            "Loss",     "red",   "darkred",   True,  LOSS_START),
    (axes[1], acc,  s_acc,  "Character Accuracy",       "Accuracy", "blue",  "darkblue",  False, ACC_START),
    (axes[2], ned,  s_ned,  "Normalized Edit Distance", "NED",      "green", "darkgreen", False, NED_START),
]

for ax, raw, smoothed, title, ylabel, raw_color, smooth_color, invert, start_val in configs:
    first_logged_epoch = epochs[0]
    first_logged_val   = raw[0]

    # Dashed line from epoch 1 (start_val) → first logged epoch (actual value)
    ax.plot([EPOCH_START, first_logged_epoch], [start_val, first_logged_val],
            color=smooth_color, linewidth=2.0, linestyle="--", label="Before logs (estimated)")

    # Raw noisy logged data
    ax.plot(x_raw, raw, color=raw_color, alpha=0.25, linewidth=0.8, label="Raw")

    # Smoothed logged data
    ax.plot(x_smooth, smoothed, color=smooth_color, linewidth=2.2, label=f"Smoothed (w={SMOOTH_WINDOW})")

    # Dot at epoch 1 to mark the starting point clearly
    ax.scatter([EPOCH_START], [start_val], color=smooth_color, zorder=5, s=40)

    ax.set_title(title, fontsize=11)
    ax.set_xlabel("Epoch")
    ax.set_ylabel(ylabel)
    ax.set_xlim(left=0)
    ax.legend(fontsize=8)
    ax.grid(True, alpha=0.3)
    if invert:
        ax.annotate("↓ better", xy=(0.98, 0.95), xycoords="axes fraction",
                    ha="right", fontsize=8, color="gray")
    else:
        ax.annotate("↑ better", xy=(0.98, 0.05), xycoords="axes fraction",
                    ha="right", fontsize=8, color="gray")

plt.tight_layout()
plt.savefig("training_curves.png", dpi=150, bbox_inches="tight")
print("\nSaved: training_curves.png")
plt.show()
