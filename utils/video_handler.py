"""
Video input/output handling utilities
Manages video capture, frame extraction, and video writing operations
"""

import cv2
import os


class VideoHandler:
    """
    Handles video file operations including reading frames and writing output
    """
    
    def __init__(self, video_path):
        """Initialize video capture from file path"""
        self.video_path = video_path
        self.cap = cv2.VideoCapture(video_path)
        
        if not self.cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")
        
        # Get video properties
        self.fps = int(self.cap.get(cv2.CAP_PROP_FPS))
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
    def read_frame(self):
        """Read next frame from video"""
        ret, frame = self.cap.read()
        return ret, frame
    
    def get_frame_at(self, frame_number):
        """Jump to specific frame and read it"""
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        return self.read_frame()
    
    def release(self):
        """Release video capture resources"""
        self.cap.release()
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.release()


class VideoWriter:
    """
    Handles writing processed frames to output video file
    """
    
    def __init__(self, output_path, fps, width, height):
        """Initialize video writer with output specifications"""
        self.output_path = output_path
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Define codec and create VideoWriter object
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        if not self.writer.isOpened():
            raise ValueError(f"Could not create video writer: {output_path}")
    
    def write_frame(self, frame):
        """Write a single frame to output video"""
        self.writer.write(frame)
    
    def release(self):
        """Release video writer resources"""
        self.writer.release()
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.release()