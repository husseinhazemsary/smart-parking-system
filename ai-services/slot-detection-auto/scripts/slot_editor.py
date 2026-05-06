"""
slot_editor.py — interactive parking slot polygon editor.

  Click                  select a slot
  Shift + Click          add / remove slot from selection
  Drag empty space       rubber-band box-select
  Drag selected slot     move all selected slots together
  Drag corner handle     reshape the solo-selected slot
  Click edge midpoint    insert a new vertex there (drag to place)
  D                      delete all selected slots
  Z                      undo last action (delete / move / resize / add vertex / add / stamp)
  A                      toggle Add mode  — click to place an average-sized slot
  C                      Copy mode  — copies the solo-selected slot's exact shape;
                          click to stamp copies
  Esc  (in Add/Copy)     exit placement mode
  S / Enter              save and exit
  Q / Esc  (normal)      discard and exit

Usage (standalone):
    python slot_editor.py --lot_id <id> [--image <path>]

Loads  data/layouts/<lot_id>_auto_slots.json
Saves  data/layouts/<lot_id>_auto_slots.json  (same file, in-place)
"""

import argparse
import copy
import json
import os
import glob as _glob
import numpy as np
import cv2
from shapely.geometry import Polygon as ShapelyPolygon

LAYOUT_DIR = os.path.join("data", "layouts")
IMAGES_DIR = os.path.join("data", "blueprints")

# ── Visual constants ───────────────────────────────────────────────────────────
COLOR_NORMAL    = (  0, 200, 255)   # yellow-ish  unselected
COLOR_SELECTED  = (255, 200,   0)   # cyan        selected
COLOR_HOVER     = (180, 180,   0)   # dim         hovered (not selected)
COLOR_HANDLE    = (255, 255, 255)   # white        corner handle
COLOR_HANDLE_H  = (  0, 255, 255)   # bright cyan  hovered corner
COLOR_EDGE_DOT  = (  0, 220, 160)   # teal         edge-midpoint handle
COLOR_EDGE_HOV  = (  0, 255, 200)   # bright teal  hovered edge midpoint
COLOR_ADD_PRE   = (  0, 255, 128)   # green        placement preview
ALPHA           = 0.35
HANDLE_R        = 7                 # corner handle radius
EDGE_R          = 4                 # edge-midpoint handle radius
HANDLE_HIT      = 12                # click tolerance (px)
WIN             = "Slot Editor"     # plain ASCII — avoids Windows encoding issues

# Which bbox edges each of the 8 multi-select handles affects: (x1, x2, y1, y2)
_HANDLE_AXES = [
    (True,  False, True,  False),   # 0  TL
    (False, False, True,  False),   # 1  TC
    (False, True,  True,  False),   # 2  TR
    (False, True,  False, False),   # 3  MR
    (False, True,  False, True),    # 4  BR
    (False, False, False, True),    # 5  BC
    (True,  False, False, True),    # 6  BL
    (True,  False, False, False),   # 7  ML
]


# ══════════════════════════════════════════════════════════════════════════════
class SlotEditor:
# ══════════════════════════════════════════════════════════════════════════════

    def __init__(self, slots, image, lot_id, img_w, img_h):
        self.slots          = copy.deepcopy(slots)
        self.image          = image.copy()
        self.lot_id         = lot_id
        self.img_w          = img_w
        self.img_h          = img_h

        self.selection        = set()   # indices of selected slots
        self.drag_mode        = None    # None | 'move' | 'corner' | 'rubber' | 'multi_resize'
        self.drag_ci          = None    # corner index (corner mode)
        self.drag_handle      = None    # handle index 0-7 (multi_resize mode)
        self.drag_start       = None    # (x, y) at mouse-down
        self.drag_orig        = {}      # {idx: polygon_copy} snapshots
        self.multi_bbox_orig  = None    # bounding box at start of multi_resize
        self.rubber_start     = None    # (x, y) rubber-band anchor
        self.rubber_end       = None    # (x, y) rubber-band current corner
        self.hover_slot       = None
        self.hover_ci         = None    # hovered corner index on solo-selected slot
        self.hover_ei         = None    # hovered edge-midpoint index on solo-selected slot
        self.hover_hi         = None    # hovered multi-resize handle index
        self.placement_mode = None    # None | 'add' | 'copy'
        self.copy_template  = None    # [(dx, dy), ...] offsets from centroid
        self.mouse_xy       = (0, 0)
        self.modified       = False

        # undo stack — each entry is a dict with a 'type' key:
        #   modify       : {'idx': int,  'polygon': [...]}
        #   multi_modify : {'changes': [(idx, poly), ...]}
        #   delete       : {'deleted': [(idx, slot), ...]}   # single or multi
        #   add          : {'idx': int}
        self.undo_stack = []

        self.avg_size = self._compute_avg_size()

        # zoom / pan
        self.zoom       = 1.0
        self.pan_x      = 0.0
        self.pan_y      = 0.0
        self._pan_start = None   # (sx, sy, pan_x0, pan_y0) during mid-btn drag

    # ── convenience ──────────────────────────────────────────────────────────

    @property
    def _solo(self):
        """The single selected index when exactly one slot is selected, else None."""
        return next(iter(self.selection)) if len(self.selection) == 1 else None

    # ── geometry helpers ──────────────────────────────────────────────────────

    def _compute_avg_size(self):
        if not self.slots:
            return 80, 40
        ws, hs = [], []
        for s in self.slots:
            pts = np.array(s["polygon"], dtype=np.float32)
            ws.append(float(pts[:, 0].max() - pts[:, 0].min()))
            hs.append(float(pts[:, 1].max() - pts[:, 1].min()))
        return int(np.mean(ws)), int(np.mean(hs))

    def _pts(self, idx):
        return np.array(self.slots[idx]["polygon"], dtype=np.int32)

    def _contains(self, idx, x, y):
        return cv2.pointPolygonTest(self._pts(idx), (float(x), float(y)), False) >= 0

    def _centroid(self, idx):
        pts = np.array(self.slots[idx]["polygon"], dtype=np.float32)
        return float(np.mean(pts[:, 0])), float(np.mean(pts[:, 1]))

    def _hit_corner(self, idx, x, y):
        for ci, (px, py) in enumerate(self.slots[idx]["polygon"]):
            if abs(px - x) <= HANDLE_HIT and abs(py - y) <= HANDLE_HIT:
                return ci
        return None

    def _hit_edge_midpoint(self, idx, x, y):
        poly = self.slots[idx]["polygon"]
        n    = len(poly)
        for i in range(n):
            p1, p2 = poly[i], poly[(i + 1) % n]
            mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
            if abs(mx - x) <= HANDLE_HIT and abs(my - y) <= HANDLE_HIT:
                return i
        return None

    def _slot_at(self, x, y):
        # give selected slots priority
        for i in sorted(self.selection, reverse=True):
            if self._contains(i, x, y):
                return i
        for i in range(len(self.slots)):
            if i not in self.selection and self._contains(i, x, y):
                return i
        return None

    # ── zoom / pan helpers ────────────────────────────────────────────────────

    def _s2i(self, sx, sy):
        """Screen → image coordinates."""
        return self.pan_x + sx / self.zoom, self.pan_y + sy / self.zoom

    def _clamp_pan(self):
        ih, iw = self.image.shape[:2]
        self.pan_x = max(0.0, min(self.pan_x, iw - iw / self.zoom))
        self.pan_y = max(0.0, min(self.pan_y, ih - ih / self.zoom))

    def _on_scroll(self, sx, sy, flags):
        delta = (flags >> 16) & 0xFFFF
        if delta > 32767:
            delta -= 65536
        factor    = 1.15 if delta > 0 else 1.0 / 1.15
        ix, iy    = self._s2i(sx, sy)
        self.zoom = max(1.0, min(10.0, self.zoom * factor))
        self.pan_x = ix - sx / self.zoom
        self.pan_y = iy - sy / self.zoom
        self._clamp_pan()

    def _preview_poly(self, cx, cy):
        w, h = self.avg_size
        hw, hh = w // 2, h // 2
        return [[cx-hw, cy-hh], [cx+hw, cy-hh], [cx+hw, cy+hh], [cx-hw, cy+hh]]

    def _preview_poly_copy(self, cx, cy):
        return [[cx + dx, cy + dy] for dx, dy in self.copy_template]

    def _current_preview(self, cx, cy):
        return (self._preview_poly_copy(cx, cy) if self.placement_mode == 'copy'
                else self._preview_poly(cx, cy))

    def _next_id(self):
        existing = {s["id"] for s in self.slots}
        n = 1
        while f"slot_{n}" in existing:
            n += 1
        return f"slot_{n}"

    def _multi_bbox(self):
        """Axis-aligned bounding box of all selected slots, or None."""
        if not self.selection:
            return None
        all_pts = []
        for i in self.selection:
            all_pts.extend(self.slots[i]["polygon"])
        pts = np.array(all_pts, dtype=np.float32)
        return (int(pts[:, 0].min()), int(pts[:, 1].min()),
                int(pts[:, 0].max()), int(pts[:, 1].max()))

    def _multi_bbox_handles(self, bbox):
        """8 handle positions matching _HANDLE_AXES order: TL TC TR MR BR BC BL ML."""
        x1, y1, x2, y2 = bbox
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        return [(x1,y1),(cx,y1),(x2,y1),(x2,cy),(x2,y2),(cx,y2),(x1,y2),(x1,cy)]

    def _hit_multi_handle(self, x, y):
        if len(self.selection) < 2:
            return None
        bbox = self._multi_bbox()
        if bbox is None:
            return None
        for hi, (hx, hy) in enumerate(self._multi_bbox_handles(bbox)):
            if abs(hx - x) <= HANDLE_HIT and abs(hy - y) <= HANDLE_HIT:
                return hi
        return None

    @staticmethod
    def _scale_polygon(poly, old_bbox, new_bbox):
        """Proportionally rescale polygon points from old_bbox space to new_bbox space."""
        ox1, oy1, ox2, oy2 = old_bbox
        nx1, ny1, nx2, ny2 = new_bbox
        ow, oh = ox2 - ox1, oy2 - oy1
        nw, nh = nx2 - nx1, ny2 - ny1
        if ow == 0 or oh == 0:
            return poly
        return [[int(nx1 + (p[0] - ox1) / ow * nw),
                 int(ny1 + (p[1] - oy1) / oh * nh)]
                for p in poly]

    # ── mouse callback ────────────────────────────────────────────────────────

    def on_mouse(self, event, x, y, flags, param):
        shift = bool(flags & cv2.EVENT_FLAG_SHIFTKEY)

        # scroll-wheel zoom
        if event == cv2.EVENT_MOUSEWHEEL:
            self._on_scroll(x, y, flags)
            return

        # middle-button pan
        if event == cv2.EVENT_MBUTTONDOWN:
            self._pan_start = (x, y, self.pan_x, self.pan_y)
            return
        if event == cv2.EVENT_MBUTTONUP:
            self._pan_start = None
            return
        if event == cv2.EVENT_MOUSEMOVE and self._pan_start is not None:
            ox, oy, px0, py0 = self._pan_start
            self.pan_x = px0 - (x - ox) / self.zoom
            self.pan_y = py0 - (y - oy) / self.zoom
            self._clamp_pan()
            return

        # transform to image coords for all editing events
        ix, iy = self._s2i(x, y)
        ixi, iyi = int(ix), int(iy)
        self.mouse_xy = (ixi, iyi)

        if   event == cv2.EVENT_MOUSEMOVE:    self._on_move(ixi, iyi)
        elif event == cv2.EVENT_LBUTTONDOWN:  self._on_down(ixi, iyi, shift)
        elif event == cv2.EVENT_LBUTTONUP:    self._on_up()

    def _on_move(self, x, y):
        if self.drag_mode == 'move':
            dx, dy = x - self.drag_start[0], y - self.drag_start[1]
            for i, orig in self.drag_orig.items():
                self.slots[i]["polygon"] = [[p[0]+dx, p[1]+dy] for p in orig]
            return

        if self.drag_mode == 'corner':
            solo = self._solo
            if solo is not None:
                self.slots[solo]["polygon"][self.drag_ci] = [x, y]
            return

        if self.drag_mode == 'rubber':
            self.rubber_end = (x, y)
            return

        if self.drag_mode == 'multi_resize':
            ox1, oy1, ox2, oy2 = self.multi_bbox_orig
            nx1, ny1, nx2, ny2 = ox1, oy1, ox2, oy2
            ax1, ax2, ay1, ay2 = _HANDLE_AXES[self.drag_handle]
            if ax1: nx1 = x
            if ax2: nx2 = x
            if ay1: ny1 = y
            if ay2: ny2 = y
            # prevent inversion
            if nx2 <= nx1: nx2 = nx1 + 1
            if ny2 <= ny1: ny2 = ny1 + 1
            for i, orig in self.drag_orig.items():
                self.slots[i]["polygon"] = self._scale_polygon(
                    orig, (ox1, oy1, ox2, oy2), (nx1, ny1, nx2, ny2))
            return

        # hover state (only when idle in normal mode)
        self.hover_slot = None
        self.hover_ci   = None
        self.hover_ei   = None
        self.hover_hi   = None
        if self.placement_mode is not None:
            return
        solo = self._solo
        if solo is not None and solo < len(self.slots):
            ci = self._hit_corner(solo, x, y)
            if ci is not None:
                self.hover_ci = ci
                return
            ei = self._hit_edge_midpoint(solo, x, y)
            if ei is not None:
                self.hover_ei = ei
                return
        elif len(self.selection) >= 2:
            hi = self._hit_multi_handle(x, y)
            if hi is not None:
                self.hover_hi = hi
                return
        hit = self._slot_at(x, y)
        if hit is not None:
            self.hover_slot = hit

    def _on_down(self, x, y, shift):
        if self.placement_mode is not None:
            self._add_slot_at(x, y)
            return

        solo = self._solo

        # ── multi-select resize handles (2+ selected) ─────────────────────
        if len(self.selection) >= 2:
            hi = self._hit_multi_handle(x, y)
            if hi is not None:
                self.drag_mode       = 'multi_resize'
                self.drag_handle     = hi
                self.drag_orig       = {i: copy.deepcopy(self.slots[i]["polygon"])
                                        for i in self.selection}
                self.multi_bbox_orig = self._multi_bbox()
                self.drag_start      = (x, y)
                return

        # ── corner handle (solo-select only) ──────────────────────────────
        if solo is not None and solo < len(self.slots):
            ci = self._hit_corner(solo, x, y)
            if ci is not None:
                self.drag_mode  = 'corner'
                self.drag_ci    = ci
                self.drag_orig  = {solo: copy.deepcopy(self.slots[solo]["polygon"])}
                self.drag_start = (x, y)
                return

            # ── edge midpoint → insert vertex and immediately drag it ──────
            ei = self._hit_edge_midpoint(solo, x, y)
            if ei is not None:
                old_poly = copy.deepcopy(self.slots[solo]["polygon"])
                self.slots[solo]["polygon"].insert(ei + 1, [x, y])
                self.drag_mode  = 'corner'
                self.drag_ci    = ei + 1
                self.drag_orig  = {solo: old_poly}
                self.drag_start = (x, y)
                return

        # ── click on a slot ───────────────────────────────────────────────
        hit = self._slot_at(x, y)
        if hit is not None:
            if shift:
                # toggle membership, no drag
                if hit in self.selection:
                    self.selection.discard(hit)
                else:
                    self.selection.add(hit)
                return
            if hit not in self.selection:
                self.selection = {hit}
            # start move drag for every selected slot
            self.drag_mode  = 'move'
            self.drag_orig  = {i: copy.deepcopy(self.slots[i]["polygon"])
                               for i in self.selection}
            self.drag_start = (x, y)
        else:
            # ── empty space → rubber-band ──────────────────────────────────
            if not shift:
                self.selection.clear()
            self.drag_mode    = 'rubber'
            self.rubber_start = (x, y)
            self.rubber_end   = (x, y)

    def _on_up(self):
        if self.drag_mode == 'rubber':
            self._finalize_rubber()

        elif self.drag_mode in ('move', 'multi_resize') and self.drag_orig:
            changed = [(i, poly) for i, poly in self.drag_orig.items()
                       if self.slots[i]["polygon"] != poly]
            if changed:
                rec = ({'type': 'modify',      'idx': changed[0][0], 'polygon': changed[0][1]}
                       if len(changed) == 1 else
                       {'type': 'multi_modify', 'changes': changed})
                self.undo_stack.append(rec)
                self.modified = True

        elif self.drag_mode == 'corner' and self.drag_orig:
            solo = self._solo
            if solo is not None:
                old_poly = next(iter(self.drag_orig.values()))
                if self.slots[solo]["polygon"] != old_poly:
                    self.undo_stack.append({'type': 'modify', 'idx': solo, 'polygon': old_poly})
                    self.modified = True

        self.drag_mode       = None
        self.drag_ci         = None
        self.drag_handle     = None
        self.drag_orig       = {}
        self.drag_start      = None
        self.multi_bbox_orig = None
        self.rubber_start    = None
        self.rubber_end      = None

    # ── rubber-band ───────────────────────────────────────────────────────────

    def _finalize_rubber(self):
        if not self.rubber_start or not self.rubber_end:
            return
        rx1 = min(self.rubber_start[0], self.rubber_end[0])
        ry1 = min(self.rubber_start[1], self.rubber_end[1])
        rx2 = max(self.rubber_start[0], self.rubber_end[0])
        ry2 = max(self.rubber_start[1], self.rubber_end[1])
        if rx2 - rx1 < 5 and ry2 - ry1 < 5:
            return   # too small — treat as a missed click, keep selection
        self.selection = {i for i in range(len(self.slots))
                          if rx1 <= self._centroid(i)[0] <= rx2
                          and ry1 <= self._centroid(i)[1] <= ry2}

    # ── actions ───────────────────────────────────────────────────────────────

    def delete_selected(self):
        if not self.selection:
            return
        deleted = []
        for idx in sorted(self.selection, reverse=True):
            slot = self.slots.pop(idx)
            deleted.append((idx, copy.deepcopy(slot)))
        self.undo_stack.append({'type': 'delete', 'deleted': deleted})
        self.selection.clear()
        self.modified = True

    def _add_slot_at(self, cx, cy):
        polygon  = self._current_preview(cx, cy)
        pts      = np.array(polygon, dtype=np.float32)
        new_slot = {
            "id":      self._next_id(),
            "polygon": polygon,
            "type":    "regular",
            "zone":    "",
            "area":    float(ShapelyPolygon(polygon).area),
            "width":   float(pts[:, 0].max() - pts[:, 0].min()),
            "cx":      float(cx),
            "cy":      float(cy),
        }
        idx = len(self.slots)
        self.slots.append(new_slot)
        self.undo_stack.append({'type': 'add', 'idx': idx})
        self.selection = {idx}
        self.modified  = True

    def undo(self):
        if not self.undo_stack:
            return
        op = self.undo_stack.pop()

        if op['type'] == 'modify':
            self.slots[op['idx']]["polygon"] = op['polygon']
            self.selection = {op['idx']}

        elif op['type'] == 'multi_modify':
            for idx, poly in op['changes']:
                self.slots[idx]["polygon"] = poly
            self.selection = {idx for idx, _ in op['changes']}

        elif op['type'] == 'delete':
            for idx, slot in sorted(op['deleted']):
                self.slots.insert(min(idx, len(self.slots)), slot)
            self.selection = {idx for idx, _ in op['deleted']}

        elif op['type'] == 'add':
            idx = op['idx']
            if idx < len(self.slots):
                self.slots.pop(idx)
            self.selection.clear()

        self.modified = True

    def enter_add_mode(self):
        self.placement_mode = None if self.placement_mode == 'add' else 'add'
        self.copy_template  = None
        self.selection.clear()

    def enter_copy_mode(self):
        solo = self._solo
        if solo is None or solo >= len(self.slots):
            return
        poly = self.slots[solo]["polygon"]
        pts  = np.array(poly, dtype=np.float32)
        cx   = float(np.mean(pts[:, 0]))
        cy   = float(np.mean(pts[:, 1]))
        self.copy_template  = [[int(p[0] - cx), int(p[1] - cy)] for p in poly]
        self.placement_mode = 'copy'
        self.selection.clear()

    def exit_placement_mode(self):
        self.placement_mode = None
        self.copy_template  = None

    # ── rendering ─────────────────────────────────────────────────────────────

    def render(self):
        vis  = self.image.copy()
        solo = self._solo

        # slot fills + outlines + labels
        for i, slot in enumerate(self.slots):
            pts   = self._pts(i)
            color = (COLOR_SELECTED if i in self.selection
                     else COLOR_HOVER   if i == self.hover_slot
                     else COLOR_NORMAL)
            overlay = vis.copy()
            cv2.fillPoly(overlay, [pts], color)
            cv2.addWeighted(overlay, ALPHA, vis, 1 - ALPHA, 0, vis)
            cv2.polylines(vis, [pts], True, color, 2)
            cx = int(np.mean(pts[:, 0]))
            cy = int(np.mean(pts[:, 1]))
            cv2.putText(vis, slot["id"], (cx - 22, cy + 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0),       2, cv2.LINE_AA)
            cv2.putText(vis, slot["id"], (cx - 22, cy + 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

        # corner handles + edge-midpoint handles (solo-select only)
        if self.placement_mode is None and solo is not None and solo < len(self.slots):
            poly = self.slots[solo]["polygon"]
            n    = len(poly)

            # edge midpoint handles (drawn first, so corners render on top)
            for i in range(n):
                p1, p2 = poly[i], poly[(i + 1) % n]
                mx = int((p1[0] + p2[0]) / 2)
                my = int((p1[1] + p2[1]) / 2)
                hov  = (self.hover_ei == i)
                r    = EDGE_R + (2 if hov else 0)
                ecol = COLOR_EDGE_HOV if hov else COLOR_EDGE_DOT
                cv2.circle(vis, (mx, my), r,     (0, 0, 0), -1)
                cv2.circle(vis, (mx, my), r - 1, ecol,      -1)

            # corner handles
            for ci, (px, py) in enumerate(poly):
                hov  = (self.hover_ci == ci)
                hcol = COLOR_HANDLE_H if hov else COLOR_HANDLE
                cv2.circle(vis, (px, py), HANDLE_R,     (0, 0, 0), -1)
                cv2.circle(vis, (px, py), HANDLE_R - 2, hcol,      -1)

        # multi-select bounding box + resize handles (2+ selected, normal mode)
        if self.placement_mode is None and len(self.selection) >= 2:
            bbox = self._multi_bbox()
            if bbox:
                bx1, by1, bx2, by2 = bbox
                cv2.rectangle(vis, (bx1, by1), (bx2, by2), COLOR_SELECTED, 1)
                for hi, (hx, hy) in enumerate(self._multi_bbox_handles(bbox)):
                    hov  = (self.hover_hi == hi)
                    hcol = COLOR_HANDLE_H if hov else COLOR_HANDLE
                    r    = HANDLE_R + (2 if hov else 0)
                    cv2.circle(vis, (hx, hy), r,     (0, 0, 0), -1)
                    cv2.circle(vis, (hx, hy), r - 2, hcol,      -1)

        # rubber-band selection rectangle
        if self.drag_mode == 'rubber' and self.rubber_start and self.rubber_end:
            rx1 = min(self.rubber_start[0], self.rubber_end[0])
            ry1 = min(self.rubber_start[1], self.rubber_end[1])
            rx2 = max(self.rubber_start[0], self.rubber_end[0])
            ry2 = max(self.rubber_start[1], self.rubber_end[1])
            overlay = vis.copy()
            cv2.rectangle(overlay, (rx1, ry1), (rx2, ry2), (200, 200, 255), -1)
            cv2.addWeighted(overlay, 0.15, vis, 0.85, 0, vis)
            cv2.rectangle(vis, (rx1, ry1), (rx2, ry2), (200, 200, 255), 1)

        # placement-mode preview
        if self.placement_mode is not None:
            mx, my  = self.mouse_xy
            pre_pts = np.array(self._current_preview(mx, my), dtype=np.int32)
            overlay = vis.copy()
            cv2.fillPoly(overlay, [pre_pts], COLOR_ADD_PRE)
            cv2.addWeighted(overlay, 0.45, vis, 0.55, 0, vis)
            cv2.polylines(vis, [pre_pts], True, COLOR_ADD_PRE, 2)

        # apply zoom / pan viewport (before status bar so bar stays pinned)
        if self.zoom > 1.0 or self.pan_x != 0.0 or self.pan_y != 0.0:
            ih, iw = vis.shape[:2]
            vw = max(1, int(round(iw / self.zoom)))
            vh = max(1, int(round(ih / self.zoom)))
            x1 = max(0, int(self.pan_x))
            y1 = max(0, int(self.pan_y))
            vis = cv2.resize(vis[y1:min(ih, y1+vh), x1:min(iw, x1+vw)],
                             (iw, ih), interpolation=cv2.INTER_LINEAR)

        # status bar
        h, w  = vis.shape[:2]
        bar_h = 30
        zoom_txt = f"  |  {self.zoom:.1f}x" if self.zoom > 1.0 else ""

        if self.placement_mode == 'add':
            bar_color = (0, 100, 0)
            hint      = ("[ ADD MODE ]  Click=Place avg-size slot   "
                         "A/Esc=Exit   S/Enter=Save   Q=Discard")
        elif self.placement_mode == 'copy':
            bar_color = (100, 60, 0)
            hint      = ("[ COPY MODE ]  Click=Stamp copy   "
                         "C/Esc=Exit   S/Enter=Save   Q=Discard")
        else:
            bar_color = (30, 30, 30)
            n_sel     = len(self.selection)
            if n_sel == 0:
                sel_txt = ""
            elif n_sel == 1:
                sel_txt = f"  |  {self.slots[solo]['id']} selected"
            else:
                sel_txt = f"  |  {n_sel} slots selected"
            hint = (f"Slots: {len(self.slots)}{sel_txt}{zoom_txt}"
                    "   |   Scroll=Zoom  MidBtn=Pan  R=Reset"
                    "   |   D=Del  Z=Undo  A=Add  C=Copy  S=Save  Q=Discard")

        cv2.rectangle(vis, (0, h - bar_h), (w, h), bar_color, -1)
        cv2.putText(vis, hint, (8, h - 9),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.46, (200, 200, 200), 1, cv2.LINE_AA)
        return vis

    # ── main loop ─────────────────────────────────────────────────────────────

    def run(self):
        """Open the editor. Returns True if saved, False if discarded."""
        cv2.namedWindow(WIN, cv2.WINDOW_NORMAL)
        cv2.setMouseCallback(WIN, self.on_mouse)

        while True:
            cv2.imshow(WIN, self.render())
            key = cv2.waitKey(30) & 0xFF

            if key == 255:
                continue

            if self.placement_mode is not None:
                if   key in (ord('a'), ord('A')) and self.placement_mode == 'add':
                    self.exit_placement_mode()
                elif key in (ord('c'), ord('C')) and self.placement_mode == 'copy':
                    self.exit_placement_mode()
                elif key == 27:                           # Esc → leave placement mode
                    self.exit_placement_mode()
                elif key in (ord('s'), ord('S'), 13):    # S / Enter  save
                    cv2.destroyWindow(WIN)
                    return True
                elif key in (ord('q'), ord('Q')):         # Q  discard
                    cv2.destroyWindow(WIN)
                    return False
            else:
                if   key in (ord('d'), ord('D'), 127):   # D / Delete
                    self.delete_selected()
                elif key in (ord('z'), ord('Z')):          # Z  undo
                    self.undo()
                elif key in (ord('a'), ord('A')):          # A  add mode
                    self.enter_add_mode()
                elif key in (ord('c'), ord('C')):          # C  copy mode
                    self.enter_copy_mode()
                elif key in (ord('r'), ord('R')):          # R  reset zoom/pan
                    self.zoom  = 1.0
                    self.pan_x = 0.0
                    self.pan_y = 0.0
                elif key in (ord('s'), ord('S'), 13):     # S / Enter  save
                    cv2.destroyWindow(WIN)
                    return True
                elif key in (ord('q'), ord('Q'), 27):     # Q / Esc  discard
                    cv2.destroyWindow(WIN)
                    return False

    # ── persistence ───────────────────────────────────────────────────────────

    def save_json(self):
        for slot in self.slots:
            pts = np.array(slot["polygon"], dtype=np.float32)
            slot["cx"] = float(np.mean(pts[:, 0]))
            slot["cy"] = float(np.mean(pts[:, 1]))
            try:
                slot["area"] = float(ShapelyPolygon(slot["polygon"]).area)
            except Exception:
                pass
        os.makedirs(LAYOUT_DIR, exist_ok=True)
        path    = os.path.join(LAYOUT_DIR, f"{self.lot_id}_auto_slots.json")
        payload = {
            "lot_id":       self.lot_id,
            "total_slots":  len(self.slots),
            "image_width":  self.img_w,
            "image_height": self.img_h,
            "slots":        self.slots,
        }
        with open(path, "w") as f:
            json.dump(payload, f, indent=2)
        return path


# ══════════════════════════════════════════════════════════════════════════════
# Public API
# ══════════════════════════════════════════════════════════════════════════════

def run_editor(lot_id, image, img_w, img_h):
    layout_path = os.path.join(LAYOUT_DIR, f"{lot_id}_auto_slots.json")
    if not os.path.exists(layout_path):
        print(f"  [editor] Layout not found: {layout_path} — skipping.")
        return []

    with open(layout_path) as f:
        data = json.load(f)

    editor = SlotEditor(data.get("slots", []), image, lot_id, img_w, img_h)
    saved  = editor.run()

    if saved and editor.modified:
        path = editor.save_json()
        print(f"  [editor] Saved {len(editor.slots)} slot(s) → {path}")
    elif not saved:
        print("  [editor] Changes discarded.")
    else:
        print("  [editor] No changes made.")

    return editor.slots


# ══════════════════════════════════════════════════════════════════════════════
# Standalone CLI
# ══════════════════════════════════════════════════════════════════════════════

def _find_blueprint(lot_id):
    for ext in ("jpg", "jpeg", "png", "bmp", "tiff"):
        for pattern in (f"{lot_id}.{ext}", f"{lot_id}_*.{ext}"):
            m = _glob.glob(os.path.join(IMAGES_DIR, pattern))
            if m:
                return m[0]
    m = _glob.glob(os.path.join(IMAGES_DIR, f"{lot_id}*"))
    return m[0] if m else None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Interactive parking slot polygon editor.")
    parser.add_argument("--lot_id", required=True,
                        help="Lot ID  (loads data/layouts/<lot_id>_auto_slots.json)")
    parser.add_argument("--image",  default=None,
                        help="Blueprint image (auto-detected from data/blueprints/ if omitted)")
    args = parser.parse_args()

    img_path = args.image or _find_blueprint(args.lot_id)
    if not img_path or not os.path.exists(img_path):
        print(f"Error: no blueprint image found for '{args.lot_id}'.")
        print(f"  Searched: {IMAGES_DIR}/   Pass --image <path> to specify one.")
        raise SystemExit(1)

    img = cv2.imread(img_path)
    if img is None:
        print(f"Error: could not read image: {img_path}")
        raise SystemExit(1)

    img_h, img_w = img.shape[:2]
    print("=" * 60)
    print("  Slot Editor")
    print("=" * 60)
    print(f"  Layout : data/layouts/{args.lot_id}_auto_slots.json")
    print(f"  Image  : {img_path}  ({img_w}x{img_h})")
    print()
    run_editor(args.lot_id, img, img_w, img_h)
