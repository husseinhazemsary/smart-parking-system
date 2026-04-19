"""
Calibrates camera view to blueprint coordinates using homography
Allows operator to mark 4 corresponding points between camera view and blueprint
Calculates transformation matrix to map blueprint slots to camera perspective
"""

import cv2
import numpy as np
import json
import os
from utils.geometry import transform_polygon
from config.settings import LAYOUT_DIR


class CameraCalibrator:
    """
    Interactive tool for camera-to-blueprint calibration
    Computes homography matrix from 4-point correspondence
    """
    
    def __init__(self, camera_frame, blueprint_path, lot_id):
        """
        Initialize calibrator with camera frame and blueprint
        """
        self.camera_frame = camera_frame.copy()
        self.blueprint = cv2.imread(blueprint_path)
        
        if self.blueprint is None:
            raise ValueError(f"Could not load blueprint: {blueprint_path}")
        
        self.lot_id = lot_id
        
        # Points marked by user
        self.camera_points = []
        self.blueprint_points = []
        
        # Window names
        self.camera_window = "Camera View - Click 4 Corresponding Points"
        self.blueprint_window = "Blueprint - Click 4 Corresponding Points"
        
        # Load existing layout
        self.layout = self.load_layout()
        
    def load_layout(self):
        """
        Load previously defined slot layout from JSON
        """
        layout_path = os.path.join(LAYOUT_DIR, f"{self.lot_id}_layout.json")
        
        if not os.path.exists(layout_path):
            raise ValueError(f"Layout file not found: {layout_path}")
        
        with open(layout_path, 'r') as f:
            return json.load(f)
    
    def run(self):
        """
        Run interactive calibration process
        User clicks 4 matching points in both windows
        """
        print("\nCamera Calibration:")
        print("  1. Click 4 matching points in CAMERA view")
        print("  2. Then click same 4 points in BLUEPRINT view")
        print("  3. Press 'q' when done\n")
        print("Tip: Choose corners or distinctive features that are visible in both views")
        
        # Setup camera window
        cv2.namedWindow(self.camera_window)
        cv2.setMouseCallback(self.camera_window, self.camera_callback)
        
        # Setup blueprint window
        cv2.namedWindow(self.blueprint_window)
        cv2.setMouseCallback(self.blueprint_window, self.blueprint_callback)
        
        camera_display = self.camera_frame.copy()
        blueprint_display = self.blueprint.copy()
        
        while True:
            # Show images with marked points
            cv2.imshow(self.camera_window, camera_display)
            cv2.imshow(self.blueprint_window, blueprint_display)
            
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                if len(self.camera_points) == 4 and len(self.blueprint_points) == 4:
                    break
                else:
                    print(f"Need 4 points in each view. Currently have {len(self.camera_points)} camera points and {len(self.blueprint_points)} blueprint points")
            
            # Update displays
            camera_display = self.camera_frame.copy()
            blueprint_display = self.blueprint.copy()
            
            # Draw camera points
            for i, pt in enumerate(self.camera_points):
                cv2.circle(camera_display, pt, 8, (0, 255, 0), -1)
                cv2.putText(camera_display, str(i + 1), (pt[0] + 10, pt[1]), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            # Draw blueprint points
            for i, pt in enumerate(self.blueprint_points):
                cv2.circle(blueprint_display, pt, 8, (0, 255, 0), -1)
                cv2.putText(blueprint_display, str(i + 1), (pt[0] + 10, pt[1]), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        cv2.destroyAllWindows()
        
        # Calculate homography
        homography = self.calculate_homography()
        
        # Transform slots to camera view
        visible_slots = self.transform_slots(homography)
        
        # Save calibration
        self.save_calibration(homography, visible_slots)
        
        return visible_slots
    
    def camera_callback(self, event, x, y, flags, param):
        """
        Handle mouse clicks in camera view window
        """
        if event == cv2.EVENT_LBUTTONDOWN and len(self.camera_points) < 4:
            self.camera_points.append((x, y))
            print(f"Camera point {len(self.camera_points)}: ({x}, {y})")
    
    def blueprint_callback(self, event, x, y, flags, param):
        """
        Handle mouse clicks in blueprint window
        """
        if event == cv2.EVENT_LBUTTONDOWN and len(self.blueprint_points) < 4:
            self.blueprint_points.append((x, y))
            print(f"Blueprint point {len(self.blueprint_points)}: ({x}, {y})")
    
    def calculate_homography(self):
        """
        Calculate homography matrix from point correspondences
        Transforms blueprint coordinates to camera coordinates
        """
        src_pts = np.float32(self.blueprint_points)
        dst_pts = np.float32(self.camera_points)
        
        homography, status = cv2.findHomography(src_pts, dst_pts)
        
        print("\nHomography matrix calculated successfully")
        
        return homography
    
    def transform_slots(self, homography):
        """
        Transform all blueprint slots to camera perspective
        Filter out slots not visible in camera view
        """
        camera_height, camera_width = self.camera_frame.shape[:2]
        visible_slots = []
        
        for slot in self.layout['slots']:
            # Transform polygon from blueprint to camera coordinates
            camera_polygon = transform_polygon(slot['polygon'], homography)
            
            # Check if slot is within camera frame
            if self.is_in_frame(camera_polygon, camera_width, camera_height):
                visible_slots.append({
                    'id': slot['id'],
                    'polygon': camera_polygon,
                    'type': slot['type'],
                    'zone': slot['zone']
                })
        
        print(f"\nVisible slots in camera view: {len(visible_slots)} / {len(self.layout['slots'])}")
        
        return visible_slots
    
    def is_in_frame(self, polygon, width, height):
        """
        Check if any part of polygon is visible within frame boundaries
        """
        for point in polygon:
            x, y = point
            if 0 <= x <= width and 0 <= y <= height:
                return True
        return False
    
    def save_calibration(self, homography, visible_slots):
        """
        Save calibration data to JSON file
        """
        calibration_data = {
            'lot_id': self.lot_id,
            'homography_matrix': homography.tolist(),
            'camera_points': self.camera_points,
            'blueprint_points': self.blueprint_points,
            'visible_slots': visible_slots
        }
        
        output_path = os.path.join(LAYOUT_DIR, f"{self.lot_id}_camera_calibration.json")
        
        with open(output_path, 'w') as f:
            json.dump(calibration_data, f, indent=2)
        
        print(f"Calibration saved to: {output_path}")