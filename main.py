import cv2
import requests
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
from shapely.geometry import Point, Polygon

from camera_feed import start_camera, read_frame, stop_camera
from zones import load_zones, draw_all_zones, mouse_draw, set_current_frame

# BACKEND_URL = "http://127.0.0.1:5000/update"
BACKEND_URL = "http://127.0.0.1:5000/admin/update"
def main():
    zones = load_zones()
    assert 3 <= len(zones) <= 7, "Zones must be between 3 and 7"

    polygons = [
        Polygon([
            (z["x1"], z["y1"]),
            (z["x2"], z["y1"]),
            (z["x2"], z["y2"]),
            (z["x1"], z["y2"])
        ]) for z in zones
    ]

    cap = start_camera("camvideo.mp4")
    model = YOLO("yolov8n.pt")
    tracker = DeepSort(max_age=30)

    cv2.namedWindow("Crowd")
    cv2.setMouseCallback("Crowd", mouse_draw)

    while True:
        frame = read_frame(cap)
        if frame is None:
            break

        set_current_frame(frame)
        draw_all_zones(frame)

        zone_counts = [0] * len(polygons)

        results = model(frame, classes=[0], conf=0.5)[0]
        detections = []

        if results.boxes:
            for b in results.boxes:
                x1, y1, x2, y2 = map(int, b.xyxy[0])
                detections.append(([x1, y1, x2 - x1, y2 - y1], float(b.conf[0]), "person"))

        tracks = tracker.update_tracks(detections, frame=frame)

        for t in tracks:
            if not t.is_confirmed():
                continue

            x1, y1, x2, y2 = map(int, t.to_ltrb())
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            p = Point(cx, cy)

            for i, poly in enumerate(polygons):
                if poly.contains(p):
                    zone_counts[i] += 1
                    break

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)

        payload = {"people": sum(zone_counts)}
        for i, c in enumerate(zone_counts):
            payload[f"zone{i+1}"] = c

        try:
            print("POSTING:", payload)
            requests.post(BACKEND_URL, json=payload, timeout=0.2)
        except Exception as e:
            print("POST FAILED:", e)

        cv2.imshow("Crowd", frame)
        if cv2.waitKey(30) & 0xFF == ord("q"):
            break

    stop_camera(cap)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
