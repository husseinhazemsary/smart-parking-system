import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Model
VEHICLE_MODEL = "yolov8m-seg.pt"
VEHICLE_CLASSES = [2, 3, 5, 7]  # car, motorcycle, bus, truck
DETECTION_CONF = 0.3

# Calibration: shrink detected car bbox to better approximate slot boundary
# 1.0 = no shrink, 0.85 = shrink to 85% of car bbox size
SHRINK_FACTOR = 0.85

# Video processing
FRAME_SKIP = 5        # process every Nth frame
MIN_COVERAGE = 0.4    # fraction of slot bbox that must be covered to count as occupied

# Temporal smoothing (prevents flickering)
CONFIRM_SECONDS = 2.0   # car must stay this long to mark slot as occupied
RELEASE_SECONDS = 1.5   # slot must be clear this long to mark it as free

# Paths
SLOTS_DIR        = os.path.join(BASE_DIR, "data", "slots")
DEBUG_DIR        = os.path.join(BASE_DIR, "output", "debug")
OUTPUT_VIDEOS_DIR = os.path.join(BASE_DIR, "output", "videos")

# Visualization colors (BGR)
COLOR_OCCUPIED = (0, 0, 255)
COLOR_FREE     = (0, 255, 0)
