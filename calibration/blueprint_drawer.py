"""
Interactive tool for drawing parking slot polygons on a blueprint image
Fast batch drawing: draw all slots continuously, edit metadata later
All slots default to 'regular' type, batch zone assignment supported
"""

import cv2
import json
import os
from config.settings import BLUEPRINT_DIR, LAYOUT_DIR


class BlueprintDrawer:
    """
    Interactive GUI for defining parking slots on blueprint image
    Click to add polygon corners, right-click to finish polygon
    Press 'z' to set zone for selected slots, 'q' to quit and save
    """
    
    def __init__(self, blueprint_path, lot_id):
        """
        Initialize drawer with blueprint image
        blueprint_path: path to parking lot top-down image
        lot_id: unique identifier for this parking lot
        """
        self.blueprint_path = blueprint_path
        self.lot_id = lot_id
        self.blueprint = cv2.imread(blueprint_path)
        
        if self.blueprint is None:
            raise ValueError(f"Could not load blueprint: {blueprint_path}")
        
        self.original = self.blueprint.copy()
        self.current_polygon = []
        self.slots = []
        self.selected_slots = []  # For batch editing
        self.current_zone = "A"  # Default zone
        self.zone_counter = 1  # Auto-incrementing counter
        
        # Window setup
        self.window_name = "Blueprint Slot Drawer - Fast Mode"
        cv2.namedWindow(self.window_name)
        cv2.setMouseCallback(self.window_name, self.mouse_callback)
        
    def mouse_callback(self, event, x, y, flags, param):
        """
        Handle mouse clicks for polygon drawing
        Left click: add corner point
        Right click: finish current polygon and save as slot
        """
        if event == cv2.EVENT_LBUTTONDOWN:
            # Add point to current polygon
            self.current_polygon.append([x, y])
            
            # Draw point
            cv2.circle(self.blueprint, (x, y), 5, (0, 255, 0), -1)
            
            # Draw line from previous point if exists
            if len(self.current_polygon) > 1:
                pt1 = tuple(self.current_polygon[-2])
                pt2 = tuple(self.current_polygon[-1])
                cv2.line(self.blueprint, pt1, pt2, (0, 255, 0), 2)
            
            cv2.imshow(self.window_name, self.blueprint)
            
        elif event == cv2.EVENT_RBUTTONDOWN:
            # Right click finishes polygon and auto-saves
            if len(self.current_polygon) >= 3:
                self.save_current_polygon()
    
    def save_current_polygon(self):
        """
        Auto-save current polygon with default values
        All slots default to 'regular' type, auto-assigned zone
        """
        slot_id = f"slot_{len(self.slots) + 1}"
        
        # Auto-assign zone with counter (A1, A2, A3, ... A10, B1, B2...)
        zone = f"{self.current_zone}{self.zone_counter}"
        
        self.slots.append({
            'id': slot_id,
            'polygon': self.current_polygon.copy(),
            'type': 'regular',  # Default type
            'zone': zone
        })
        
        print(f"✓ Saved {slot_id} → Zone {zone} (Total: {len(self.slots)})")
        
        # Close polygon visually
        if len(self.current_polygon) > 2:
            pt1 = tuple(self.current_polygon[-1])
            pt2 = tuple(self.current_polygon[0])
            cv2.line(self.blueprint, pt1, pt2, (0, 200, 0), 2)
            
            # Add zone label at center
            center_x = int(sum(p[0] for p in self.current_polygon) / len(self.current_polygon))
            center_y = int(sum(p[1] for p in self.current_polygon) / len(self.current_polygon))
            cv2.putText(self.blueprint, zone, (center_x - 15, center_y),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        # Reset for next polygon
        self.current_polygon = []
        cv2.imshow(self.window_name, self.blueprint)
    
    def run(self):
        """
        Main drawing loop with fast workflow
        
        Left click: Add corner point
        Right click: Finish and auto-save polygon
        'z': Change zone letter (A→B→C...)
        'n': Increment zone number (A1→A2→A3...)
        'r': Reset zone counter to 1
        't': Mark last N slots as special type
        'c': Clear current polygon (before finishing)
        'u': Undo last saved slot
        'q': Quit and save all slots
        """
        print("\n" + "="*60)
        print("FAST SLOT DRAWING MODE")
        print("="*60)
        print("\nControls:")
        print("  LEFT CLICK    - Add polygon corner")
        print("  RIGHT CLICK   - Finish polygon (auto-saves)")
        print("  'z'           - Next zone letter (A→B→C...)")
        print("  'n'           - Next zone number (1→2→3...)")
        print("  'r'           - Reset counter to 1")
        print("  't'           - Mark last slots as disabled/ev/compact")
        print("  'c'           - Clear current polygon")
        print("  'u'           - Undo last slot")
        print("  'q'           - Save and quit")
        print(f"\nCurrent zone: {self.current_zone}{self.zone_counter}")
        print("="*60 + "\n")
        
        while True:
            cv2.imshow(self.window_name, self.blueprint)
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('z'):
                # Move to next zone letter
                if self.current_zone == 'Z':
                    self.current_zone = 'A'
                else:
                    self.current_zone = chr(ord(self.current_zone) + 1)
                self.zone_counter = 1
                print(f"→ Zone changed to: {self.current_zone}{self.zone_counter}")
                
            elif key == ord('n'):
                # Increment zone number
                self.zone_counter += 1
                print(f"→ Zone changed to: {self.current_zone}{self.zone_counter}")
                
            elif key == ord('r'):
                # Reset counter
                self.zone_counter = 1
                print(f"→ Zone reset to: {self.current_zone}{self.zone_counter}")
                
            elif key == ord('t'):
                # Batch edit last slots
                self.batch_edit_type()
                
            elif key == ord('c'):
                # Clear current polygon
                self.current_polygon = []
                self.blueprint = self.original.copy()
                self.redraw_slots()
                print("✗ Current polygon cleared")
                
            elif key == ord('u'):
                # Undo last saved slot
                if self.slots:
                    removed = self.slots.pop()
                    print(f"✗ Removed {removed['id']} (Zone {removed['zone']})")
                    self.blueprint = self.original.copy()
                    self.redraw_slots()
                    # Decrement counter if appropriate
                    if self.zone_counter > 1:
                        self.zone_counter -= 1
                
            elif key == ord('q'):
                # Save and quit
                if len(self.slots) > 0:
                    break
                else:
                    print("No slots defined. Draw at least one slot before quitting.")
        
        cv2.destroyAllWindows()
        self.save_layout()
        
        print("\n" + "="*60)
        print("TIP: Edit slot types and zones in the JSON file:")
        print(f"     {os.path.join(LAYOUT_DIR, self.lot_id + '_layout.json')}")
        print("="*60 + "\n")
        
        return self.slots
    
    def batch_edit_type(self):
        """
        Mark the last N slots as a special type (disabled, ev, compact)
        """
        if not self.slots:
            print("No slots to edit")
            return
        
        print("\n" + "-"*40)
        print("How many of the LAST slots to edit?")
        count_input = input(f"Enter number (1-{len(self.slots)}): ").strip()
        
        try:
            count = int(count_input)
            if count < 1 or count > len(self.slots):
                print("Invalid number")
                return
        except ValueError:
            print("Invalid input")
            return
        
        print("\nSlot type:")
        print("  1 - Regular")
        print("  2 - Disabled")
        print("  3 - EV Charging")
        print("  4 - Compact")
        
        type_input = input("Select type (1-4): ").strip()
        
        types = {
            '1': 'regular',
            '2': 'disabled',
            '3': 'ev',
            '4': 'compact'
        }
        
        slot_type = types.get(type_input, 'regular')
        
        # Update last N slots
        for i in range(len(self.slots) - count, len(self.slots)):
            self.slots[i]['type'] = slot_type
            print(f"  ✓ Updated {self.slots[i]['id']} → {slot_type}")
        
        print("-"*40 + "\n")
    
    def redraw_slots(self):
        """
        Redraw all saved slots on blueprint
        """
        for slot in self.slots:
            pts = [tuple(p) for p in slot['polygon']]
            
            # Color based on type
            if slot['type'] == 'disabled':
                color = (255, 0, 255)  # Magenta
            elif slot['type'] == 'ev':
                color = (255, 255, 0)  # Cyan
            elif slot['type'] == 'compact':
                color = (0, 165, 255)  # Orange
            else:
                color = (0, 200, 0)  # Green
            
            # Draw polygon
            for i in range(len(pts)):
                cv2.line(self.blueprint, pts[i], pts[(i + 1) % len(pts)], color, 2)
            
            # Add zone label
            center_x = int(sum(p[0] for p in slot['polygon']) / len(slot['polygon']))
            center_y = int(sum(p[1] for p in slot['polygon']) / len(slot['polygon']))
            cv2.putText(self.blueprint, slot['zone'], (center_x - 15, center_y),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        cv2.imshow(self.window_name, self.blueprint)
    
    def save_layout(self):
        """
        Save slot layout to JSON file with clear instructions for manual editing
        """
        layout_data = {
            '_instructions': {
                'how_to_edit': 'Edit slot types and zones directly in this file',
                'slot_types': ['regular', 'disabled', 'ev', 'compact'],
                'zone_format': 'Any string (e.g., A1, B2, North-1, Section-C)',
                'example': {
                    'change_type': "Change 'type': 'regular' to 'type': 'disabled'",
                    'change_zone': "Change 'zone': 'A1' to 'zone': 'VIP-1'"
                }
            },
            'lot_id': self.lot_id,
            'blueprint_path': self.blueprint_path,
            'total_slots': len(self.slots),
            'slots': self.slots
        }
        
        output_path = os.path.join(LAYOUT_DIR, f"{self.lot_id}_layout.json")
        
        with open(output_path, 'w') as f:
            json.dump(layout_data, f, indent=2)
        
        print(f"\n✓ Layout saved to: {output_path}")
        print(f"✓ Total slots defined: {len(self.slots)}")
        
        # Print summary by type
        type_counts = {}
        for slot in self.slots:
            slot_type = slot['type']
            type_counts[slot_type] = type_counts.get(slot_type, 0) + 1
        
        print("\nSlot Summary:")
        for slot_type, count in type_counts.items():
            print(f"  - {slot_type}: {count}")