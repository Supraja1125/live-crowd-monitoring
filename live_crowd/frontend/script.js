const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

/* LINE CHART */
const peopleChart = new Chart(
  document.getElementById("peopleChart"),
  {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "People",
        data: [],
        borderColor: "#c084fc",
        backgroundColor: "rgba(192,132,252,0.2)",
        tension: 0.4
      }]
    },
    options: {
      animation: false,
      scales: { y: { beginAtZero: true } }
    }
  }
);

/* BAR CHART */
const zoneChart = new Chart(
  document.getElementById("zoneChart"),
  {
    type: "bar",
    data: {
      labels: ["Zone 1", "Zone 2", "Zone 3"],
      datasets: [{
        label: "Zones",
        data: [0, 0, 0],
        backgroundColor: ["#a855f7", "#c084fc", "#7c3aed"]
      }]
    },
    options: {
      animation: false,
      scales: { y: { beginAtZero: true } }
    }
  }
);

/* HEATMAP */
const heatmapChart = new Chart(
  document.getElementById("heatmapChart"),
  {
    type: "bubble",
    data: { datasets: [{ data: [] }] },
    options: {
      animation: false,
      scales: {
        x: { min: 0, max: 100, display: false },
        y: { min: 0, max: 100, display: false }
      }
    }
  }
);

async function updateData() {
  const res = await fetch("http://127.0.0.1:5000/dashboard", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  // TEXT
  document.getElementById("total").innerText = data.people;
  document.getElementById("status").innerText = data.status;
  document.getElementById("status").className =
    data.status === "CROWDED" ? "big crowded" : "big safe";

  const z1 = data.zones.zone1;
  const z2 = data.zones.zone2;
  const z3 = data.zones.zone3;

  document.getElementById("z1").innerText = z1;
  document.getElementById("z2").innerText = z2;
  document.getElementById("z3").innerText = z3;

  // BAR CHART
  zoneChart.data.datasets[0].data = [z1, z2, z3];
  zoneChart.update();

  // LINE CHART (IMPORTANT FIX)
  if (data.history.length > 0) {
    const last = data.history[data.history.length - 1];

    if (
      peopleChart.data.labels.length === 0 ||
      peopleChart.data.labels[peopleChart.data.labels.length - 1] !== last.time
    ) {
      peopleChart.data.labels.push(last.time);
      peopleChart.data.datasets[0].data.push(last.count);

      if (peopleChart.data.labels.length > 15) {
        peopleChart.data.labels.shift();
        peopleChart.data.datasets[0].data.shift();
      }
      peopleChart.update();
    }
  }

  // HEATMAP
  heatmapChart.data.datasets[0].data = [
    { x: 20, y: 50, r: 10 + z1 * 2 },
    { x: 50, y: 50, r: 10 + z2 * 2 },
    { x: 80, y: 50, r: 10 + z3 * 2 }
  ];
  heatmapChart.update();
}

setInterval(updateData, 2000);

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
