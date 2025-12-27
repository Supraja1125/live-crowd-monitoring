from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import pandas as pd
import time
import os
from reportlab.pdfgen import canvas

app = Flask(__name__)
CORS(app)

LOG_FILE = "data_log.csv"
ALERT_THRESHOLD = 50

live_data = {
    "people": 0,
    "zones": {},
    "status": "SAFE",
    "history": []
}

if not os.path.exists(LOG_FILE):
    pd.DataFrame(columns=["time", "people"]).to_csv(LOG_FILE, index=False)

@app.route("/get_count")
def get_count():
    return jsonify(live_data)

@app.route("/update", methods=["POST"])
def update():
    global live_data
    data = request.json

    total = data["people"]
    zones = {k: v for k, v in data.items() if k.startswith("zone")}
    status = "CROWDED" if total >= ALERT_THRESHOLD else "SAFE"
    timestamp = time.strftime("%H:%M:%S")

    live_data["people"] = total
    live_data["zones"] = zones
    live_data["status"] = status
    live_data["history"].append({"time": timestamp, "count": total})
    live_data["history"] = live_data["history"][-20:]

    df = pd.read_csv(LOG_FILE)
    df.loc[len(df)] = [timestamp, total]
    df.to_csv(LOG_FILE, index=False)

    return {"status": "ok"}

@app.route("/set_threshold", methods=["POST"])
def set_threshold():
    global ALERT_THRESHOLD
    ALERT_THRESHOLD = int(request.json["threshold"])
    return {"threshold": ALERT_THRESHOLD}

@app.route("/export/csv")
def export_csv():
    return send_file(LOG_FILE, as_attachment=True)

@app.route("/export/pdf")
def export_pdf():
    pdf = "report.pdf"
    c = canvas.Canvas(pdf)
    c.drawString(50, 750, "Crowd Monitoring Report")
    c.drawString(50, 720, f"Total People: {live_data['people']}")
    c.drawString(50, 700, f"Status: {live_data['status']}")

    y = 660
    for z, v in live_data["zones"].items():
        c.drawString(50, y, f"{z}: {v}")
        y -= 20

    c.save()
    return send_file(pdf, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
