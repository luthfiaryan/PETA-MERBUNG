import * as L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

const map = L.map("map").setView([-7.72, 110.59], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

// Batas Merbung
fetch("/data/merbung.geojson")
  .then((r) => r.json())
  .then((data) => {
    const batas = L.geoJSON(data, {
      style: { color: "red", weight: 2, fillOpacity: 0 },
    }).addTo(map);
    map.fitBounds(batas.getBounds());
  });

const colors = {
  masjid: "#2ecc71",
  sekolah: "#3498db",
  poskampling: "#e67e22",
  tps: "#e74c3c",
  makam: "#34495e",
};
const files = [
  { file: "masjid.geojson", category: "masjid" },
  { file: "sekolah.geojson", category: "sekolah" },
  { file: "poskampling.geojson", category: "poskampling" },
  { file: "tps.geojson", category: "tps" },
  { file: "makam.geojson", category: "makam" },
];

let allData = [];
let fasumLayer;

function loadLayer(cat = "all") {
  if (fasumLayer) map.removeLayer(fasumLayer);
  const filtered = {
    type: "FeatureCollection",
    features:
      cat === "all"
        ? allData
        : allData.filter((f) => f.properties._category === cat),
  };
  fasumLayer = L.geoJSON(filtered, {
    pointToLayer: (f) =>
      L.circleMarker([f.geometry.coordinates[1], f.geometry.coordinates[0]], {
        radius: 8,
        fillColor: colors[f.properties._category],
        color: "#fff",
        weight: 1,
        fillOpacity: 0.8,
      }),
    onEachFeature: (f, l) => l.bindPopup(`<b>${f.properties.Nama}</b>`),
  }).addTo(map);
}

Promise.all(
  files.map((item) => fetch("/data/" + item.file).then((r) => r.json()))
).then((datasets) => {
  datasets.forEach((d, i) =>
    d.features.forEach((f) => (f.properties._category = files[i].category))
  );
  allData = datasets.flatMap((d) => d.features);
  loadLayer();
});

document.querySelectorAll(".category-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document
      .querySelectorAll(".category-btn")
      .forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    loadLayer(this.getAttribute("data-category"));
  });
});

const legend = L.control({ position: "bottomleft" });
legend.onAdd = () => {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = `<b>Legenda Fasilitas Umum</b><br>
        <i style="background:${colors.masjid}"></i>Masjid<br>
        <i style="background:${colors.sekolah}"></i>Sekolah<br>
        <i style="background:${colors.poskampling}"></i>Poskampling<br>
        <i style="background:${colors.tps}"></i>TPS<br>
        <i style="background:${colors.makam}"></i>Makam`;
  return div;
};
legend.addTo(map);

// Routing
let routingControl,
  startMarker,
  endMarker,
  startPoint,
  endPoint,
  selectingStart = false,
  selectingEnd = false;

function toggleRoutingPanel() {
  const panel = document.getElementById("routingPanel");
  panel.style.display =
    panel.style.display === "none" || panel.style.display === ""
      ? "block"
      : "none";
}

document
  .getElementById("routeToggleBtn")
  .addEventListener("click", toggleRoutingPanel);

function setStart() {
  selectingStart = true;
  selectingEnd = false;
  alert("Klik di peta untuk titik awal");
}

document.getElementById("initalPointBtn").addEventListener("click", setStart);

function setEnd() {
  selectingEnd = true;
  selectingStart = false;
  alert("Klik di peta untuk titik tujuan");
}

document.getElementById("endPointBtn").addEventListener("click", setEnd);

map.on("click", function (e) {
  if (selectingStart) {
    if (startMarker) map.removeLayer(startMarker);
    startPoint = e.latlng;
    startMarker = L.marker(startPoint).addTo(map);
    selectingStart = false;
  } else if (selectingEnd) {
    if (endMarker) map.removeLayer(endMarker);
    endPoint = e.latlng;
    endMarker = L.marker(endPoint).addTo(map);
    selectingEnd = false;
  }
});

function resetStart() {
  if (startMarker) map.removeLayer(startMarker);
  startMarker = null;
  startPoint = null;
}

document.getElementById("initalResetBtn").addEventListener("click", resetStart);

function resetEnd() {
  if (endMarker) map.removeLayer(endMarker);
  endMarker = null;
  endPoint = null;
}

document.getElementById("endResetBtn").addEventListener("click", resetEnd);

function findRoute() {
  if (!startPoint || !endPoint) {
    alert("Tentukan titik awal dan tujuan.");
    return;
  }
  if (routingControl) map.removeControl(routingControl);

  routingControl = L.Routing.control({
    waypoints: [startPoint, endPoint],
    lineOptions: { styles: [{ color: "green", weight: 4 }] },
    routeWhileDragging: false,
    createMarker: () => null,
  }).addTo(map);

  routingControl.on("routesfound", function (e) {
    const duration = Math.round(e.routes[0].summary.totalTime / 60);
    const distance = (e.routes[0].summary.totalDistance / 1000).toFixed(2);
    document.getElementById(
      "routeInfo"
    ).innerText = `Durasi: ${duration} menit | Jarak: ${distance} km`;
  });
}

document.getElementById("findRouteBtn").addEventListener("click", findRoute);
