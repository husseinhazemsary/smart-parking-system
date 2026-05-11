"""
Maps detected vehicles to parking slots and determines occupancy status
Calculates IoU between vehicle bounding boxes and slot polygons
Handles different slot types (regular, disabled, EV)
"""

from utils.geometry import calculate_iou, get_polygon_center
from config.settings import IOU_THRESHOLD


class SlotMapper:
    """
    Manages mapping between detected vehicles and parking slot polygons
    Determines which slots are occupied based on vehicle positions
    """
    
    def __init__(self, slots):
        """
        Initialize with parking slot definitions
        slots: list of dicts with 'id', 'polygon', 'type' keys
        """
        self.slots = slots
        self.iou_threshold = IOU_THRESHOLD
        
    def map_vehicles_to_slots(self, detections):
        """
        Match detected vehicles to parking slots using IoU
        Returns dict mapping slot_id to occupancy status
        """
        slot_states = {}
        
        # Initialize all slots as available
        for slot in self.slots:
            slot_states[slot['id']] = {
                'occupied': False,
                'vehicle_type': None,
                'confidence': 0.0,
                'polygon': slot['polygon'],
                'type': slot.get('type', 'regular'),
                'zone': slot.get('zone', 'N/A')
            }
        
        # Check each detection against each slot
        for detection in detections:
            bbox = detection['bbox']
            
            # Find best matching slot for this vehicle
            best_slot = None
            best_iou = 0.0
            
            for slot in self.slots:
                iou = calculate_iou(bbox, slot['polygon'])
                
                # Vehicle significantly overlaps with slot
                if iou > self.iou_threshold and iou > best_iou:
                    best_iou = iou
                    best_slot = slot
            
            # Mark the best matching slot as occupied
            if best_slot is not None:
                slot_states[best_slot['id']].update({
                    'occupied': True,
                    'vehicle_type': detection['class_name'],
                    'confidence': detection['confidence'],
                    'iou': best_iou
                })
        
        return slot_states
    
    def update_slots(self, new_slots):
        """
        Update slot definitions (useful for recalibration)
        """
        self.slots = new_slots