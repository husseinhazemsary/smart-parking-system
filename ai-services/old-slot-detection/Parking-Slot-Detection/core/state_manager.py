"""
Manages temporal state tracking for parking slots
Implements stability filtering to prevent flickering detections
Only changes slot state after consistent detections across multiple frames
"""

from collections import deque
from config.settings import STABILITY_FRAMES


class StateManager:
    """
    Tracks slot states over time and applies temporal filtering
    Prevents false positives from momentary detection errors
    """
    
    def __init__(self, stability_frames=STABILITY_FRAMES):
        """
        Initialize state tracking with configurable stability window
        stability_frames: number of consistent frames needed for state change
        """
        self.stability_frames = stability_frames
        self.current_states = {}  # Current confirmed states
        self.state_history = {}  # Recent detection history per slot
        self.frame_count = {}  # Count frames in current state
        
    def update_states(self, new_states):
        """
        Update states with new detections, applying temporal filtering
        Returns current stable states after filtering
        """
        for slot_id, new_state in new_states.items():
            # Initialize if this is a new slot
            if slot_id not in self.state_history:
                self.state_history[slot_id] = deque(maxlen=self.stability_frames)
                self.current_states[slot_id] = new_state.copy()
                self.frame_count[slot_id] = 0
            
            # Add new detection to history
            self.state_history[slot_id].append(new_state['occupied'])
            
            # Only evaluate if we have enough history
            if len(self.state_history[slot_id]) >= self.stability_frames:
                # Calculate how many recent frames say "occupied"
                recent_states = list(self.state_history[slot_id])
                occupied_votes = sum(recent_states)
                
                # Determine consensus (majority rule)
                consensus_occupied = occupied_votes > (self.stability_frames / 2)
                
                # Check if state should change
                current_occupied = self.current_states[slot_id]['occupied']
                
                if consensus_occupied != current_occupied:
                    # State wants to change - count consecutive frames
                    self.frame_count[slot_id] += 1
                    
                    # Only change after seeing consistent new state
                    if self.frame_count[slot_id] >= self.stability_frames:
                        # Change state
                        self.current_states[slot_id] = new_state.copy()
                        self.current_states[slot_id]['occupied'] = consensus_occupied
                        self.frame_count[slot_id] = 0
                else:
                    # State is stable, reset counter
                    self.frame_count[slot_id] = 0
                    
                    # Update metadata for occupied slots (vehicle type, confidence)
                    if consensus_occupied and new_state['occupied']:
                        self.current_states[slot_id].update({
                            'vehicle_type': new_state.get('vehicle_type'),
                            'confidence': new_state.get('confidence', 0.0)
                        })
        
        return self.current_states
    
    def get_current_states(self):
        """
        Get current confirmed states for all slots
        """
        return self.current_states
    
    def reset(self):
        """
        Clear all state history (useful for new video or recalibration)
        """
        self.current_states = {}
        self.state_history = {}
        self.frame_count = {}