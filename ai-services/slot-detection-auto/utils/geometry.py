"""
Geometric utility functions for polygon operations and intersection calculations
Handles IoU calculation, point-in-polygon tests, and coordinate transformations
"""

import numpy as np
import cv2


def calculate_iou(bbox, polygon):
    """
    Calculate Intersection over Union between bounding box and polygon
    Used to determine if a vehicle occupies a parking slot
    """
    x1, y1, x2, y2 = bbox
    
    # Create binary masks for both shapes
    mask_bbox = np.zeros((2000, 2000), dtype=np.uint8)
    mask_polygon = np.zeros((2000, 2000), dtype=np.uint8)
    
    # Draw bounding box
    cv2.rectangle(mask_bbox, (int(x1), int(y1)), (int(x2), int(y2)), 255, -1)
    
    # Draw polygon
    polygon_points = np.array(polygon, dtype=np.int32)
    cv2.fillPoly(mask_polygon, [polygon_points], 255)
    
    # Calculate intersection and union
    intersection = np.logical_and(mask_bbox, mask_polygon)
    union = np.logical_or(mask_bbox, mask_polygon)
    
    iou = np.sum(intersection) / np.sum(union) if np.sum(union) > 0 else 0
    
    return iou


def point_in_polygon(point, polygon):
    """
    Check if a point lies inside a polygon using ray casting algorithm
    """
    x, y = point
    n = len(polygon)
    inside = False
    
    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    
    return inside


def polygon_area(polygon):
    """
    Calculate area of polygon using shoelace formula
    """
    x = [p[0] for p in polygon]
    y = [p[1] for p in polygon]
    return 0.5 * abs(sum(x[i] * y[i + 1] - x[i + 1] * y[i] for i in range(-1, len(polygon) - 1)))


def get_polygon_center(polygon):
    """
    Calculate centroid of polygon
    """
    x_coords = [p[0] for p in polygon]
    y_coords = [p[1] for p in polygon]
    return (sum(x_coords) / len(polygon), sum(y_coords) / len(polygon))


def transform_polygon(polygon, homography_matrix):
    """
    Transform polygon coordinates using homography matrix
    Converts blueprint coordinates to camera view coordinates
    """
    polygon_array = np.array(polygon, dtype=np.float32).reshape(-1, 1, 2)
    transformed = cv2.perspectiveTransform(polygon_array, homography_matrix)
    return transformed.reshape(-1, 2).tolist()