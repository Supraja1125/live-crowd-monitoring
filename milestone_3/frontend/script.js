const totalEl = document.getElementById("total");
const statusEl = document.getElementById("status");

const lineChart = new Chart(
  document.getElementById("lineChart"),
  { type: "line", data: { labels: [], datasets: [{ label: "People Count", data: [] }] } }
);

const barChart = new Chart(
  document.getElementById("barChart"),
  { type: "bar", data: { labels: [], datasets: [{ label: "Zone Count", data: [] }] } }
);

const heatmap = document.getElementById("heatmap");
const hctx = heatmap.getContext("2d");

async function fetchData() {
  const res = await fetch("http://127.0.0.1:5000/get_count");
  const data = await res.json();

  totalEl.innerText = data.people;
  statusEl.innerText = data.status;

  lineChart.data.labels = data.history.map(h => h.time);
  lineChart.data.datasets[0].data = data.history.map(h => h.count);
  lineChart.update();

  barChart.data.labels = Object.keys(data.zones);
  barChart.data.datasets[0].data = Object.values(data.zones);
  barChart.update();

  drawHeatmap(data.people);
}

function drawHeatmap(count) {
  hctx.clearRect(0,0,800,200);
  let intensity = Math.min(count * 5, 255);
  hctx.fillStyle = `rgb(${intensity},50,50)`;
  hctx.fillRect(0,0,800,200);
}

function setThreshold() {
  const val = document.getElementById("thresholdInput").value;
  fetch("http://127.0.0.1:5000/set_threshold", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({threshold: val})
  });
}

function downloadCSV() {
  window.location.href = "http://127.0.0.1:5000/export/csv";
}

function downloadPDF() {
  window.location.href = "http://127.0.0.1:5000/export/pdf";
}

setInterval(fetchData, 1000);
