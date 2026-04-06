"""
Configuration settings for the parking detection system
Contains all adjustable parameters for detection, visualization, and processing
"""

import os

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')
BLUEPRINT_DIR = os.path.join(DATA_DIR, 'blueprints')
LAYOUT_DIR = os.path.join(DATA_DIR, 'layouts')
VIDEO_DIR = os.path.join(DATA_DIR, 'videos')

# Create directories if they don't exist
for directory in [DATA_DIR, OUTPUT_DIR, BLUEPRINT_DIR, LAYOUT_DIR, VIDEO_DIR, 
                  os.path.join(OUTPUT_DIR, 'processed_videos')]:
    os.makedirs(directory, exist_ok=True)

# Detection settings
DETECTION_CONFIDENCE = 0.5
IOU_THRESHOLD = 0.35
FRAME_SKIP = 10  # Process every 10th frame (faster)
STABILITY_FRAMES = 3

# Testing mode
TEST_MODE = False
TEST_MAX_FRAMES = 300  # ~10 seconds at 30 FPS

# Output video settings - SPEED OPTIMIZATIONS
OUTPUT_FPS = 10  # Lower FPS = faster encoding
WRITE_ONLY_PROCESSED = True  # Only write processed frames (much faster)

# Resolution optimization
RESIZE_FRAME = False  # Set to True for 4x speed boost (lower quality)
RESIZE_WIDTH = 960  # Half resolution

# Vehicle classes from YOLO COCO dataset
VEHICLE_CLASSES = [2, 3, 5, 7]

# Visualization colors (BGR format)
COLOR_AVAILABLE = (0, 255, 0)
COLOR_OCCUPIED = (0, 0, 255)
COLOR_DISABLED = (255, 0, 255)
COLOR_EV = (255, 255, 0)
COLOR_TEXT = (255, 255, 255)
COLOR_BORDER = (0, 255, 255)

# Visualization settings
SLOT_ALPHA = 0.5
TEXT_SCALE = 0.7
TEXT_THICKNESS = 2
LINE_THICKNESS = 3

# Model settings
YOLO_MODEL = 'yolov8n.pt'
USE_GPU = True