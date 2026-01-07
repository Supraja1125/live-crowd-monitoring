const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

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

/* ================= REAL HEATMAP ================= */
function drawHeatmap(zones) {
  const canvas = document.getElementById("heatmapCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const max = Math.max(...zones, 1);
  const blockWidth = canvas.width / zones.length;
  const blockHeight = 140;
  const topOffset = 30;

  // ---- DRAW ZONES ----
  zones.forEach((count, i) => {
    const intensity = count / max;

    let color = "#22c55e";      // Low
    if (intensity >= 0.7) color = "#dc2626";       // High
    else if (intensity >= 0.4) color = "#facc15"; // Medium

    // Block
    ctx.fillStyle = color;
    ctx.fillRect(
      i * blockWidth + 12,
      topOffset,
      blockWidth - 24,
      blockHeight
    );

    // Count
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Segoe UI";
    ctx.textAlign = "base-line";
    ctx.fillText(
      count,
      i * blockWidth + blockWidth / 2,
      topOffset + blockHeight / 2
    );

    // Zone label
    // ctx.font = "14px Segoe UI";
    // ctx.fillText(
    //   `Zone ${i + 1}`,
    //   i * blockWidth + blockWidth / 2,
    //   topOffset + blockHeight + 28
    // );
  });

  // ---- INTENSITY SCALE (LEFT) ----
  // ctx.textAlign = "left";
  // ctx.fillStyle = "#c4b5fd";
  // ctx.font = "13px Segoe UI";

  // ctx.fillText("High", 5, topOffset + 18);
  // ctx.fillText("Medium", 5, topOffset + blockHeight / 2 + 6);
  // ctx.fillText("Low", 5, topOffset + blockHeight + 6);

  // ---- LEGEND (BOTTOM) ----
  const legendY = canvas.height - 10;
  const legendX = canvas.width / 2 - 120;

  const legend = [
    { label: "Low", color: "#22c55e" },
    { label: "Medium", color: "#facc15" },
    { label: "High", color: "#dc2626" }
  ];

  legend.forEach((item, i) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(legendX + i * 90, legendY - 10, 18, 10);

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Segoe UI";
    ctx.fillText(item.label, legendX + i * 90 + 24, legendY);
  });
}

/* ================= UPDATE ================= */
async function updateData() {
  const res = await fetch("http://127.0.0.1:5000/dashboard", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  document.getElementById("total").innerText = data.people;
  document.getElementById("status").innerText = data.status;

  const z1 = data.zones.zone1;
  const z2 = data.zones.zone2;
  const z3 = data.zones.zone3;

  document.getElementById("z1").innerText = z1;
  document.getElementById("z2").innerText = z2;
  document.getElementById("z3").innerText = z3;

  zoneChart.data.datasets[0].data = [z1, z2, z3];
  zoneChart.update();

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

  drawHeatmap([z1, z2, z3]);
}

setInterval(updateData, 2000);

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
