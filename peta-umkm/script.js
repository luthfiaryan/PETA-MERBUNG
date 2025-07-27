import * as L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import {
  categoriesIconElementMap,
  createUmkmPopupHtml,
  getUmkmCategoryMarker as getCategoryMarker,
  tileLayers,
} from "../src/js/mapUtils";
import { control } from "leaflet";
import { icon } from "leaflet";
import { sendComplaint } from "../src/js/api";
import { clearComplainForm } from "../src/js/utils";

// new Categories grouping
const newCategories = {
  Fashion: "Fashion & Aksesoris",
  "Produk Makanan Berat": "Makanan & Minuman",
  Aksesoris: "Fashion & Aksesoris",
  "Produk Makanan Ringan": "Makanan & Minuman",
  Kerajinan: "Jasa",
  "Bahan Makanan": "Bahan Baku",
  "Produk Minuman": "Makanan & Minuman",
  Kelontong: "Makanan & Minuman",
  "Bahan Bangunan": "Lainnya",
  Otomotif: "Jasa",
  "Jasa Penjahit": "Jasa",
  "Produk Makanan dan Minuman": "Makanan & Minuman",
  "Minuman Herbal Tradisional": "Makanan & Minuman",
  "Minuman Tradisional": "Makanan & Minuman",
  "Produk Bumbu Masak": "Bahan Baku",
  "Produk Ikan Olahan": "Makanan & Minuman",
  "Bahan Pertanian": "Lainnya",
  Percetakan: "Lainnya",
  "Kebutuhan Hewan Peliharaan": "Lainnya",
  "Produk Makanan Berat dan Ringan": "Makanan & Minuman",
  "Produk Minuman Herbal": "Makanan & Minuman",
};

// --- CONFIGURATION & STATE ---

// An object to hold the application's state and centralize access to key variables.
const appState = {
  /**
   * @type {L.Map}
   */
  map: null,
  layerControl: null,
  umkmLayer: null,
  allUmkmData: null,
  merbungBoundary: null,
  searchTerm: "",
  searchTimeout: null,
  visibleMarker: {},
  categories: [
    { name: "Bahan Baku", isActive: true },
    { name: "Jasa", isActive: true },
    { name: "Makanan & Minuman", isActive: true },
    { name: "Fashion & Aksesoris", isActive: true },
    { name: "Lainnya", isActive: true },
  ],
  colors: {},
  routing: {
    control: null,
    startMarker: null,
    endMarker: null,
    startPoint: null,
    endPoint: null,
    selectingStart: false,
    selectingEnd: false,
    markericon: icon({ iconUrl: "/images/maps/marker-icon.png" }),
  },
};

// Generate a unique color for each category for the map legend and markers.
appState.categories.forEach(
  (c, i) => (appState.colors[c.name] = `hsl(${i * 20}, 70%, 50%)`)
);

// --- CORE FUNCTIONS ---

/**
 * Main function to initialize the application.
 */
async function initialize() {
  await loadData();
  setupMap();
  setupLegend();
  setupEventListeners();
  setupRouting();

  renderFilterButtons();
  applyFiltersAndRenderUMKM(); // Initial render of UMKM points
}

/**
 * Fetches all necessary GeoJSON data concurrently.
 */
async function loadData() {
  try {
    const [umkmRes, merbungRes] = await Promise.all([
      fetch("/data/umkm.geojson"),
      fetch("/data/merbung.geojson"),
    ]);

    // map to new categories
    const umkmData = await umkmRes.json();
    umkmData.features.forEach((feature) => {
      const properties = feature.properties;
      if (newCategories[properties.Jenis_UMKM]) {
        properties.Jenis_UMKM = newCategories[properties.Jenis_UMKM];
      }
    });

    appState.allUmkmData = umkmData;
    appState.merbungBoundary = await merbungRes.json();
  } catch (error) {
    console.error("Failed to load GeoJSON data:", error);
  }
}

/**
 * Initializes the Leaflet map, tiles, and boundary layer.
 */
function setupMap() {
  appState.map = L.map("map");

  tileLayers.OpenStreetMap.addTo(appState.map);

  appState.layerControl = control.layers(tileLayers, {}).addTo(appState.map);

  if (appState.merbungBoundary) {
    const boundaryLayer = L.geoJSON(appState.merbungBoundary, {
      style: { color: "red", weight: 2, fillOpacity: 0 },
    }).addTo(appState.map);
    appState.map.fitBounds(boundaryLayer.getBounds());
    appState.layerControl.addOverlay(boundaryLayer, "Batas Wilayah");
  }
}

/**
 * Filters UMKM data based on active categories and search term, then renders the results on the map.
 * Manages adding/removing the UMKM layer from the layer control.
 */
function applyFiltersAndRenderUMKM() {
  const activeCategories = appState.categories
    .filter((c) => c.isActive)
    .map((c) => c.name);

  const searchTerm = appState.searchTerm.toLowerCase();

  // Filter the master data source
  const filteredFeatures = appState.allUmkmData.features.filter((feature) => {
    const properties = feature.properties;
    const nameMatch = properties.ID.toLowerCase().includes(searchTerm);
    const categoryMatch = activeCategories.includes(properties.Jenis_UMKM);
    return nameMatch && categoryMatch;
  });

  // Remove the old layer if it exists
  if (appState.umkmLayer) {
    appState.map.removeLayer(appState.umkmLayer);
    appState.layerControl.removeLayer(appState.umkmLayer);
  }

  // render on search result
  const searchResultContainer = document.getElementById(
    "search-result-container"
  );
  searchResultContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();

  filteredFeatures.forEach((feature) => {
    const { ID, Jenis_UMKM, ALAMAT } = feature.properties;

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "btn btn-text btn-primary justify-start h-fit rounded-md text-left card-side max-w-sm";
    button.innerHTML = `
      <div class=" p-2 text-xs gap-0 text-left">
        <h5 class="relative wrap-break-word mb-1 text-base text-base-content font-bold">
          <span class="${categoriesIconElementMap[Jenis_UMKM]} inline-block align-middle size-4 mr-1"></span>${ID}
        </h5>
        <span class="badge mb-1 badge-outline badge-sm badge-primary">${Jenis_UMKM}</span>
        <p class="text-base-content">${ALAMAT}</p>
      </div>
    `;

    button.addEventListener("click", () => selectMarker(ID));

    const hr = document.createElement("hr");
    hr.className = "text-base-content/20";

    fragment.appendChild(button);
    fragment.appendChild(hr);
  });

  searchResultContainer.appendChild(fragment);

  // Create a new layer with only the filtered points
  function geoJSONToLayer(feature, latlng) {
    const marker = L.marker(latlng, {
      icon: getCategoryMarker(
        feature.properties.Jenis_UMKM,
        appState.colors[feature.properties.Jenis_UMKM]
      ),
      title: feature.properties.ID,
      riseOnHover: true,
    });
    appState.visibleMarker[feature.properties.ID] = marker;
    return marker;
  }

  appState.umkmLayer = L.geoJSON(
    { type: "FeatureCollection", features: filteredFeatures },
    {
      pointToLayer: geoJSONToLayer,
      onEachFeature: (feature, layer) => {
        const popupContent = createUmkmPopupHtml(feature.properties);
        layer.bindPopup(popupContent, {
          className: "marker-popup without-tip",
        });
      },
    }
  ).addTo(appState.map);

  appState.layerControl.addOverlay(appState.umkmLayer, "Lokasi UMKM");
}

// --- UI & EVENT HANDLING ---

/**
 * Renders the category filter buttons based on the current state.
 * Uses event delegation for handling clicks.
 */
function renderFilterButtons() {
  const filterDiv = document.getElementById("categoryFilter");
  const allFiltersSelected = appState.categories.every((c) => c.isActive);

  const allButtonIcon = allFiltersSelected
    ? "icon-[tabler--trash]"
    : "icon-[tabler--check]";
  const allButtonText = allFiltersSelected ? "Hapus Filter" : "Pilih Semua";
  const allButtonAction = allFiltersSelected ? "none" : "all";

  let buttonsHTML = `
    <button data-action="${allButtonAction}" class="badge shrink-0 badge-lg cursor-pointer relative badge-primary mr-2 rounded-full">
      <span class="${allButtonIcon} size-4.5"></span>
      ${allButtonText}
      <div class="border-l-2 border-base-content h-5 absolute right-0 translate-x-2.5"></div>
    </button>`;

  buttonsHTML += appState.categories
    .map((c) => {
      const activeClass = c.isActive ? "badge-primary" : "badge-outline";
      return `<button data-category="${c.name}" class="badge shrink-0 badge-lg cursor-pointer w-fit ${activeClass} rounded-full">${c.name}</button>`;
    })
    .join("");

  filterDiv.innerHTML = buttonsHTML;
}

/**
 * Sets up all event listeners for the page.
 */
function setupEventListeners() {
  const filterDiv = document.getElementById("categoryFilter");
  const searchInput = document.getElementById("search-umkm");
  const clearSearchButton = document.getElementById("clear-search-button");
  const searchIcon = document.getElementById("search-icon");
  const complaintForm = document.getElementById("complain-form-element");
  const formStatusSpan = document.getElementById("form-complain-status");

  // Listener for clear search button
  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    appState.searchTerm = "";
    applyFiltersAndRenderUMKM();
    searchIcon.dataset.icon = "search";
  });

  // Listener for search input
  searchInput.addEventListener("input", (e) => {
    appState.searchTerm = e.target.value;
    searchIcon.dataset.icon = appState.searchTerm ? "x" : "search";
    clearTimeout(appState.searchTimeout); // debounce
    appState.searchTimeout = setTimeout(() => applyFiltersAndRenderUMKM(), 400);
  });

  // Uses event delegation for all filter buttons
  filterDiv.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const categoryName = button.dataset.category;
    const action = button.dataset.action;

    if (action) {
      // Handle "Pilih Semua" / "Hapus Filter"
      const selectAll = action === "all";
      appState.categories.forEach((c) => (c.isActive = selectAll));
    } else if (categoryName) {
      // Handle individual category toggle
      const category = appState.categories.find((c) => c.name === categoryName);
      if (category) {
        category.isActive = !category.isActive;
      }
    }

    renderFilterButtons();
    applyFiltersAndRenderUMKM();
  });

  HSOverlay.autoInit();

  const { element: modal } = HSOverlay.getInstance("#form-complain", true);
  modal.on("close", clearComplainForm);
  window.openComplainForm = (complainee) => {
    setTimeout(() => {
      document.getElementById("umkm_name").value = complainee;
    }, 100);
    formStatusSpan.innerHTML = "";
    modal.open();
  };

  // Listener for complaint form submission
  complaintForm.addEventListener("submit", handleComplainSubmit);

  /**
   * @param {SubmitEvent} event
   */
  async function handleComplainSubmit(event) {
    const submitButton = document.getElementById("form-complain-submit-button");

    event.preventDefault();
    const formData = new FormData(event.target);
    formData.get;

    /**
     * @type {import("../src/js/api").Complaint}
     */
    const complaintObject = {
      name: formData.get("name") || "",
      email: formData.get("email") || "",
      phoneNumber: formData.get("phone") || "",
      complaintCategory: "UMKM",
      complainee: formData.get("umkm_name"),
      subject: formData.get("complaint_subject"),
      complaintText: formData.get("complaint_text"),
    };

    if (!complaintObject.subject) {
      formStatusSpan.className = "text-error";
      formStatusSpan.innerHTML = "Judul Keluhan tidak boleh kosong!";
      return;
    }

    if (!complaintObject.complaintText) {
      formStatusSpan.className = "text-error";
      formStatusSpan.innerHTML = "Isi Keluhan tidak boleh kosong!";
      return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = "Mengirim";

    if (await sendComplaint(complaintObject)) {
      formStatusSpan.className = "text-success";
      formStatusSpan.innerHTML = `
        Keluhan berhasil dikirim!
        <div class="radial-progress auto-close-modal text-primary" style="--value:100; --size:1rem; --thickness:3px" role="progressbar" aria-label="Radial Progress"></div>`;
      clearComplainForm();
      setTimeout(() => {
        modal.close();
        formStatusSpan.innerHTML = "";
        submitButton.disabled = false;
      }, 3000);
    } else {
      formStatusSpan.innerHTML = "Gagal mengirim keluhan. Silakan coba lagi.";
    }

    submitButton.innerHTML = "Kirim";
  }
}

/**
 * to be called when selecting a location from the search result.
 * @param {string} id
 */
function selectMarker(id) {
  const marker = appState.visibleMarker[id];

  if (marker) {
    const latlng = structuredClone(marker.getLatLng());
    latlng.lat += 0.001; // Adjust latitude slightly to avoid marker overlap
    marker.openPopup();
    appState.map.flyTo(latlng, 18, { duration: 1 });
    document.getElementById("close-search")?.click();
  } else {
    console.warn(`Marker with ID ${id} not found.`);
  }
}

/**
 * Creates and adds the map legend.
 */
function setupLegend() {
  const legendDiv = document.getElementById("legend-content");
  let content = `<div class="h-full">`;
  for (const cat of appState.categories) {
    content += `
    <div class="flex items-center gap-1">
      <span style="background:${appState.colors[cat.name]}" class="size-4 ${
      categoriesIconElementMap[cat.name]
    }"></span>
      <span>${cat.name}</span>
    </div>
    `;
  }
  legendDiv.innerHTML = content + "</div>";
}

// --- ROUTING ---

/**
 * Encapsulates all logic and event listeners for the routing feature.
 */
function setupRouting() {
  const { routing } = appState;

  // --- UI Bindings ---
  document.getElementById("routeToggleBtn").addEventListener("click", () => {
    const panel = document.getElementById("routingPanel");
    panel.style.display =
      panel.style.display === "none" || panel.style.display === ""
        ? "block"
        : "none";
  });

  document.getElementById("initalPointBtn").addEventListener("click", () => {
    routing.selectingStart = true;
    routing.selectingEnd = false;
    alert("Klik di peta untuk titik awal");
  });

  document.getElementById("endPointBtn").addEventListener("click", () => {
    routing.selectingEnd = true;
    routing.selectingStart = false;
    alert("Klik di peta untuk titik tujuan");
  });

  document.getElementById("initalResetBtn").addEventListener("click", () => {
    if (routing.startMarker) appState.map.removeLayer(routing.startMarker);
    routing.startMarker = null;
    routing.startPoint = null;
  });

  document.getElementById("endResetBtn").addEventListener("click", () => {
    if (routing.endMarker) appState.map.removeLayer(routing.endMarker);
    routing.endMarker = null;
    routing.endPoint = null;
  });

  document.getElementById("findRouteBtn").addEventListener("click", findRoute);

  // --- Map Interaction ---
  appState.map.on("click", (e) => {
    if (routing.selectingStart) {
      if (routing.startMarker) appState.map.removeLayer(routing.startMarker);
      routing.startPoint = e.latlng;
      routing.startMarker = L.marker(routing.startPoint, {
        icon: routing.markericon,
      }).addTo(appState.map);
      routing.selectingStart = false;
    } else if (routing.selectingEnd) {
      if (routing.endMarker) appState.map.removeLayer(routing.endMarker);
      routing.endPoint = e.latlng;
      routing.endMarker = L.marker(routing.endPoint, {
        icon: routing.markericon,
      }).addTo(appState.map);
      routing.selectingEnd = false;
    }
  });

  // --- Route Calculation ---
  function findRoute() {
    if (!routing.startPoint || !routing.endPoint) {
      alert("Tentukan titik awal dan tujuan.");
      return;
    }
    if (routing.control) appState.map.removeControl(routing.control);

    routing.control = L.Routing.control({
      waypoints: [routing.startPoint, routing.endPoint],
      lineOptions: { styles: [{ color: "green", weight: 4 }] },
      routeWhileDragging: false,
      createMarker: () => null, // Use our own markers
    }).addTo(appState.map);

    routing.control.on("routesfound", (e) => {
      const summary = e.routes[0].summary;
      const duration = Math.round(summary.totalTime / 60);
      const distance = (summary.totalDistance / 1000).toFixed(2);
      document.getElementById(
        "routeInfo"
      ).innerText = `Durasi: ${duration} menit | Jarak: ${distance} km`;
    });
  }
}

// --- INITIALIZATION ---
// Start the application once the DOM is ready.
document.addEventListener("DOMContentLoaded", initialize);
