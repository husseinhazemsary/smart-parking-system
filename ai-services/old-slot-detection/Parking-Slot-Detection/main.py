"""
Main entry point for parking slot detection system
Orchestrates video processing, vehicle detection, and slot occupancy tracking
Outputs annotated video showing real-time parking availability
"""

import cv2
import os
import json
from core.vehicle_detector import VehicleDetector
from core.slot_mapper import SlotMapper
from core.state_manager import StateManager
from utils.video_handler import VideoHandler, VideoWriter
from calibration.blueprint_drawer import BlueprintDrawer
from calibration.camera_calibrator import CameraCalibrator
from config.settings import (
    FRAME_SKIP, COLOR_AVAILABLE, COLOR_OCCUPIED, COLOR_DISABLED, 
    COLOR_EV, SLOT_ALPHA, TEXT_SCALE, TEXT_THICKNESS, LINE_THICKNESS,
    VIDEO_DIR, OUTPUT_DIR, LAYOUT_DIR
)
import numpy as np


class ParkingDetectionSystem:
    """
    Main system class that coordinates all components
    Processes video input and generates annotated output
    """
    
    def __init__(self, video_path, lot_id, calibration_file=None):
        """
        Initialize detection system
        video_path: path to input video file
        lot_id: parking lot identifier
        calibration_file: optional path to existing calibration JSON
        """
        self.video_path = video_path
        self.lot_id = lot_id
        
        # Initialize components
        self.detector = VehicleDetector()
        self.state_manager = StateManager()
        
        # Load or create slot configuration
        if calibration_file and os.path.exists(calibration_file):
            self.slots = self.load_calibration(calibration_file)
        else:
            raise ValueError("Calibration file required. Run calibration first.")
        
        self.slot_mapper = SlotMapper(self.slots)
        
        # Statistics tracking
        self.frame_count = 0
        self.processed_frames = 0
        
    def load_calibration(self, calibration_file):
        """
        Load slot definitions from calibration JSON
        Handles both manual calibration and auto-detected slots
        """
        with open(calibration_file, 'r') as f:
            calibration = json.load(f)
        
        # Check if this is auto-detected slots or manual calibration
        if 'visible_slots' in calibration:
            # Manual calibration format
            slots = calibration['visible_slots']
        elif 'slots' in calibration:
            # Auto-detected format
            slots = calibration['slots']
        else:
            raise ValueError("Invalid calibration file format")
        
        print(f"Loaded calibration for {len(slots)} slots")
        return slots
    
    def visualize_frame(self, frame, slot_states):
        """
        Draw slot overlays and status information on frame
        """
        overlay = frame.copy()
        
        # Draw each slot with appropriate color
        for slot_id, state in slot_states.items():
            polygon = np.array(state['polygon'], dtype=np.int32)
            
            # Choose color based on slot type and occupancy
            if state['occupied']:
                color = COLOR_OCCUPIED
            elif state['type'] == 'disabled':
                color = COLOR_DISABLED
            elif state['type'] == 'ev':
                color = COLOR_EV
            else:
                color = COLOR_AVAILABLE
            
            # Draw filled polygon on overlay
            cv2.fillPoly(overlay, [polygon], color)
            
            # Draw thicker black border for contrast
            cv2.polylines(frame, [polygon], True, (0, 0, 0), LINE_THICKNESS + 2)
            
            # Draw colored polygon outline on top
            cv2.polylines(frame, [polygon], True, color, LINE_THICKNESS)
            
            # Add slot ID label with background
            center_x = int(np.mean([p[0] for p in state['polygon']]))
            center_y = int(np.mean([p[1] for p in state['polygon']]))
            
            label = f"{state['zone']}"
            if state['occupied']:
                label += f" ({state['vehicle_type']})"
            
            # Get text size for background rectangle
            (text_width, text_height), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, TEXT_SCALE, TEXT_THICKNESS
            )
            
            # Draw black background for text
            cv2.rectangle(
                frame,
                (center_x - text_width // 2 - 5, center_y - text_height - 5),
                (center_x + text_width // 2 + 5, center_y + 5),
                (0, 0, 0),
                -1
            )
            
            # Draw text on top
            cv2.putText(
                frame, 
                label, 
                (center_x - text_width // 2, center_y),
                cv2.FONT_HERSHEY_SIMPLEX, 
                TEXT_SCALE, 
                (255, 255, 255),
                TEXT_THICKNESS
            )
        
        # Blend overlay with original frame
        frame = cv2.addWeighted(overlay, SLOT_ALPHA, frame, 1 - SLOT_ALPHA, 0)
        
        # Add statistics panel
        frame = self.add_statistics_panel(frame, slot_states)
        
        return frame
    
    def add_statistics_panel(self, frame, slot_states):
        """
        Add information panel showing availability statistics
        """
        total = len(slot_states)
        occupied = sum(1 for s in slot_states.values() if s['occupied'])
        available = total - occupied
        
        # Create semi-transparent panel background
        panel_height = 120
        panel = np.zeros((panel_height, frame.shape[1], 3), dtype=np.uint8)
        panel[:] = (50, 50, 50)
        
        # Add text to panel
        y_offset = 30
        cv2.putText(panel, f"Total Slots: {total}", (20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        y_offset += 30
        cv2.putText(panel, f"Available: {available}", (20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, COLOR_AVAILABLE, 2)
        
        y_offset += 30
        cv2.putText(panel, f"Occupied: {occupied}", (20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, COLOR_OCCUPIED, 2)
        
        # Blend panel with frame
        frame[0:panel_height, :] = cv2.addWeighted(
            panel, 0.7, 
            frame[0:panel_height, :], 0.3, 
            0
        )
        
        return frame
    
    def process_video(self):
        """
        Main processing loop - reads video, detects vehicles, updates states
        Optimized for speed with reduced output framerate
        """
        print(f"\nProcessing video: {self.video_path}")
        
        # Import progress bar
        try:
            from tqdm import tqdm
            use_progress = True
        except ImportError:
            use_progress = False
            print("Install tqdm for progress bar: pip install tqdm")
        
        with VideoHandler(self.video_path) as video:
            output_path = os.path.join(
                OUTPUT_DIR, 
                'processed_videos',
                f"{self.lot_id}_processed.mp4"
            )
            
            # Determine how many frames to process
            from config.settings import TEST_MODE, TEST_MAX_FRAMES, OUTPUT_FPS, WRITE_ONLY_PROCESSED
            
            if TEST_MODE:
                total_frames = min(video.total_frames, TEST_MAX_FRAMES)
                print(f"\n⚠ TEST MODE: Processing only first {total_frames} frames")
                print(f"   (Set TEST_MODE = False in config/settings.py for full video)")
            else:
                total_frames = video.total_frames
            
            # Use lower FPS for output video (faster encoding)
            output_fps = OUTPUT_FPS if 'OUTPUT_FPS' in dir() else video.fps
            
            with VideoWriter(output_path, output_fps, video.width, video.height) as writer:
                print(f"Output will be saved to: {output_path}")
                print(f"Input: {total_frames} frames at {video.fps} FPS")
                print(f"Output: ~{total_frames // FRAME_SKIP} frames at {output_fps} FPS")
                print(f"Processing every {FRAME_SKIP} frame(s)")
                
                # Estimate processing time
                frames_to_process = total_frames // FRAME_SKIP
                estimated_seconds = frames_to_process * 0.15  # ~150ms per frame on CPU
                print(f"Estimated time: {estimated_seconds:.1f} seconds\n")
                
                # Create progress bar
                if use_progress:
                    pbar = tqdm(total=total_frames, desc="Processing", unit="frames")
                
                # Keep track of last stable states
                last_stable_states = None
        
                while self.frame_count < total_frames:
                    ret, frame = video.read_frame()
                    
                    if not ret:
                        break
                    
                    self.frame_count += 1
                    
                    # Process only every Nth frame for efficiency
                    if self.frame_count % FRAME_SKIP == 0:
                        self.processed_frames += 1
                        
                        # Resize frame for faster detection (if enabled)
                        from config.settings import RESIZE_FRAME, RESIZE_WIDTH
                        
                        if RESIZE_FRAME:
                            height, width = frame.shape[:2]
                            scale = RESIZE_WIDTH / width
                            resized = cv2.resize(frame, (RESIZE_WIDTH, int(height * scale)))
                            detections = self.detector.detect(resized)
                            # Scale bounding boxes back to original size
                            for det in detections:
                                det['bbox'] = [x / scale for x in det['bbox']]
                        else:
                            detections = self.detector.detect(frame)
                        
                        # Map vehicles to parking slots
                        slot_states = self.slot_mapper.map_vehicles_to_slots(detections)
                        
                        # Apply temporal filtering for stability
                        stable_states = self.state_manager.update_states(slot_states)
                        
                        # Update last stable states
                        last_stable_states = stable_states
                        
                        # Visualize results
                        annotated_frame = self.visualize_frame(frame, stable_states)
                        
                        # Write to output video
                        writer.write_frame(annotated_frame)
                        
                    else:
                        # For skipped frames - two strategies
                        if WRITE_ONLY_PROCESSED:
                            # FAST: Don't write intermediate frames at all
                            # Output video will be lower FPS but encoding is much faster
                            pass
                        else:
                            # SMOOTH: Write all frames with last known state
                            # Slower but smoother playback
                            if last_stable_states is not None:
                                annotated_frame = self.visualize_frame(frame, last_stable_states)
                                writer.write_frame(annotated_frame)
                            else:
                                writer.write_frame(frame)
                    
                    # Update progress bar
                    if use_progress:
                        pbar.update(1)
                
                if use_progress:
                    pbar.close()
            
            print(f"\n✓ Processing complete!")
            print(f"✓ Processed {self.processed_frames} detection frames")
            print(f"✓ Output saved to: {output_path}")
            
            # Calculate actual speed
            if self.processed_frames > 0:
                processing_fps = self.processed_frames / (self.frame_count / video.fps)
                print(f"✓ Processing speed: {processing_fps:.1f} FPS")


def run_calibration(blueprint_path, video_path, lot_id):
    """
    Run full calibration workflow: blueprint drawing + camera calibration
    """
    print("\n" + "="*60)
    print("PARKING LOT CALIBRATION WORKFLOW")
    print("="*60)
    
    # Step 1: Draw slots on blueprint
    print("\nStep 1: Drawing parking slots on blueprint")
    drawer = BlueprintDrawer(blueprint_path, lot_id)
    slots = drawer.run()
    
    if len(slots) == 0:
        print("No slots defined. Exiting.")
        return None
    
    # Step 2: Calibrate camera view
    print("\nStep 2: Calibrating camera to blueprint")
    
    # Get first frame from video for calibration
    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        print("Could not read video for calibration")
        return None
    
    calibrator = CameraCalibrator(frame, blueprint_path, lot_id)
    visible_slots = calibrator.run()
    
    calibration_file = os.path.join(LAYOUT_DIR, f"{lot_id}_camera_calibration.json")
    print(f"\nCalibration complete! File saved: {calibration_file}")
    
    return calibration_file


def main():
    """
    Main entry point with user menu
    """
    print("\n" + "="*60)
    print("SMART PARKING SLOT DETECTION SYSTEM")
    print("="*60)
    
    print("\nSelect mode:")
    print("1. Auto-detect slots from empty lot image (RECOMMENDED)")
    print("2. Manual calibration (draw slots on blueprint)")
    print("3. Process video with existing calibration")
    
    choice = input("\nEnter choice (1, 2, or 3): ").strip()
    
    if choice == '1':
        # Auto-detection mode
        from auto_calibrate import auto_calibrate
        
        lot_id = input("Enter parking lot ID: ").strip()
        empty_lot_image = input("Enter path to empty parking lot image: ").strip()
        
        if not os.path.exists(empty_lot_image):
            print(f"Image not found: {empty_lot_image}")
            return
        
        config_path = auto_calibrate(empty_lot_image, lot_id)
        
        if config_path:
            print("\nAuto-detection successful!")
            video_path = input("Enter path to video for processing: ").strip()
            
            if os.path.exists(video_path):
                # Load auto-detected slots
                import json
                with open(config_path, 'r') as f:
                    config = json.load(f)
                
                # Create a simplified system that uses detected slots directly
                system = ParkingDetectionSystem(video_path, lot_id, config_path)
                system.process_video()
    
    elif choice == '2':
        # Manual calibration mode (your existing code)
        lot_id = input("Enter parking lot ID: ").strip()
        blueprint_path = input("Enter path to blueprint image: ").strip()
        video_path = input("Enter path to sample video: ").strip()
        
        # ... existing calibration code ...
    
    elif choice == '3':
        # Processing mode (your existing code)
        lot_id = input("Enter parking lot ID: ").strip()
        video_path = input("Enter path to video: ").strip()
        
        # Try auto-detected slots first
        auto_config = os.path.join(LAYOUT_DIR, f"{lot_id}_auto_slots.json")
        manual_config = os.path.join(LAYOUT_DIR, f"{lot_id}_camera_calibration.json")
        
        if os.path.exists(auto_config):
            calibration_file = auto_config
            print(f"Using auto-detected slots: {auto_config}")
        elif os.path.exists(manual_config):
            calibration_file = manual_config
            print(f"Using manual calibration: {manual_config}")
        else:
            print(f"No calibration found for lot ID: {lot_id}")
            print("Please run calibration first (option 1 or 2)")
            return
        
        if not os.path.exists(video_path):
            print(f"Video not found: {video_path}")
            return
        
        system = ParkingDetectionSystem(video_path, lot_id, calibration_file)
        system.process_video()
    
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()