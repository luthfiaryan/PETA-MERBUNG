import * as L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { createAdminPopupHtml, tileLayers } from "../src/js/mapUtils";
import { clearComplainForm } from "../src/js/utils";
import { sendComplaint } from "../src/js/api";

// --- CONFIGURATION & STATE ---

const appState = {
  /** @type {L.Map} */
  map: null,
  layerControl: null,
  merbungBoundary: null,
  allMerbungData: null,
  allKrapyakData: null,
  allPerumData: null,
  merbungLayer: null,
  krapyakPerumLayer: null,
  searchTerm: "",
  searchTimeout: null,
  visibleLayers: {},
  categories: [], // Will be populated dynamically with RW values
  colors: {
    Merbung: {
      base: "rgba(219, 195, 13, 0.2)", // Yellow
      hover: "rgba(219, 175, 13, 0.7)",
    },
    "Krapyak & Perum": {
      base: "rgba(13, 157, 219, 0.15)", // Blue
      hover: "rgba(13, 157, 219, 0.7)",
    },
  },
  routing: {
    control: null,
    startMarker: null,
    endMarker: null,
    startPoint: null,
    endPoint: null,
    selectingStart: false,
    selectingEnd: false,
    markericon: L.icon({ iconUrl: "/images/maps/marker-icon.png" }),
  },
};

// --- CORE FUNCTIONS ---

/**
 * Main function to initialize the application.
 */
async function initialize() {
  await loadData();
  extractRwCategories(); // Dynamically create categories from data
  setupMap();
  setupLegend();
  setupEventListeners();
  setupRouting();
  renderFilterButtons();
  applyFiltersAndRenderRegions();
}

/**
 * Fetches all necessary GeoJSON data concurrently.
 */
async function loadData() {
  try {
    const [merbungBoundaryRes, merbungRes, krapyakRes, perumRes] =
      await Promise.all([
        fetch("/data/merbung.geojson"),
        fetch("/data/rtrwmerbung.geojson"),
        fetch("/data/rtrwkrapyak.geojson"),
        fetch("/data/rtrwperum.geojson"),
      ]);
    appState.merbungBoundary = await merbungBoundaryRes.json();
    appState.allMerbungData = await merbungRes.json();
    appState.allKrapyakData = await krapyakRes.json();
    appState.allPerumData = await perumRes.json();
  } catch (error) {
    console.error("Failed to load GeoJSON data:", error);
  }
}

/**
 * Extracts unique RW values from the loaded data to create filter categories.
 */
function extractRwCategories() {
  const allFeatures = [
    ...appState.allMerbungData.features,
    ...appState.allKrapyakData.features,
    ...appState.allPerumData.features,
  ];
  const rwValues = new Set(allFeatures.map((f) => f.properties.RW));
  const sortedRw = Array.from(rwValues).sort((a, b) => a - b);

  appState.categories = sortedRw.map((rw) => ({
    name: `RW ${String(rw).padStart(2, "0")}`,
    value: rw,
    isActive: true,
  }));
}

/**
 * Initializes the Leaflet map, tiles, and boundary layer.
 */
function setupMap() {
  appState.map = L.map("map");
  tileLayers.OpenStreetMap.addTo(appState.map);
  appState.layerControl = L.control.layers(tileLayers, {}).addTo(appState.map);

  if (appState.merbungBoundary) {
    const boundaryLayer = L.geoJSON(appState.merbungBoundary, {
      style: { color: "red", weight: 2, fillOpacity: 0, interactive: false },
    }).addTo(appState.map);
    appState.map.fitBounds(boundaryLayer.getBounds());
    appState.layerControl.addOverlay(boundaryLayer, "Batas Desa");
  }
}

/**
 * Filters and renders administrative regions based on active RW categories and search term.
 */
function applyFiltersAndRenderRegions() {
  const activeRwValues = appState.categories
    .filter((c) => c.isActive)
    .map((c) => c.value);
  const searchTerm = appState.searchTerm.toLowerCase().replace(/\s+/g, "");

  // Clear previous layers
  if (appState.merbungLayer) {
    appState.map.removeLayer(appState.merbungLayer);
    appState.layerControl.removeLayer(appState.merbungLayer);
  }
  if (appState.krapyakPerumLayer) {
    appState.map.removeLayer(appState.krapyakPerumLayer);
    appState.layerControl.removeLayer(appState.krapyakPerumLayer);
  }
  appState.visibleLayers = {};

  const searchResultContainer = document.getElementById(
    "search-result-container"
  );
  searchResultContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();

  // Helper function to process and add layers
  const processAndAddLayer = (
    geojsonDataFeatures,
    layerName,
    styleConfig,
    groupName
  ) => {
    const filteredFeatures = geojsonDataFeatures.filter((feature) => {
      const rtRw =
        feature.properties.RT_RW?.toLowerCase().replace(/\s+/g, "") || "";
      const rwValue = feature.properties.RW;
      return activeRwValues.includes(rwValue) && rtRw.includes(searchTerm);
    });

    if (filteredFeatures.length === 0) return;

    const getOnEachFeature = (groupName) => (feature, layer) => {
      const { RT_RW } = feature.properties;
      appState.visibleLayers[RT_RW] = layer;

      layer.bindPopup(createAdminPopupHtml(feature.properties, groupName), {
        className: "marker-popup",
      });
      layer.on({
        mouseover: (e) =>
          e.target.setStyle({ fillColor: styleConfig.hover, weight: 2.5 }),
        mouseout: (e) =>
          e.target.setStyle({ fillColor: styleConfig.base, weight: 2 }),
      });

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "btn btn-text btn-primary justify-start h-fit rounded-md text-left card-side max-w-sm";
      button.innerHTML = `
        <div class="p-2 gap-0 text-left">
          <div class="text-xs flex flex-row gap-2 items-center text-left">
          <span class="icon-[tabler--building-community] inline-block align-middle size-8 mr-1"></span>
          <div class="">
            <h5 class="relative wrap-break-word mb-1 text-base text-base-content font-bold">${RT_RW}</h5>
            <span class="badge mb-1 badge-outline badge-sm badge-primary">${groupName}</span>
          </div>
          </div>
        </div>`;
      button.addEventListener("click", () => selectRegion(RT_RW));
      fragment.appendChild(button);
      const hr = document.createElement("hr");
      hr.className = "text-base-content/20";
      fragment.appendChild(hr);
    };

    const newLayer = L.geoJSON(
      { type: "FeatureCollection", features: filteredFeatures },
      {
        style: {
          color: styleConfig.hover,
          weight: 2,
          fillOpacity: 1,
          fillColor: styleConfig.base,
        },
        onEachFeature: getOnEachFeature(groupName), // function currying to pass the group name
      }
    ).addTo(appState.map);

    appState[layerName] = newLayer;
    appState.layerControl.addOverlay(newLayer, groupName);
  };

  // Process Merbung
  processAndAddLayer(
    appState.allMerbungData.features,
    "merbungLayer",
    appState.colors.Merbung,
    "Merbung"
  );

  // Process Krapyak & Perum
  processAndAddLayer(
    [...appState.allKrapyakData.features, ...appState.allPerumData.features],
    "krapyakPerumLayer",
    appState.colors["Krapyak & Perum"],
    "Krapyak & Perum"
  );

  searchResultContainer.appendChild(fragment);
}

// --- UI & EVENT HANDLING ---

/**
 * Renders the RW category filter buttons.
 */
function renderFilterButtons() {
  const filterDiv = document.getElementById("categoryFilter");
  const allSelected = appState.categories.every((c) => c.isActive);

  const allButtonIcon = allSelected
    ? "icon-[tabler--trash]"
    : "icon-[tabler--check]";
  const allButtonText = allSelected ? "Hapus Filter" : "Pilih Semua";
  const allButtonAction = allSelected ? "none" : "all";

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
 * Sets up all application event listeners.
 */
function setupEventListeners() {
  const searchInput = document.getElementById("search-admin");
  const clearSearchButton = document.getElementById("clear-search-button");
  const searchIcon = document.getElementById("search-icon");
  const filterDiv = document.getElementById("categoryFilter");
  const complaintForm = document.getElementById("complain-form-element");
  const formStatusSpan = document.getElementById("form-complain-status");

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    appState.searchTerm = "";
    applyFiltersAndRenderRegions();
    searchIcon.dataset.icon = "search";
  });

  searchInput.addEventListener("input", (e) => {
    appState.searchTerm = e.target.value;
    searchIcon.dataset.icon = appState.searchTerm ? "x" : "search";
    clearTimeout(appState.searchTimeout);
    appState.searchTimeout = setTimeout(applyFiltersAndRenderRegions, 400);
  });

  filterDiv.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;
    const { category, action } = button.dataset;

    if (action) {
      const selectAll = action === "all";
      appState.categories.forEach((c) => (c.isActive = selectAll));
    } else if (category) {
      const cat = appState.categories.find((c) => c.name === category);
      if (cat) cat.isActive = !cat.isActive;
    }
    renderFilterButtons();
    applyFiltersAndRenderRegions();
  });

  HSOverlay.autoInit();

  const { element: modal } = HSOverlay.getInstance("#form-complain", true);
  modal.on("close", clearComplainForm);
  window.openComplainForm = (complainee) => {
    setTimeout(() => {
      document.getElementById("region_name").value = complainee;
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
      complaintCategory: "Administrasi",
      complainee: formData.get("region_name"),
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
 * Flies to a selected region and opens its popup.
 * @param {string} rtRw - The RT/RW identifier of the region.
 */
function selectRegion(rtRw) {
  const layer = appState.visibleLayers[rtRw];
  if (layer) {
    appState.map.flyToBounds(layer.getBounds(), { paddingTopLeft: [384, 0] });
    layer.openPopup();
    document.getElementById("close-search")?.click();
  }
}

/**
 * Creates and adds the map legend to the designated div.
 */
function setupLegend() {
  const legendDiv = document.getElementById("legend-content");
  let content = `<div class="p-2 space-y-1">
    <div class="flex items-center gap-2">
      <div style="background-color: ${appState.colors.Merbung.base}; border: 2px solid ${appState.colors.Merbung.hover};" class="size-4 rounded"></div>
      <span>Merbung</span>
    </div>
    <div class="flex items-center gap-2">
      <div style="background-color: ${appState.colors["Krapyak & Perum"].base}; border: 2px solid ${appState.colors["Krapyak & Perum"].hover};" class="size-4 rounded"></div>
      <span>Krapyak & Perum</span>
    </div>
    <div class="flex items-center gap-2">
      <div style="background-color: red;" class="h-1 w-4 rounded"></div>
      <span>Batas Desa</span>
    </div>
  </div>`;
  legendDiv.innerHTML = content;
}

// --- ROUTING ---

/**
 * Encapsulates all logic and event listeners for the routing feature.
 */
function setupRouting() {
  const { routing } = appState;

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

  function findRoute() {
    if (!routing.startPoint || !routing.endPoint) {
      alert("Tentukan titik awal dan tujuan.");
      return;
    }
    if (routing.control) appState.map.removeControl(routing.control);

    routing.control = L.Routing.control({
      waypoints: [routing.startPoint, routing.endPoint],
      lineOptions: { styles: [{ color: "blue", weight: 5, opacity: 0.8 }] },
      routeWhileDragging: false,
      createMarker: () => null,
    }).addTo(appState.map);

    routing.control.on("routesfound", (e) => {
      const { totalTime, totalDistance } = e.routes[0].summary;
      const duration = Math.round(totalTime / 60);
      const distance = (totalDistance / 1000).toFixed(2);
      document.getElementById(
        "routeInfo"
      ).innerText = `Durasi: ${duration} menit | Jarak: ${distance} km`;
    });
  }
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", initialize);
