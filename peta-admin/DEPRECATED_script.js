import * as L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

const map = L.map("map").setView([-7.72, 110.59], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

// Batas Merbung dan atur view sesuai batasnya
fetch("/data/merbung.geojson")
  .then((r) => r.json())
  .then((d) => {
    const merbungLayer = L.geoJSON(d, {
      style: { color: "red", weight: 2, fillOpacity: 0 },
    }).addTo(map);
    map.fitBounds(merbungLayer.getBounds());
  });

// RTRW Krapyak & Perum (biru) - popup keterangan
["/data/rtrwkrapyak.geojson", "/data/rtrwperum.geojson"].forEach((url) => {
  fetch(url)
    .then((r) => r.json())
    .then((d) => {
      L.geoJSON(d, {
        style: { color: "blue", weight: 2, fillOpacity: 0.2 },
        onEachFeature: (f, l) =>
          l.bindPopup(
            `<b>RTRW:</b> ${f.properties.RT_RW || "Tidak ada keterangan"}`
          ),
      }).addTo(map);
    });
});

// RTRW Merbung (ungu) - popup keterangan
fetch("/data/rtrwmerbung.geojson")
  .then((r) => r.json())
  .then((d) => {
    L.geoJSON(d, {
      style: { color: "purple", weight: 2, fillOpacity: 0.2 },
      onEachFeature: (f, l) =>
        l.bindPopup(
          `<b>RTRW:</b> ${f.properties.RT_RW || "Tidak ada keterangan"}`
        ),
    }).addTo(map);
  });

// Legenda
const legend = L.control({ position: "bottomleft" });
legend.onAdd = () => {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = `<b>Legenda</b><br>
        <i style="background:red"></i>Batas Desa<br>
        <i style="background:blue"></i>RTRW Krapyak & Perum<br>
        <i style="background:purple"></i>RTRW Merbung`;
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
