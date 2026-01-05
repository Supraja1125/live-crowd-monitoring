const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
  window.location.href = "login.html";
}

/* SECTION SWITCH */
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* CHARTS */
const peopleChart = new Chart(document.getElementById("peopleChart"), {
  type: "line",
  data: { labels: [], datasets: [{ label: "People", data: [], borderColor:"#c084fc", tension:0.4 }] },
  options: { animation:false }
});

const zoneChart = new Chart(document.getElementById("zoneChart"), {
  type: "bar",
  data: {
    labels: ["Zone 1", "Zone 2", "Zone 3"],
    datasets: [{ data: [0,0,0], backgroundColor:["#a855f7","#c084fc","#7c3aed"] }]
  },
  options: { animation:false }
});

const heatmapChart = new Chart(document.getElementById("heatmapChart"), {
  type: "bubble",
  data: { datasets: [{ data: [] }] },
  options: {
    animation:false,
    scales:{ x:{display:false}, y:{display:false} }
  }
});

/* LIVE UPDATE */
async function updateAdmin() {
  const res = await fetch("http://127.0.0.1:5000/dashboard", {
    headers: { Authorization:`Bearer ${token}` }
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

  zoneChart.data.datasets[0].data = [z1,z2,z3];
  zoneChart.update();

  heatmapChart.data.datasets[0].data = [
    {x:20,y:50,r:10+z1*2},
    {x:50,y:50,r:10+z2*2},
    {x:80,y:50,r:10+z3*2}
  ];
  heatmapChart.update();

  if (data.history.length) {
    const last = data.history[data.history.length-1];
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

  /* ANALYTICS */
  const counts = data.history.map(h => h.count);
  document.getElementById("peak").innerText = Math.max(...counts);
  document.getElementById("avg").innerText =
    Math.round(counts.reduce((a,b)=>a+b,0)/counts.length || 0);

  const dom = Math.max(z1,z2,z3);
  document.getElementById("dominant").innerText =
    dom === z1 ? "Zone 1" : dom === z2 ? "Zone 2" : "Zone 3";

  /* USER INFO */
  document.getElementById("roleInfo").innerText = role;
  document.getElementById("loginTime").innerText = new Date().toLocaleTimeString();
}

setInterval(updateAdmin, 2000);

/* ACTIONS */
function setThreshold() {
  fetch("http://127.0.0.1:5000/admin/threshold", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ threshold: document.getElementById("threshold").value })
  });
}

function exportCSV() {
  window.open("http://127.0.0.1:5000/export/csv","_blank");
}
function exportPDF() {
  window.open("http://127.0.0.1:5000/export/pdf", "_blank");
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
