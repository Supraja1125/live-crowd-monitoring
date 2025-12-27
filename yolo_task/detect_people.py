from ultralytics import YOLO
import os

# Load YOLOv8 model
model = YOLO("yolov8n.pt")

image_folder = "images"
results_list = []

for image_name in os.listdir(image_folder):
    image_path = os.path.join(image_folder, image_name)

    results = model.predict(image_path, conf=0.4)

    people_count = 0

    for box in results[0].boxes:
        cls = int(box.cls[0])
        label = model.names[cls]

        if label == "person":
            people_count += 1

    print(f"{image_name} - {people_count} persons detected")
    results_list.append(f"{image_name},{people_count}")

# Optional: Save results to CSV
with open("results.csv", "w") as file:
    file.write("Image,People_Count\n")
    for line in results_list:
        file.write(line + "\n")
