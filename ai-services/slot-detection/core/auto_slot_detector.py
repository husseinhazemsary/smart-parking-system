"""
Fixed automatic parking slot detection
Addresses spatial relationship, line filtering, and polygon validation issues
"""

import cv2
import numpy as np
import json
import os


class AutoSlotDetector:
    """
    Improved parking slot detector with spatial awareness
    """
    
    def __init__(self, image_path):
        """
        Initialize with empty parking lot image
        """
        self.image = cv2.imread(image_path)
        if self.image is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        self.gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        self.height, self.width = self.image.shape[:2]
        self.slots = []
        
    def detect_slots(self, min_slot_width=30, max_slot_width=150):
        """
        Main detection pipeline with improved spatial logic
        """
        print("Step 1: Detecting parking area...")
        parking_mask = self.detect_parking_area()
        
        print("Step 2: Enhancing parking lines...")
        enhanced = self.enhance_parking_lines()
        
        print("Step 3: Detecting and filtering line segments...")
        lines = self.detect_and_filter_lines(enhanced, parking_mask)
        
        print("Step 4: Merging line fragments...")
        merged_lines = self.merge_line_fragments(lines)
        
        print("Step 5: Finding parking slots from spatial patterns...")
        self.slots = self.find_slots_with_spatial_logic(
            merged_lines, 
            parking_mask,
            min_slot_width,
            max_slot_width
        )
        
        print(f"✓ Detected {len(self.slots)} parking slots")
        
        return self.slots
    
    def detect_parking_area(self):
        """
        FIX FOR PROBLEM 3: Create a mask of where parking area actually is
        Filters out trees, buildings, sky, roads
        """
        # Convert to HSV
        hsv = cv2.cvtColor(self.image, cv2.COLOR_BGR2HSV)
        
        # Detect dark asphalt (parking lot surface)
        # Asphalt is dark with low saturation
        lower_asphalt = np.array([0, 0, 0])
        upper_asphalt = np.array([180, 50, 100])
        asphalt_mask = cv2.inRange(hsv, lower_asphalt, upper_asphalt)
        
        # Morphological operations to clean up
        kernel_large = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        asphalt_mask = cv2.morphologyEx(asphalt_mask, cv2.MORPH_CLOSE, kernel_large)
        asphalt_mask = cv2.morphologyEx(asphalt_mask, cv2.MORPH_OPEN, kernel_large)
        
        # Keep only large connected components (the main parking area)
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(asphalt_mask, connectivity=8)
        
        # Find largest component (background is label 0, so start from 1)
        if num_labels > 1:
            largest_component = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
            parking_mask = (labels == largest_component).astype(np.uint8) * 255
        else:
            parking_mask = asphalt_mask
        
        print(f"  Parking area coverage: {np.sum(parking_mask > 0) / parking_mask.size * 100:.1f}%")
        
        return parking_mask
    
    def enhance_parking_lines(self):
        """
        Enhanced line detection focusing on white parking lines
        """
        # Apply CLAHE
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(self.gray)
        
        # Strong threshold for white lines
        _, binary = cv2.threshold(enhanced, 170, 255, cv2.THRESH_BINARY)
        
        # Clean up
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        
        return binary
    
    def detect_and_filter_lines(self, binary_image, parking_mask):
        """
        FIX FOR PROBLEM 1 & 3: Detect lines and filter to parking area only
        IMPROVED: Better detection of distant parking lines
        """
        # Edge detection
        edges = cv2.Canny(binary_image, 30, 100, apertureSize=3)
        
        # Apply parking mask to edges
        edges = cv2.bitwise_and(edges, edges, mask=parking_mask)
        
        # Hough Line Transform with LOWER thresholds for distant lines
        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi/180,
            threshold=25,      # LOWERED from 40 to 25
            minLineLength=15,  # LOWERED from 30 to 15
            maxLineGap=15      # INCREASED from 10 to 15
        )
        
        if lines is None:
            print("  Warning: No lines detected")
            return []
        
        # Convert to structured format
        line_segments = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            
            # Filter: Only keep lines within parking mask
            mid_x = int((x1 + x2) / 2)
            mid_y = int((y1 + y2) / 2)
            
            if 0 <= mid_y < parking_mask.shape[0] and 0 <= mid_x < parking_mask.shape[1]:
                if parking_mask[mid_y, mid_x] > 0:
                    angle = self.calculate_angle(x1, y1, x2, y2)
                    length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
                    
                    # Filter: Keep lines (even short ones for distant slots)
                    if length > 15:  # LOWERED from 20 to 15
                        line_segments.append({
                            'start': (x1, y1),
                            'end': (x2, y2),
                            'angle': angle,
                            'length': length
                        })
        
        print(f"  Detected {len(line_segments)} line segments in parking area")
        return line_segments
    
    def merge_line_fragments(self, lines, angle_tolerance=8, distance_tolerance=30):
        """
        FIX: More lenient merging to keep more individual slot divider lines
        """
        if len(lines) == 0:
            return []
        
        merged = []
        used = [False] * len(lines)
        
        for i, line in enumerate(lines):
            if used[i]:
                continue
            
            # Start new merged line
            current_line = {
                'start': line['start'],
                'end': line['end'],
                'angle': line['angle'],
                'length': line['length']
            }
            used[i] = True
            
            # Find nearby lines with similar angle to merge
            merged_something = True
            iteration_count = 0
            max_iterations = 3  # ADDED: Limit iterations to prevent over-merging
            
            while merged_something and iteration_count < max_iterations:
                merged_something = False
                iteration_count += 1
                
                for j, other in enumerate(lines):
                    if used[j]:
                        continue
                    
                    # Check if angles are similar
                    angle_diff = abs(current_line['angle'] - other['angle'])
                    if angle_diff > angle_tolerance and angle_diff < (180 - angle_tolerance):
                        continue
                    
                    # Check if lines are close enough to merge
                    distances = [
                        np.linalg.norm(np.array(current_line['end']) - np.array(other['start'])),
                        np.linalg.norm(np.array(current_line['start']) - np.array(other['end'])),
                    ]
                    min_dist = min(distances)
                    
                    if min_dist < distance_tolerance:
                        # Merge: extend current line
                        if distances[0] == min_dist:
                            current_line['end'] = other['end']
                        else:
                            current_line['start'] = other['start']
                        
                        # Recalculate length
                        current_line['length'] = np.linalg.norm(
                            np.array(current_line['end']) - np.array(current_line['start'])
                        )
                        
                        used[j] = True
                        merged_something = True
            
            merged.append(current_line)
        
        # CHANGED: Keep shorter lines too (they might be individual slot dividers)
        merged = [l for l in merged if l['length'] > 25]  # Was 40, now 25
        
        print(f"  Merged into {len(merged)} continuous lines")
        return merged
    
    def calculate_angle(self, x1, y1, x2, y2):
        """Calculate angle of line in degrees"""
        angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        return angle % 180
    
    def find_slots_with_spatial_logic(self, lines, parking_mask, min_slot_width, max_slot_width):
        """
        FIX FOR PROBLEM 2 & 4: Use spatial logic to find actual parking slots
        Only pairs lines that are spatially adjacent, not just sorted-order adjacent
        ADDED: Filter out horizontal/vertical lines (not slot dividers)
        """
        if len(lines) < 2:
            return []
        
        # Group parallel lines
        angle_groups = self.group_parallel_lines(lines, angle_tolerance=10)
        
        print(f"  Found {len(angle_groups)} groups of parallel lines")
        
        # FILTER: Remove groups that are too horizontal or too vertical
        # Parking slot dividers are angled (typically 30-150 degrees, not 0-20 or 160-180)
        filtered_groups = []
        for group in angle_groups:
            angle = group['angle']
            # Keep only angled lines (exclude near-horizontal and near-vertical)
            if 25 < angle < 155:  # Only keep angled lines
                filtered_groups.append(group)
                print(f"  ✓ Keeping group with {len(group['lines'])} lines at {angle:.1f}° (angled)")
            else:
                print(f"  ✗ Filtering out group with {len(group['lines'])} lines at {angle:.1f}° (too horizontal/vertical)")
        
        if len(filtered_groups) == 0:
            print("  Warning: No angled line groups found after filtering")
            # Fallback: use all groups if filtering removed everything
            filtered_groups = angle_groups[:3]
        
        slots = []
        
        # Process the filtered groups (actual slot dividers)
        for group_idx, group in enumerate(filtered_groups[:3]):  # Check top 3 filtered groups
            group_lines = group['lines']
            
            if len(group_lines) < 2:
                continue
            
            print(f"  Analyzing group {group_idx+1}: {len(group_lines)} lines at ~{group['angle']:.1f}°")
            
            # Sort lines by perpendicular position
            sorted_lines = self.sort_lines_by_position(group_lines, group['angle'])
            
            # FIX: Only pair lines that are spatially close (actual slot width)
            for i in range(len(sorted_lines) - 1):
                line1 = sorted_lines[i]
                line2 = sorted_lines[i + 1]
                
                # Calculate perpendicular distance between lines
                distance = self.perpendicular_distance_between_lines(line1, line2, group['angle'])
                
                # Only create slot if distance is reasonable for a parking slot
                if min_slot_width < distance < max_slot_width:
                    slot_polygon = self.create_slot_between_spatially_adjacent_lines(
                        line1, 
                        line2,
                        group['angle']
                    )
                    
                    if slot_polygon is not None:
                        # Validate: polygon should be in parking area
                        if self.validate_slot_polygon(slot_polygon, parking_mask):
                            area = cv2.contourArea(np.array(slot_polygon, dtype=np.float32))
                            
                            if 2000 < area < 100000:  # Reasonable slot area
                                slots.append({
                                    'id': f'slot_{len(slots) + 1}',
                                    'polygon': slot_polygon,
                                    'type': 'regular',
                                    'zone': self.auto_assign_zone(slot_polygon, len(slots)),
                                    'area': area,
                                    'width': distance
                                })
        
        return slots
    def perpendicular_distance_between_lines(self, line1, line2, angle):
        """
        Calculate perpendicular distance between two parallel lines
        """
        # Get midpoints
        mid1 = ((line1['start'][0] + line1['end'][0]) / 2, 
                (line1['start'][1] + line1['end'][1]) / 2)
        mid2 = ((line2['start'][0] + line2['end'][0]) / 2,
                (line2['start'][1] + line2['end'][1]) / 2)
        
        # Calculate perpendicular angle
        perp_angle = (angle + 90) % 180
        perp_rad = np.radians(perp_angle)
        
        # Project midpoints onto perpendicular axis
        proj1 = mid1[0] * np.cos(perp_rad) + mid1[1] * np.sin(perp_rad)
        proj2 = mid2[0] * np.cos(perp_rad) + mid2[1] * np.sin(perp_rad)
        
        return abs(proj2 - proj1)
    
    def create_slot_between_spatially_adjacent_lines(self, line1, line2, angle):
        """
        FIX FOR PROBLEM 1: Create proper rectangular polygon between two spatially adjacent lines
        Uses line extensions to create clean rectangles
        """
        # Extend both lines to same length for clean rectangles
        # Use the longer line as reference
        max_length = max(line1['length'], line2['length'])
        
        # Extend line1
        dx = line1['end'][0] - line1['start'][0]
        dy = line1['end'][1] - line1['start'][1]
        current_length = np.sqrt(dx**2 + dy**2)
        
        if current_length > 0:
            scale = max_length / current_length
            line1_extended_end = (
                int(line1['start'][0] + dx * scale),
                int(line1['start'][1] + dy * scale)
            )
        else:
            line1_extended_end = line1['end']
        
        # Extend line2
        dx = line2['end'][0] - line2['start'][0]
        dy = line2['end'][1] - line2['start'][1]
        current_length = np.sqrt(dx**2 + dy**2)
        
        if current_length > 0:
            scale = max_length / current_length
            line2_extended_end = (
                int(line2['start'][0] + dx * scale),
                int(line2['start'][1] + dy * scale)
            )
        else:
            line2_extended_end = line2['end']
        
        # Create quadrilateral with proper ordering
        polygon = [
            list(line1['start']),
            list(line1_extended_end),
            list(line2_extended_end),
            list(line2['start'])
        ]
        
        return polygon
    
    def validate_slot_polygon(self, polygon, parking_mask):
        """
        FIX FOR PROBLEM 4: Validate that polygon is reasonable
        - Must be mostly within parking area
        - Must have reasonable shape (not too skewed)
        """
        # Check if center is in parking area
        center_x = int(np.mean([p[0] for p in polygon]))
        center_y = int(np.mean([p[1] for p in polygon]))
        
        if center_y < 0 or center_y >= self.height or center_x < 0 or center_x >= self.width:
            return False
        
        if parking_mask[center_y, center_x] == 0:
            return False
        
        # Check aspect ratio (slots shouldn't be too square or too elongated)
        polygon_array = np.array(polygon, dtype=np.float32)
        rect = cv2.minAreaRect(polygon_array)
        width, height = rect[1]
        
        if width == 0 or height == 0:
            return False
        
        aspect_ratio = max(width, height) / min(width, height)
        
        # Parking slots typically have aspect ratio between 1.5 and 8
        if aspect_ratio < 1.3 or aspect_ratio > 10:
            return False
        
        return True
    
    def group_parallel_lines(self, lines, angle_tolerance=10):
        """
        Group lines by similar angles
        """
        groups = []
        used = [False] * len(lines)
        
        for i, line in enumerate(lines):
            if used[i]:
                continue
            
            group = {
                'angle': line['angle'],
                'lines': [line]
            }
            used[i] = True
            
            for j, other in enumerate(lines):
                if used[j]:
                    continue
                
                angle_diff = abs(line['angle'] - other['angle'])
                if angle_diff < angle_tolerance or angle_diff > (180 - angle_tolerance):
                    group['lines'].append(other)
                    used[j] = True
            
            if len(group['lines']) >= 2:
                groups.append(group)
        
        # Sort groups by number of lines (descending)
        groups.sort(key=lambda g: len(g['lines']), reverse=True)
        
        return groups
    
    def sort_lines_by_position(self, lines, reference_angle):
        """
        Sort lines by their perpendicular position
        """
        perp_angle = (reference_angle + 90) % 180
        perp_rad = np.radians(perp_angle)
        
        positions = []
        for line in lines:
            mid_x = (line['start'][0] + line['end'][0]) / 2
            mid_y = (line['start'][1] + line['end'][1]) / 2
            position = mid_x * np.cos(perp_rad) + mid_y * np.sin(perp_rad)
            positions.append((position, line))
        
        positions.sort(key=lambda x: x[0])
        return [line for _, line in positions]
    
    def auto_assign_zone(self, polygon, index):
        """
        Auto-assign zone based on position
        """
        center_x = np.mean([p[0] for p in polygon])
        center_y = np.mean([p[1] for p in polygon])
        
        row_index = int((center_y / self.height) * 3)
        row_letter = chr(65 + min(row_index, 2))
        
        col_number = int((center_x / self.width) * 20) + 1
        
        return f"{row_letter}{col_number}"
    
    def visualize_detected_slots(self):
        """
        Clean visualization
        """
        result = self.image.copy()
        overlay = result.copy()
        
        for slot in self.slots:
            polygon = np.array(slot['polygon'], dtype=np.int32)
            
            # Draw filled polygon
            cv2.fillPoly(overlay, [polygon], (0, 255, 0))
            
            # Draw outline
            cv2.polylines(result, [polygon], True, (0, 255, 0), 2)
            
            # Add label
            center_x = int(np.mean([p[0] for p in slot['polygon']]))
            center_y = int(np.mean([p[1] for p in slot['polygon']]))
            
            # Text background
            text = slot['zone']
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            cv2.rectangle(result, (center_x-tw//2-3, center_y-th-3), 
                         (center_x+tw//2+3, center_y+3), (0, 0, 0), -1)
            
            cv2.putText(result, text, (center_x-tw//2, center_y),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        # Blend
        result = cv2.addWeighted(overlay, 0.3, result, 0.7, 0)
        
        # Add info
        cv2.rectangle(result, (10, 10), (300, 60), (0, 0, 0), -1)
        cv2.putText(result, f"Detected Slots: {len(self.slots)}", (20, 35),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        return result
    
    def visualize_debug(self):
        """
        Debug visualization showing detected lines and groups
        """
        result = self.image.copy()
        
        # Recreate detection
        parking_mask = self.detect_parking_area()
        enhanced = self.enhance_parking_lines()
        lines = self.detect_and_filter_lines(enhanced, parking_mask)
        merged_lines = self.merge_line_fragments(lines)
        angle_groups = self.group_parallel_lines(merged_lines, angle_tolerance=10)
        
        # Draw all merged lines
        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255)]
        
        for group_idx, group in enumerate(angle_groups[:5]):
            color = colors[group_idx % len(colors)]
            for line in group['lines']:
                cv2.line(result, line['start'], line['end'], color, 2)
                # Draw midpoint
                mid_x = int((line['start'][0] + line['end'][0]) / 2)
                mid_y = int((line['start'][1] + line['end'][1]) / 2)
                cv2.circle(result, (mid_x, mid_y), 3, color, -1)
        
        # Add legend
        y = 30
        for idx in range(min(5, len(angle_groups))):
            color = colors[idx]
            text = f"Group {idx+1}: {len(angle_groups[idx]['lines'])} lines at {angle_groups[idx]['angle']:.1f}°"
            cv2.putText(result, text, (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            y += 25
        
        return result
    
    def save_slots(self, output_path):
        """
        Save slots to JSON
        """
        data = {
            'total_slots': len(self.slots),
            'slots': self.slots
        }
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"✓ Saved to: {output_path}")