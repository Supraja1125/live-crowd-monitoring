import cv2
import requests
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
from shapely.geometry import Point, Polygon

from camera_feed import start_camera, read_frame, stop_camera
from zones import load_zones, draw_all_zones, mouse_draw, set_current_frame

BACKEND_URL = "http://127.0.0.1:5000/update"

def main():
    zones = load_zones()
    assert 3 <= len(zones) <= 7, "Zones must be between 3 and 7"

    zone_polygons = [
        Polygon([(z["x1"], z["y1"]), (z["x2"], z["y1"]),
                 (z["x2"], z["y2"]), (z["x1"], z["y2"])])
        for z in zones
    ]

    cap = start_camera("camvideo.mp4")
    cv2.namedWindow("Crowd Monitoring")
    cv2.setMouseCallback("Crowd Monitoring", mouse_draw)

    model = YOLO("yolov8n.pt")
    tracker = DeepSort(max_age=30)

    while True:
        frame = read_frame(cap)
        if frame is None:
            break

        set_current_frame(frame)
        draw_all_zones(frame)

        zone_counts = [0] * len(zone_polygons)

        results = model(frame, classes=[0], conf=0.5)[0]
        detections = []

        if results.boxes:
            for box in results.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                detections.append(([x1, y1, x2 - x1, y2 - y1], conf, "person"))

        tracks = tracker.update_tracks(detections, frame=frame)

        for track in tracks:
            if not track.is_confirmed():
                continue

            x1, y1, x2, y2 = map(int, track.to_ltrb())
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            point = Point(cx, cy)

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
            cv2.circle(frame, (cx, cy), 4, (0,0,255), -1)

            for i, zone in enumerate(zone_polygons):
                if zone.contains(point):
                    zone_counts[i] += 1
                    break

        payload = {"people": sum(zone_counts)}
        for i, c in enumerate(zone_counts):
            payload[f"zone{i+1}"] = c

        try:
            requests.post(BACKEND_URL, json=payload, timeout=0.2)
        except:
            pass

        cv2.imshow("Crowd Monitoring", frame)
        if cv2.waitKey(30) & 0xFF == ord('q'):
            break

    stop_camera(cap)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
