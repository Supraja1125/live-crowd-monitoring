import cv2
import json
import os

zones = []                 
selected_zone_index = None 
drawing = False            
start_x, start_y = -1, -1  
current_frame = None       


def set_current_frame(frame):
    """
    Called from main loop to update the frame used by mouse callback.
    """
    global current_frame
    current_frame = frame


def load_zones(path="zones.json"):
    """
    Loads zones from JSON file if it exists.
    """
    global zones
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                zones = json.load(f)
            print(f"📂 Loaded {len(zones)} zones from {path}")
        except Exception as e:
            print(" Error loading zones:", e)
            zones = []
    else:
        zones = []
        print("No zones.json found, starting with empty zones")
    return zones


def save_zones(path="zones.json"):
    """
    Saves current zones list to JSON file.
    """
    try:
        with open(path, "w") as f:
            json.dump(zones, f, indent=4)
        print(f"✅ Zones saved to {path}")
    except Exception as e:
        print(" Error saving zones:", e)


def draw_all_zones(frame):
    """
    Draws all saved zones on the given frame.
    Highlights the selected zone (if any).
    """
    for i, z in enumerate(zones):
        color = (255,0, 0)  # blue
        thickness = 2
        if i == selected_zone_index:
            color = (255, 255, 0)  # cyan for selected
            thickness = 3

        cv2.rectangle(
            frame,
            (z["x1"], z["y1"]),
            (z["x2"], z["y2"]),
            color,
            thickness,
        )
        cv2.putText(
            frame,
            f"Z{i + 1}",
            (z["x1"], max(z["y1"] - 5, 15)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            color,
            2,
        )


def mouse_draw(event, x, y, flags, param):
    """
    Mouse callback:
    - Drag left button to draw a new rectangle zone.
    """
    global drawing, start_x, start_y, zones, current_frame

    if current_frame is None:
        return

    # Start drawing
    if event == cv2.EVENT_LBUTTONDOWN:
        drawing = True
        start_x, start_y = x, y

    # While moving, show a preview rectangle
    elif event == cv2.EVENT_MOUSEMOVE and drawing:
        temp = current_frame.copy()
        cv2.rectangle(temp, (start_x, start_y), (x, y), (0, 255, 0), 2)
        draw_all_zones(temp)
        cv2.imshow("CrowdCount - Milestone 1", temp)

    # On release, store the rectangle as a zone
    elif event == cv2.EVENT_LBUTTONUP:
        drawing = False
        new_zone = {
            "x1": min(start_x, x),
            "y1": min(start_y, y),
            "x2": max(start_x, x),
            "y2": max(start_y, y),
        }
        zones.append(new_zone)
        print("➕ Zone added:", new_zone)


def select_zone_by_number(num):
    """
    Select a zone using number 1..9 (from keyboard).
    """
    global selected_zone_index
    idx = num - 1
    if 0 <= idx < len(zones):
        selected_zone_index = idx
        print(f" Selected Zone {num}: {zones[idx]}")
    else:
        print(f" Zone {num} does not exist")


def delete_selected_zone():
    """
    Delete currently selected zone.
    """
    global zones, selected_zone_index
    if selected_zone_index is None:
        print(" No zone selected to delete")
        return
    removed = zones.pop(selected_zone_index)
    print("🗑 Deleted zone:", removed)
    selected_zone_index = None
