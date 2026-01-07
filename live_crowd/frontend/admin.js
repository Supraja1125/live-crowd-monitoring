let crowdAlertShown = false;

/* ================= AUTH ================= */
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
  window.location.href = "login.html";
}

/* ================= SECTION SWITCH ================= */
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ================= CHARTS ================= */
const peopleChart = new Chart(document.getElementById("peopleChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "People",
      data: [],
      borderColor: "#c084fc",
      tension: 0.4
    }]
  },
  options: { animation: false }
});

const zoneChart = new Chart(document.getElementById("zoneChart"), {
  type: "bar",
  data: {
    labels: ["Zone 1", "Zone 2", "Zone 3"],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ["#a855f7", "#c084fc", "#7c3aed"]
    }]
  },
  options: { animation: false }
});

/* ================= REAL HEATMAP (CANVAS) ================= */
function drawHeatmap(zones) {
  const canvas = document.getElementById("heatmapCanvas");
  if (!canvas) return;

  canvas.width = 700;
  canvas.height = 280;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const max = Math.max(...zones, 1);

  const leftMargin = 80;
  const topMargin = 40;
  const blockHeight = 140;
  const gap = 24;

  const blockWidth =
    (canvas.width - leftMargin - gap * (zones.length + 1)) / zones.length;

  /* ================= ZONE BLOCKS ================= */
  zones.forEach((count, i) => {
    const intensity = count / max;

    let color = "#22c55e";            // Low
    if (intensity >= 0.7) color = "#dc2626";      // High
    else if (intensity >= 0.4) color = "#facc15"; // Medium

    const x = leftMargin + gap + i * (blockWidth + gap);
    const y = topMargin;

    // Block
    ctx.fillStyle = color;
    ctx.fillRect(x, y, blockWidth, blockHeight);

    // Count (centered)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Segoe UI";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(count, x + blockWidth / 2, y + blockHeight / 2);

    // Zone label (perfectly centered below)
    ctx.font = "14px Segoe UI";
    ctx.textBaseline = "top";
    ctx.fillText(
      `Zone ${i + 1}`,
      x + blockWidth / 2,
      y + blockHeight + 18
    );
  });

  /* ================= LEFT INTENSITY SCALE ================= */
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "13px Segoe UI";

  ctx.fillText("High", 12, topMargin + 10);
  ctx.fillText("Medium", 12, topMargin + blockHeight / 2);
  ctx.fillText("Low", 12, topMargin + blockHeight - 10);

  /* ================= LEGEND (BOTTOM CENTER) ================= */
  const legendY = canvas.height - 18;
  const legendStartX = canvas.width / 2 - 120;

  const legend = [
    { label: "Low", color: "#22c55e" },
    { label: "Medium", color: "#facc15" },
    { label: "High", color: "#dc2626" }
  ];

  legend.forEach((item, i) => {
    const lx = legendStartX + i * 90;

    ctx.fillStyle = item.color;
    ctx.fillRect(lx, legendY - 10, 16, 10);

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Segoe UI";
    ctx.textAlign = "left";
    ctx.fillText(item.label, lx + 22, legendY - 2);
  });
}


/* ================= LIVE UPDATE ================= */
async function updateAdmin() {
  const res = await fetch("http://127.0.0.1:5000/dashboard", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  // TEXT
  document.getElementById("total").innerText = data.people;
  document.getElementById("status").innerText = data.status;

  const z1 = data.zones.zone1;
  const z2 = data.zones.zone2;
  const z3 = data.zones.zone3;

  document.getElementById("z1").innerText = z1;
  document.getElementById("z2").innerText = z2;
  document.getElementById("z3").innerText = z3;

  // BAR CHART
  zoneChart.data.datasets[0].data = [z1, z2, z3];
  zoneChart.update();

  // LINE CHART
  if (data.history.length) {
    const last = data.history[data.history.length - 1];
    if (peopleChart.data.labels.at(-1) !== last.time) {
      peopleChart.data.labels.push(last.time);
      peopleChart.data.datasets[0].data.push(last.count);

      if (peopleChart.data.labels.length > 15) {
        peopleChart.data.labels.shift();
        peopleChart.data.datasets[0].data.shift();
      }
      peopleChart.update();
    }
  }

  // REAL HEATMAP
  drawHeatmap([z1, z2, z3]);

  // ANALYTICS
  const counts = data.history.map(h => h.count);
  document.getElementById("peak").innerText = Math.max(...counts);
  document.getElementById("avg").innerText =
    Math.round(counts.reduce((a, b) => a + b, 0) / (counts.length || 1));

  const dom = Math.max(z1, z2, z3);
  document.getElementById("dominant").innerText =
    dom === z1 ? "Zone 1" : dom === z2 ? "Zone 2" : "Zone 3";

  // USER INFO
  document.getElementById("roleInfo").innerText = role;
  document.getElementById("loginTime").innerText = new Date().toLocaleTimeString();

  // AFTER fetching data
if (data.status === "CROWDED" && !crowdAlertShown) {
  alert(" ⚠ Crowd limit exceeded!");
  crowdAlertShown = true;
}

if (data.status !== "CROWDED") {
  crowdAlertShown = false;
}

}

setInterval(updateAdmin, 2000);

/* ================= ACTIONS ================= */
function setThreshold() {
  fetch("http://127.0.0.1:5000/admin/threshold", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threshold: document.getElementById("threshold").value })
  });
}

function exportCSV() {
  window.open("http://127.0.0.1:5000/export/csv", "_blank");
}

function exportPDF() {
  window.open("http://127.0.0.1:5000/export/pdf", "_blank");
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
const hourlyChart = new Chart(document.getElementById("hourlyChart"), {
  type: "line",
  data: {
    labels: [...Array(24).keys()].map(h => h + ":00"),
    datasets: [{
      label: "Avg Crowd",
      data: Array(24).fill(0),
      borderColor: "#38bdf8",
      tension: 0.4
    }]
  },
  options: { animation: false }
});
const weeklyChart = new Chart(document.getElementById("weeklyChart"), {
  type: "bar",
  data: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{
      label: "Avg Crowd",
      data: Array(7).fill(0),
      backgroundColor: "#a855f7"
    }]
  },
  options: { animation: false }
});

async function loadAnalytics() {
  const res = await fetch("http://127.0.0.1:5000/analytics", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  // Hourly
  hourlyChart.data.datasets[0].data =
    Object.values(data.hourly);
  hourlyChart.update();

  // Weekly
  weeklyChart.data.datasets[0].data =
    Object.values(data.weekly);
  weeklyChart.update();
}
// loadAnalytics();
setInterval(loadAnalytics, 5000);
