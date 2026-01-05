import cv2
import json
import requests
from ultralytics import YOLO
import numpy as np

API_URL = "http://127.0.0.1:5000/update"

model = YOLO("yolov8n.pt")
cap = cv2.VideoCapture(0)

with open("zones.json") as f:
    ZONES = json.load(f)

assert 3 <= len(ZONES) <= 7, "Zones must be between 3 and 7"

def point_in_polygon(point, polygon):
    return cv2.pointPolygonTest(np.array(polygon, np.int32), point, False) >= 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    zone_counts = {z["id"]: 0 for z in ZONES}

    results = model(frame, classes=[0])

    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cx = int((x1 + x2) / 2)
        cy = int((y1 + y2) / 2)

        for z in ZONES:
            if point_in_polygon((cx, cy), z["points"]):
                zone_counts[z["id"]] += 1
                break

        cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)

    for z in ZONES:
        pts = np.array(z["points"], np.int32)
        cv2.polylines(frame, [pts], True, (255, 255, 0), 2)
        cx = int(np.mean(pts[:,0]))
        cy = int(np.mean(pts[:,1]))
        cv2.putText(frame, z["id"], (cx, cy),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

    payload = {"people": sum(zone_counts.values()), **zone_counts}
    requests.post(API_URL, json=payload)

    cv2.imshow("Zone-based People Counting", frame)
    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()
