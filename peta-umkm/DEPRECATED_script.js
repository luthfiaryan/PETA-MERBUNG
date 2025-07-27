import * as L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { marker } from "leaflet";
import { getCategoryMarker } from "../src/js/mapUtils";

const res = await fetch("/data/umkm.geojson");
const UMKMGeoJSON = await res.json();
console.log("🚀 ~ UMKMGeoJSON:", UMKMGeoJSON);

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

const categories = [
  { name: "Fashion", isActive: true },
  { name: "Produk Makanan Berat", isActive: true },
  { name: "Aksesoris", isActive: true },
  { name: "Produk Makanan Ringan", isActive: true },
  { name: "Kerajinan", isActive: true },
  { name: "Bahan Makanan", isActive: true },
  { name: "Produk Minuman", isActive: true },
  { name: "Kelontong", isActive: true },
  { name: "Bahan Bangunan", isActive: true },
  { name: "Otomotif", isActive: true },
  { name: "Jasa Penjahit", isActive: true },
  { name: "Produk Makanan dan Minuman", isActive: true },
  { name: "Minuman Herbal Tradisional", isActive: true },
  { name: "Minuman Tradisional", isActive: true },
  { name: "Produk Bumbu Masak", isActive: true },
  { name: "Produk Ikan Olahan", isActive: true },
  { name: "Bahan Pertanian", isActive: true },
  { name: "Percetakan", isActive: true },
  { name: "Kebutuhan Hewan Peliharaan", isActive: true },
];

const colors = {};
categories.forEach((c, i) => (colors[c.name] = `hsl(${i * 20}, 70%, 50%)`));

// Buat tombol kategori
const filterDiv = document.getElementById("categoryFilter");
let allFilterSelected = true;
function redrawFilterButtons() {
  filterDiv.innerHTML =
    `<button onclick="handleCategoryClick(${
      allFilterSelected ? "'none'" : "'all'"
    })"  class="badge shrink-0 badge-lg cursor-pointer relative badge-primary mr-2 rounded-full" data-category="all">
      <span class="${
        allFilterSelected ? "icon-[tabler--trash]" : "icon-[tabler--check]"
      } size-4.5"></span>
    ${allFilterSelected ? "Hapus Filter" : "Pilih Semua"}
    <div class="border-l-1 border-base-content h-5 absolute right-0 translate-x-2.5"></div>
    </button>` +
    categories
      .map(
        (c) =>
          `<button onclick="handleCategoryClick('${
            c.name
          }')" class="badge shrink-0 badge-lg cursor-pointer w-fit ${
            c.isActive ? "badge-primary" : "badge-outline"
          }  rounded-full" data-category="${c.isActive}">${c.name}</button>`
      )
      .join("");
}

redrawFilterButtons();

let umkmLayer = L.geoJSON(UMKMGeoJSON, {
  pointToLayer: (f, latlng) =>
    marker(latlng, {
      icon: getCategoryMarker(
        f.properties.Jenis_UMKM,
        colors[f.properties.Jenis_UMKM]
      ),
      title: f.properties.ID,
      riseOnHover: true,
    }),
  onEachFeature: (f, l) =>
    l.bindPopup(
      `<b>${f.properties.ID}</b><br>Jenis: ${f.properties.Jenis_UMKM}<br>Alamat: ${f.properties.ALAMAT}`
    ),
}).addTo(map);

// Filter kategori
window.handleCategoryClick = (categoryData) => {
  if (categoryData === "all" || categoryData === "none") {
    categories.forEach((c) => (c.isActive = categoryData === "all"));
    allFilterSelected = categoryData === "all";
    redrawFilterButtons();
    umkmLayer.eachLayer((layer) => {
      layer.setStyle({
        opacity: categoryData === "all" ? 1 : 0.2,
        fillOpacity: categoryData === "all" ? 0.8 : 0.2,
      });
    });
    return;
  }
  const category = categories.find((c) => c.name === categoryData);
  if (!category) return;

  category.isActive = !category.isActive;
  checkIsAllCategoriesActive();
  redrawFilterButtons();

  umkmLayer.eachLayer((layer) => {
    if (layer.feature.properties.Jenis_UMKM === category.name)
      layer.setOpacity(category.isActive ? 1 : 0.2);
  });
};

function checkIsAllCategoriesActive() {
  allFilterSelected = categories.every((c) => c.isActive);
}

// Pencarian nama UMKM
document.getElementById("search-umkm").addEventListener("input", function () {
  const term = this.value.toLowerCase();
  umkmLayer.eachLayer((layer) => {
    const match = layer.feature.properties.ID.toLowerCase().includes(term);
    layer.setOpacity(match ? 1 : 0.2);
  });
});

// Legenda
const legend = L.control({ position: "bottomleft" });
legend.onAdd = () => {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = `<b>Legenda UMKM</b><br>`;
  for (const k of categories)
    div.innerHTML += `<i style="background:${colors[k.name]}"></i>${
      k.name
    }<br>`;
  div.innerHTML += `<i style="background:#7f8c8d"></i>Lainnya`;
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
