import json, numpy as np, cv2

for name in ["uni", "parking", "chatgpt"]:
    with open("output/lines/" + name + ".json") as f:
        d = json.load(f)
    roi = d.get("roi") or d.get("roi_polygon")
    pts = np.array(roi, dtype=np.float32)
    print("--- " + name + " ---")
    print("ROI points (" + str(len(roi)) + "): " + str(roi))

    hull = cv2.convexHull(pts.astype(np.int32))
    hull_pts = hull.reshape(-1, 2).astype(np.float32)
    print("Hull points: " + str(hull_pts.tolist()))

    s = hull_pts.sum(axis=1)
    dx = hull_pts[:, 0] - hull_pts[:, 1]
    tl = hull_pts[np.argmin(s)]
    tr = hull_pts[np.argmax(dx)]
    br = hull_pts[np.argmax(s)]
    bl = hull_pts[np.argmin(dx)]
    print("TL=" + str(tl.tolist()) + " TR=" + str(tr.tolist()) + " BR=" + str(br.tolist()) + " BL=" + str(bl.tolist()))

    w = int(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl)))
    h = int(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr)))
    print("Warp size: w=" + str(w) + " h=" + str(h) + "  -> " + ("PORTRAIT" if h > w else "landscape"))

    # Also show what approxPolyDP gives
    for eps in [0.02, 0.05, 0.08, 0.12, 0.18]:
        approx = cv2.approxPolyDP(hull, eps * cv2.arcLength(hull, True), True)
        if len(approx) == 4:
            q = approx.reshape(4, 2).astype(np.float32)
            s2 = q.sum(axis=1)
            dx2 = q[:, 0] - q[:, 1]
            tl2 = q[np.argmin(s2)]
            tr2 = q[np.argmax(dx2)]
            br2 = q[np.argmax(s2)]
            bl2 = q[np.argmin(dx2)]
            w2 = int(max(np.linalg.norm(tr2 - tl2), np.linalg.norm(br2 - bl2)))
            h2 = int(max(np.linalg.norm(bl2 - tl2), np.linalg.norm(br2 - tr2)))
            print("  approxPolyDP eps=" + str(eps) + " -> 4pts w=" + str(w2) + " h=" + str(h2) + " TL=" + str(tl2.tolist()) + " TR=" + str(tr2.tolist()))
            break
    print()
