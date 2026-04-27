"""
Perspective-aware automatic parking slot detection.
Works with angled/perspective camera views by:
1. Detecting row boundary lines
2. Warping the parking area to a clean top-down view
3. Detecting slots on the straightened image
4. Unwarping slot coordinates back to original image space
"""

import cv2
import numpy as np
import json
import os


class AutoSlotDetector:

    def __init__(self, image_path, debug_dir='output/debug'):
        self.image = cv2.imread(image_path)
        if self.image is None:
            raise ValueError(f"Could not load image: {image_path}")
        self.gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        self.height, self.width = self.image.shape[:2]
        self.slots = []
        self._homography = None          # original → warped
        self._homography_inv = None      # warped → original
        self.debug_dir = debug_dir
        os.makedirs(self.debug_dir, exist_ok=True)

    def _dbg(self, filename):
        """Return full path for a debug image file."""
        return os.path.join(self.debug_dir, filename)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def detect_slots(self, min_slot_width=30):
        os.makedirs('output', exist_ok=True)

        print(f"\nDebug images will be saved to: {self.debug_dir}")
        print("Step 1: Detecting parking area mask...")
        parking_mask = self._detect_parking_mask()

        print("Step 2: Detecting lines on original image...")
        lines = self._detect_lines(self.gray, parking_mask, prefix="orig")
        print(f"  Detected {len(lines)} line segments")

        print("Step 3: Classifying lines into dividers and boundaries...")
        dividers, boundaries = self._classify_lines(lines, self.image, prefix="orig")
        print(f"  Dividers: {len(dividers)}, Boundaries: {len(boundaries)}")

        print("Step 4: Clustering boundary lines into row pairs...")
        row_pairs = self._find_row_pairs(boundaries, self.image)
        print(f"  Found {len(row_pairs)} parking row(s)")

        if not row_pairs:
            print("  No row pairs found — cannot detect slots.")
            return []

        print("Step 5: Warping parking area to top-down view...")
        warped, M, Minv, src_corners = self._warp_to_topdown(row_pairs, parking_mask)
        if warped is None:
            print("  Warp failed — falling back to direct detection.")
            warped_gray = self.gray
            use_warp = False
        else:
            cv2.imwrite(self._dbg('step5_warped.jpg'), warped)
            print("  Saved: step5_warped.jpg")
            warped_gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
            use_warp = True
            self._homography = M
            self._homography_inv = Minv

        print("Step 6: Detecting lines on warped image...")
        warped_mask = np.ones(warped_gray.shape, dtype=np.uint8) * 255
        warped_lines = self._detect_lines(warped_gray,
                                          warped_mask if use_warp else parking_mask,
                                          prefix="warp")
        print(f"  Detected {len(warped_lines)} line segments")

        print("Step 7: Classifying warped lines...")
        w_dividers, w_boundaries = self._classify_lines(warped_lines,
                                                         warped if use_warp else self.image,
                                                         prefix="warp")
        print(f"  Dividers: {len(w_dividers)}, Boundaries: {len(w_boundaries)}")

        print("Step 8: Finding row pairs in warped image...")
        w_h = warped.shape[0] if use_warp else self.height
        w_w = warped.shape[1] if use_warp else self.width
        w_row_pairs = self._find_row_pairs(w_boundaries,
                                            warped if use_warp else self.image,
                                            prefix="warp",
                                            img_h=w_h,
                                            filter_white=use_warp)

        # If warped row detection fails, use full-height rows spanning the warped image
        if not w_row_pairs and use_warp:
            print("  No rows found in warped image — using full image height as single row")
            top_line = ((0, 0), (w_w, 0))
            bot_line = ((0, w_h), (w_w, w_h))
            w_row_pairs = [(top_line, bot_line)]

        print("Step 9: Building slots in warped space...")
        warped_slots = []
        ref_img = warped if use_warp else self.image
        for row_top, row_bottom in w_row_pairs:
            row_slots = self._slots_in_row(w_dividers, row_top, row_bottom,
                                            min_slot_width, ref_img)
            warped_slots.extend(row_slots)
        print(f"  Found {len(warped_slots)} slot(s) in warped space")

        print("Step 10: Unwarping slot coordinates back to original image...")
        if use_warp and warped_slots:
            self.slots = self._unwarp_slots(warped_slots, Minv)
        else:
            self.slots = warped_slots

        for i, slot in enumerate(self.slots):
            slot['id'] = f'slot_{i + 1}'
            slot['zone'] = self._auto_zone(slot['polygon'], i)

        print(f"Done. Detected {len(self.slots)} parking slots")
        return self.slots

    def visualize_detected_slots(self):
        result = self.image.copy()
        overlay = result.copy()

        for slot in self.slots:
            polygon = np.array(slot['polygon'], dtype=np.int32)
            cv2.fillPoly(overlay, [polygon], (0, 255, 0))
            cv2.polylines(result, [polygon], True, (0, 255, 0), 2)

            cx = int(np.mean([p[0] for p in slot['polygon']]))
            cy = int(np.mean([p[1] for p in slot['polygon']]))
            text = slot.get('zone', slot.get('id', ''))
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            cv2.rectangle(result, (cx - tw // 2 - 3, cy - th - 3),
                          (cx + tw // 2 + 3, cy + 3), (0, 0, 0), -1)
            cv2.putText(result, text, (cx - tw // 2, cy),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        result = cv2.addWeighted(overlay, 0.3, result, 0.7, 0)
        cv2.rectangle(result, (10, 10), (300, 60), (0, 0, 0), -1)
        cv2.putText(result, f"Detected Slots: {len(self.slots)}", (20, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        return result

    def save_slots(self, output_path):
        def convert(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            if isinstance(obj, np.floating):
                return float(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            raise TypeError(f'Object of type {type(obj)} is not JSON serializable')

        data = {
            'total_slots': len(self.slots),
            'image_width': self.width,
            'image_height': self.height,
            'slots': self.slots,
        }
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2, default=convert)
        print(f"Saved to: {output_path}")

    # ------------------------------------------------------------------
    # Parking area mask
    # ------------------------------------------------------------------

    def _detect_parking_mask(self):
        hsv = cv2.cvtColor(self.image, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, np.array([0, 0, 60]), np.array([180, 50, 220]))
        _, white = cv2.threshold(self.gray, 200, 255, cv2.THRESH_BINARY)
        mask = cv2.bitwise_and(mask, cv2.bitwise_not(white))
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
        if n > 1:
            largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
            mask = ((labels == largest) * 255).astype(np.uint8)
        coverage = np.sum(mask > 0) / mask.size * 100
        print(f"  Parking area coverage: {coverage:.1f}%")
        cv2.imwrite(self._dbg('step1_mask.jpg'), mask)
        print(f"  Saved: step1_mask.jpg")
        return mask

    # ------------------------------------------------------------------
    # Line detection (reusable on any gray image + mask)
    # ------------------------------------------------------------------

    def _detect_lines(self, gray_img, mask, prefix=""):
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray_img)
        _, binary = cv2.threshold(enhanced, 150, 255, cv2.THRESH_BINARY)
        edges = cv2.Canny(binary, 30, 100, apertureSize=3)
        edges = cv2.bitwise_and(edges, edges, mask=mask)

        tag = f"_{prefix}" if prefix else ""
        cv2.imwrite(self._dbg(f'step2{tag}_edges.jpg'), edges)

        raw = cv2.HoughLinesP(edges, rho=1, theta=np.pi / 180,
                               threshold=20, minLineLength=20, maxLineGap=20)
        if raw is None:
            return []

        lines = []
        for seg in raw:
            x1, y1, x2, y2 = seg[0]
            mx, my = int((x1 + x2) / 2), int((y1 + y2) / 2)
            h, w = gray_img.shape[:2]
            if 0 <= my < h and 0 <= mx < w:
                if mask[my, mx] == 0:
                    continue
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1)) % 180
            length = np.hypot(x2 - x1, y2 - y1)
            lines.append({'start': (x1, y1), 'end': (x2, y2),
                          'angle': angle, 'length': length})
        return lines

    # ------------------------------------------------------------------
    # Classification
    # ------------------------------------------------------------------

    def _classify_lines(self, lines, ref_img, prefix=""):
        dividers = []
        boundaries = []
        debug = ref_img.copy()
        for l in lines:
            a = l['angle']
            p1, p2 = tuple(l['start']), tuple(l['end'])
            if a < 25 or a > 155:
                boundaries.append(l)
                cv2.line(debug, p1, p2, (0, 0, 255), 2)
            elif 50 < a < 130:
                dividers.append(l)
                cv2.line(debug, p1, p2, (255, 0, 0), 2)
            else:
                cv2.line(debug, p1, p2, (100, 100, 100), 1)
        cv2.putText(debug, "Red=boundary  Blue=divider  Gray=discarded",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        tag = f"_{prefix}" if prefix else ""
        cv2.imwrite(self._dbg(f'step3{tag}_classified.jpg'), debug)
        return dividers, boundaries

    # ------------------------------------------------------------------
    # Row pair detection
    # ------------------------------------------------------------------

    def _cluster_by_y(self, lines, tolerance=25):
        if not lines:
            return []
        items = sorted(
            [((l['start'][1] + l['end'][1]) / 2, l) for l in lines],
            key=lambda x: x[0]
        )
        clusters, current, cur_y = [], [items[0][1]], items[0][0]
        for y, line in items[1:]:
            if abs(y - cur_y) < tolerance:
                current.append(line)
            else:
                clusters.append(current)
                current, cur_y = [line], y
        clusters.append(current)
        return clusters

    def _representative_hline(self, cluster, img_w=None):
        if img_w is None:
            img_w = self.width
        y = int(np.median([(l['start'][1] + l['end'][1]) / 2 for l in cluster]))
        return (0, y), (img_w, y)

    def _merge_overlapping_pairs(self, pairs):
        """
        Merge row pairs that overlap OR are close enough to be parts of the
        same physical row (gap between them < the height of either pair).
        Replaces the group with a single pair using the outermost boundaries.
        """
        if len(pairs) <= 1:
            return pairs

        # Sort by top y
        pairs = sorted(pairs, key=lambda p: p[0][0][1])

        merged = []
        cur_top_y, cur_bot_y = pairs[0][0][0][1], pairs[0][1][0][1]
        cur_top, cur_bot = pairs[0]

        for top, bot in pairs[1:]:
            t_y = top[0][1]
            b_y = bot[0][1]
            cur_height = cur_bot_y - cur_top_y
            next_height = b_y - t_y
            gap = t_y - cur_bot_y
            # Merge if overlapping OR gap is smaller than 70% of the shorter row
            if gap <= min(cur_height, next_height) * 0.70:
                if t_y < cur_top_y:
                    cur_top = top
                    cur_top_y = t_y
                if b_y > cur_bot_y:
                    cur_bot = bot
                    cur_bot_y = b_y
            else:
                merged.append((cur_top, cur_bot))
                cur_top, cur_bot = top, bot
                cur_top_y, cur_bot_y = t_y, b_y

        merged.append((cur_top, cur_bot))
        return merged

    def _find_row_pairs(self, boundaries, ref_img, prefix="", img_h=None, filter_white=False):
        if img_h is None:
            img_h = self.height
        img_w = ref_img.shape[1]

        clusters = self._cluster_by_y(boundaries, tolerance=25)
        if len(clusters) < 2:
            return []

        # In the warped (top-down) image, real white parking lines are bright and
        # span most of the image width. Tree/shadow/curb edges are NOT white —
        # they are transitions between two dark/gray areas.
        # Only apply this filter on the warped image (filter_white=True), because
        # in the original perspective image white lines are angled and cover only
        # a narrow x-range per row, making row-wide brightness checks unreliable.
        if filter_white:
            # Step A: keep only clusters that sit on actual bright white pixels.
            # Real parking lines have max brightness > 190; tree/shadow/curb
            # edges are gray-to-gray transitions with max < 140.
            gray_ref = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY)
            white_clusters = []
            for cluster in clusters:
                y = int(np.median([(l['start'][1] + l['end'][1]) / 2 for l in cluster]))
                y = max(0, min(y, gray_ref.shape[0] - 1))
                y0, y1 = max(0, y - 3), min(gray_ref.shape[0], y + 4)
                band = gray_ref[y0:y1, :]
                if int(np.max(band)) > 190:
                    white_clusters.append(cluster)
            if len(white_clusters) >= 2:
                clusters = white_clusters

            # Step B: re-cluster the surviving white clusters with a larger
            # tolerance to merge nearby detections of the same physical line
            # (e.g. the A-row top/bottom white lines each produce 2-3 clusters
            # within ~84px that should be treated as one boundary zone).
            all_lines = [l for c in clusters for l in c]
            clusters = self._cluster_by_y(all_lines, tolerance=50)

        reps = sorted([self._representative_hline(c, img_w) for c in clusters],
                      key=lambda r: r[0][1])

        if filter_white:
            # Deduplicate representative lines that are very close to each other
            # (stray trailing-edge detections of the same physical white line).
            deduped_reps = [reps[0]]
            for r in reps[1:]:
                if r[0][1] - deduped_reps[-1][0][1] > 30:
                    deduped_reps.append(r)
            reps = deduped_reps

        min_row_h = img_h * 0.05
        max_row_h = img_h * 0.90

        pairs = []
        used = [False] * len(reps)
        for i in range(len(reps)):
            if used[i]:
                continue
            for j in range(i + 1, len(reps)):
                if used[j]:
                    continue
                gap = reps[j][0][1] - reps[i][0][1]
                if min_row_h < gap < max_row_h:
                    pairs.append((reps[i], reps[j]))
                    used[i] = used[j] = True
                    break

        # Merge overlapping pairs: if two pairs share the same y-zone,
        # keep only the one with the outermost boundaries (largest height).
        # This prevents tree shadows / noise lines near a real row from
        # spawning multiple thin false row pairs in the same region.
        pairs = self._merge_overlapping_pairs(pairs)

        # Drop noise pairs that are much shorter than the median row height.
        # e.g. a thin vegetation-edge strip at the top of the warped image.
        if len(pairs) > 1:
            heights = [p[1][0][1] - p[0][0][1] for p in pairs]
            median_h = float(np.median(heights))
            pairs = [p for p in pairs
                     if (p[1][0][1] - p[0][0][1]) >= median_h * 0.45]

        if filter_white:
            # Fallback: if a cluster in the lower half of the image has no pair
            # (e.g. the bottom row's outer white line is cut off by the image crop),
            # add a virtual bottom boundary at the image bottom edge.
            paired_ys = {p[0][0][1] for p in pairs} | {p[1][0][1] for p in pairs}
            for r in reps:
                ry = r[0][1]
                if ry > img_h // 2 and ry not in paired_ys:
                    virtual_bot = ((0, img_h - 1), (img_w, img_h - 1))
                    pairs.append((r, virtual_bot))

        debug = ref_img.copy()
        for p1, p2 in reps:
            cv2.line(debug, p1, p2, (0, 255, 255), 1)
        for idx, (top, bot) in enumerate(pairs):
            cv2.line(debug, top[0], top[1], (255, 255, 0), 2)
            cv2.line(debug, bot[0], bot[1], (255, 0, 255), 2)
            mid_y = (top[0][1] + bot[0][1]) // 2
            cv2.putText(debug, f"Row {idx+1}", (20, mid_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        tag = f"_{prefix}" if prefix else ""
        cv2.imwrite(self._dbg(f'step4{tag}_row_pairs.jpg'), debug)
        print(f"  Saved: step4{tag}_row_pairs.jpg  ({len(pairs)} row pair(s))")
        return pairs

    # ------------------------------------------------------------------
    # Perspective warp
    # ------------------------------------------------------------------

    def _warp_to_topdown(self, row_pairs, parking_mask):
        """
        Compute src corners from the outermost detected row boundaries,
        then warp the image to a clean top-down rectangle.
        Returns: (warped_bgr, M, Minv, src_corners) or (None, None, None, None)
        """
        if not row_pairs:
            return None, None, None, None

        # Collect all boundary y-values from all row pairs
        all_y = []
        for top, bot in row_pairs:
            all_y.append(top[0][1])
            all_y.append(bot[0][1])
        y_top = min(all_y)
        y_bot = max(all_y)

        # Find the horizontal extent of white line pixels within the parking mask
        # by scanning the rows near each boundary
        def scan_x_extent(y, band=15):
            y0 = max(0, y - band)
            y1 = min(self.height, y + band)
            region = self.gray[y0:y1, :]
            _, bw = cv2.threshold(region, 180, 255, cv2.THRESH_BINARY)
            masked_row = cv2.bitwise_and(bw, bw,
                                          mask=parking_mask[y0:y1, :])
            cols = np.where(masked_row > 0)[1]
            if len(cols) < 10:
                # fallback: use parking_mask column extent at that row strip
                cols = np.where(parking_mask[y0:y1, :] > 0)[1]
            if len(cols) == 0:
                return 0, self.width
            return int(np.percentile(cols, 5)), int(np.percentile(cols, 95))

        x_left_top, x_right_top = scan_x_extent(y_top)
        x_left_bot, x_right_bot = scan_x_extent(y_bot)

        # Debug: draw the computed source corners on original image
        debug_corners = self.image.copy()
        corners_src = np.array([
            [x_left_top,  y_top],
            [x_right_top, y_top],
            [x_right_bot, y_bot],
            [x_left_bot,  y_bot],
        ], dtype=np.float32)
        for pt in corners_src.astype(int):
            cv2.circle(debug_corners, tuple(pt), 8, (0, 0, 255), -1)
        cv2.polylines(debug_corners, [corners_src.astype(np.int32)], True, (0, 255, 255), 2)
        cv2.imwrite(self._dbg('step5_warp_corners.jpg'), debug_corners)
        print(f"  Source corners: {corners_src.tolist()}")
        print(f"  Saved: step5_warp_corners.jpg")

        # Destination: a flat rectangle.
        # Add 40px padding to dst_h so the bottom row's boundary white line
        # doesn't land exactly at the warped image edge (where Hough misses it).
        dst_w = int(max(x_right_top - x_left_top, x_right_bot - x_left_bot))
        dst_h = int(y_bot - y_top) + 40
        dst_w = max(dst_w, 100)
        dst_h = max(dst_h, 50)

        corners_dst = np.array([
            [0,       0      ],
            [dst_w,   0      ],
            [dst_w,   dst_h  ],
            [0,       dst_h  ],
        ], dtype=np.float32)

        M    = cv2.getPerspectiveTransform(corners_src, corners_dst)
        Minv = cv2.getPerspectiveTransform(corners_dst, corners_src)

        warped = cv2.warpPerspective(self.image, M, (dst_w, dst_h))
        return warped, M, Minv, corners_src

    # ------------------------------------------------------------------
    # Slot building (in warped / top-down space)
    # ------------------------------------------------------------------

    def _x_at_y(self, p1, p2, y):
        x1, y1 = p1
        x2, y2 = p2
        if y2 == y1:
            return (x1 + x2) / 2
        return x1 + (x2 - x1) * (y - y1) / (y2 - y1)

    def _extend_divider_to_row(self, divider, y_top, y_bot):
        p1, p2 = divider['start'], divider['end']
        return (int(self._x_at_y(p1, p2, y_top)), y_top), \
               (int(self._x_at_y(p1, p2, y_bot)),  y_bot)

    def _slots_in_row(self, dividers, row_top, row_bottom, min_width, ref_img):
        y_top = row_top[0][1]
        y_bot = row_bottom[0][1]
        img_w = ref_img.shape[1]

        spanning = []
        for d in dividers:
            y_lo = min(d['start'][1], d['end'][1])
            y_hi = max(d['start'][1], d['end'][1])
            overlap = min(y_hi, y_bot) - max(y_lo, y_top)
            if overlap < (y_bot - y_top) * 0.50:
                continue
            top_pt, bot_pt = self._extend_divider_to_row(d, y_top, y_bot)
            x_mid = (top_pt[0] + bot_pt[0]) / 2
            spanning.append({'top': top_pt, 'bot': bot_pt, 'x_mid': x_mid})

        if len(spanning) < 2:
            return []

        spanning.sort(key=lambda d: d['x_mid'])

        deduped = [spanning[0]]
        for d in spanning[1:]:
            if d['x_mid'] - deduped[-1]['x_mid'] > 10:
                deduped.append(d)

        # Estimate typical slot width from the median gap between adjacent dividers
        gaps = [deduped[i+1]['x_mid'] - deduped[i]['x_mid']
                for i in range(len(deduped) - 1)]
        typical_width = float(np.median(gaps))

        # Add virtual edge dividers if the space beyond the outermost real divider
        # is roughly one slot-width (within 40% tolerance)
        left_gap  = deduped[0]['x_mid']
        right_gap = img_w - deduped[-1]['x_mid']

        if typical_width * 0.40 < left_gap < typical_width * 1.40:
            virtual_left = {
                'top': (0, y_top),
                'bot': (0, y_bot),
                'x_mid': 0.0,
            }
            deduped.insert(0, virtual_left)

        if typical_width * 0.40 < right_gap < typical_width * 1.40:
            virtual_right = {
                'top': (img_w, y_top),
                'bot': (img_w, y_bot),
                'x_mid': float(img_w),
            }
            deduped.append(virtual_right)

        debug = ref_img.copy()
        for d in deduped:
            cv2.line(debug, d['top'], d['bot'], (0, 255, 255), 1)

        slots = []
        for i in range(len(deduped) - 1):
            left  = deduped[i]
            right = deduped[i + 1]
            width = right['x_mid'] - left['x_mid']

            if width < min_width:
                continue

            polygon = [
                list(left['top']),
                list(right['top']),
                list(right['bot']),
                list(left['bot']),
            ]
            area = float(abs(cv2.contourArea(np.array(polygon, dtype=np.float32))))
            if area < 500:   # much smaller threshold — warped image is smaller
                continue

            pts = np.array(polygon, dtype=np.int32)
            cv2.polylines(debug, [pts], True, (0, 255, 0), 2)
            cx = int(np.mean([p[0] for p in polygon]))
            cy = int(np.mean([p[1] for p in polygon]))
            cv2.putText(debug, f"{len(slots)+1}", (cx - 8, cy + 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

            slots.append({
                'id': '',
                'polygon': polygon,
                'type': 'regular',
                'zone': '',
                'area': area,
                'width': float(width),
            })

        cv2.imwrite(self._dbg('step9_warp_slots.jpg'), debug)
        print(f"  Saved: step9_warp_slots.jpg  ({len(slots)} slot(s))")
        return slots

    # ------------------------------------------------------------------
    # Unwarp polygon coordinates
    # ------------------------------------------------------------------

    def _unwarp_slots(self, warped_slots, Minv):
        """Transform polygon coordinates from warped space back to original image space."""
        original_slots = []
        for slot in warped_slots:
            pts = np.array(slot['polygon'], dtype=np.float32).reshape(-1, 1, 2)
            pts_orig = cv2.perspectiveTransform(pts, Minv)
            new_polygon = [[int(p[0][0]), int(p[0][1])] for p in pts_orig]
            new_slot = dict(slot)
            new_slot['polygon'] = new_polygon
            # Recompute area in original space
            new_slot['area'] = float(abs(cv2.contourArea(
                np.array(new_polygon, dtype=np.float32)
            )))
            original_slots.append(new_slot)
        return original_slots

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _auto_zone(self, polygon, index):
        cx = np.mean([p[0] for p in polygon])
        cy = np.mean([p[1] for p in polygon])
        row = chr(65 + min(int(cy / self.height * 3), 2))
        col = int(cx / self.width * 20) + 1
        return f"{row}{col}"
