"""
Vehicle detection using YOLOv8 model
Detects cars, motorcycles, buses, and trucks in video frames
Returns bounding boxes and confidence scores for detected vehicles
"""

from ultralytics import YOLO
import numpy as np
import torch
import warnings
from config.settings import YOLO_MODEL, VEHICLE_CLASSES, DETECTION_CONFIDENCE, USE_GPU


class VehicleDetector:
    """
    Wraps YOLOv8 model for vehicle detection in parking lot scenarios
    """
    
    def __init__(self):
        """Load YOLOv8 model and configure for vehicle detection"""
        print(f"Loading YOLO model: {YOLO_MODEL}")
        
        # Fix for PyTorch 2.6+ compatibility issue
        import ultralytics.nn.tasks as tasks
        original_torch_safe_load = tasks.torch_safe_load
        
        def patched_torch_safe_load(file, *args, **kwargs):
            """Patched version that uses weights_only=False for compatibility"""
            try:
                return torch.load(file, map_location='cpu', weights_only=False), file
            except Exception as e:
                warnings.warn(f"Error loading model: {e}")
                return original_torch_safe_load(file, *args, **kwargs)
        
        tasks.torch_safe_load = patched_torch_safe_load
        
        # Load YOLO model
        self.model = YOLO(YOLO_MODEL)
        
        # Check for GPU and use it if available
        if USE_GPU and torch.cuda.is_available():
            self.device = 'cuda'
            print(f"✓ Using GPU: {torch.cuda.get_device_name(0)}")
        else:
            self.device = 'cpu'
            print(f"✓ Using CPU (GPU not available - will be slower)")
        
        # Move model to device
        self.model.to(self.device)
        
        self.vehicle_classes = VEHICLE_CLASSES
        self.confidence_threshold = DETECTION_CONFIDENCE
        
        print(f"✓ Model loaded successfully")
        
    def detect(self, frame):
        """
        Run detection on a single frame
        Returns list of detected vehicles with bounding boxes and confidence scores
        """
        # Run inference on frame, filtering for vehicle classes only
        results = self.model(
            frame, 
            classes=self.vehicle_classes,
            conf=self.confidence_threshold,
            verbose=False,
            device=self.device  # Use GPU if available
        )[0]
        
        detections = []
        
        # Extract bounding boxes and metadata
        if results.boxes is not None:
            for box in results.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                
                detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'confidence': confidence,
                    'class_id': class_id,
                    'class_name': self.get_class_name(class_id)
                })
        
        return detections
    
    def get_class_name(self, class_id):
        """
        Convert YOLO class ID to human-readable name
        """
        class_names = {
            2: 'car',
            3: 'motorcycle',
            5: 'bus',
            7: 'truck'
        }
        return class_names.get(class_id, 'vehicle')