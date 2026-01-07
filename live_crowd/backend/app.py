from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import jwt, datetime, csv

app = Flask(__name__)
CORS(app)
app.config["SECRET_KEY"] = "crowd-secret"

THRESHOLD = 20
DATA = {
    "people": 0,
    "zones": {"zone1": 0, "zone2": 0, "zone3": 0},
    "status": "SAFE",
    "alert": False,
    "history": []
}

USERS = {
    "admin": {"password": "admin25", "role": "admin"},
    "user": {"password": "user25", "role": "user"}
}

# ---------- AUTH ----------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = USERS.get(data.get("username"))

    if not user or user["password"] != data.get("password"):
        return jsonify({"msg": "Invalid credentials"}), 401

    token = jwt.encode({
        "user": data["username"],
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }, app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({"token": token, "role": user["role"]})


def verify_token(req):
    auth = req.headers.get("Authorization")
    if not auth:
        return None
    try:
        return jwt.decode(auth.split()[1], app.config["SECRET_KEY"], algorithms=["HS256"])
    except:
        return None


# ---------- UPDATE FROM CAMERA ----------
@app.route("/admin/update", methods=["POST"])
def update():
    global DATA
    payload = request.json
    print("RECEIVED FROM MAIN:", payload) 

    DATA["people"] = payload.get("people", 0)
    DATA["zones"] = {k: payload[k] for k in payload if k.startswith("zone")}
    DATA["status"] = "CROWDED" if DATA["people"] >= THRESHOLD else "SAFE"
    DATA["alert"] = DATA["people"] >= THRESHOLD

    DATA["history"].append({
        "time": datetime.datetime.now().strftime("%H:%M:%S"),
        "count": DATA["people"]
    })

    # keep last 100 points only (safe)
    DATA["history"] = DATA["history"][-100:]

    return {"ok": True}


# ---------- DASHBOARD (ADMIN + USER) ----------
@app.route("/dashboard", methods=["GET"])
def dashboard():
    user = verify_token(request)
    if not user:
        return jsonify({"msg": "Unauthorized"}), 401
    return jsonify(DATA)


# ---------- THRESHOLD ----------
@app.route("/admin/threshold", methods=["POST"])
def threshold():
    global THRESHOLD
    THRESHOLD = int(request.json.get("threshold", THRESHOLD))
    return {"threshold": THRESHOLD}


# ---------- EXPORT ----------
@app.route("/export/pdf")
def export_pdf():
    file_name = "crowd_report.pdf"
    c = canvas.Canvas(file_name, pagesize=A4)

    width, height = A4
    y = height - 40

    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, y, "Live Crowd Monitoring Report")

    y -= 30
    c.setFont("Helvetica", 12)
    c.drawString(50, y, f"Generated At: {datetime.datetime.now()}")

    y -= 30
    c.drawString(50, y, f"Total People: {DATA['people']}")
    y -= 20
    c.drawString(50, y, f"Status: {DATA['status']}")
    y -= 20
    c.drawString(50, y, f"Threshold: {THRESHOLD}")

    y -= 30
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "Zone-wise Count")

    c.setFont("Helvetica", 12)
    y -= 20
    for z, v in DATA["zones"].items():
        c.drawString(70, y, f"{z.upper()} : {v}")
        y -= 20

    y -= 20
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "Recent Crowd History")

    c.setFont("Helvetica", 10)
    y -= 20
    for h in DATA["history"][-10:]:
        c.drawString(70, y, f"{h['time']}  →  {h['count']} people")
        y -= 15
        if y < 50:
            c.showPage()
            y = height - 50

    c.save()
    return send_file(file_name, as_attachment=True)

@app.route("/export/csv")
def export_csv():
    with open("data_log.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Time", "People"])
        for h in DATA["history"]:
            writer.writerow([h["time"], h["count"]])
    return send_file("data_log.csv", as_attachment=True)
@app.route("/analytics", methods=["GET"])
def analytics():
    user = verify_token(request)
    if not user:
        return jsonify({"msg": "Unauthorized"}), 401

    hourly = {str(h): [] for h in range(24)}
    weekly = {"Mon":[], "Tue":[], "Wed":[], "Thu":[], "Fri":[], "Sat":[], "Sun":[]}

    for h in DATA["history"]:
        t = datetime.datetime.strptime(h["time"], "%H:%M:%S")
        hourly[str(t.hour)].append(h["count"])
        weekly[t.strftime("%a")].append(h["count"])

    hourly_avg = {
        h: round(sum(v)/len(v), 2) if v else 0
        for h, v in hourly.items()
    }

    weekly_avg = {
        d: round(sum(v)/len(v), 2) if v else 0
        for d, v in weekly.items()
    }

    return jsonify({
        "hourly": hourly_avg,
        "weekly": weekly_avg
    })


if __name__ == "__main__":
    app.run(debug=True)