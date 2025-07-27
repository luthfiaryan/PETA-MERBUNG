import * as L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import {
  createFasumPopupHtml,
  fasumCategoriesIconElementMap,
  getFasumCategoryMarker,
  tileLayers,
} from "../src/js/mapUtils"; // Assuming mapUtils.js is in this path
import { control } from "leaflet";
import { icon } from "leaflet";
import { clearComplainForm } from "../src/js/utils";
import { sendComplaint } from "../src/js/api";

// --- CONFIGURATION & STATE ---

// An object to hold the application's state and centralize access to key variables.
const appState = {
  /** @type {L.Map} */
  map: null,
  layerControl: null,
  fasumLayer: null,
  allFasumData: null,
  merbungBoundary: null,
  searchTerm: "",
  searchTimeout: null,
  visibleMarkers: {},
  categories: [
    { name: "masjid", file: "masjid.geojson", isActive: true },
    { name: "tps", file: "tps.geojson", isActive: true },
    { name: "sekolah", file: "sekolah.geojson", isActive: true },
    { name: "poskampling", file: "poskampling.geojson", isActive: true },
    { name: "makam", file: "makam.geojson", isActive: true },
  ],
  colors: {
    masjid: "#2ecc71",
    sekolah: "#3498db",
    poskampling: "#e67e22",
    tps: "#e74c3c",
    makam: "#34495e",
  },
  routing: {
    control: null,
    startMarker: null,
    endMarker: null,
    startPoint: null,
    endPoint: null,
    selectingStart: false,
    selectingEnd: false,
    markerIcon: icon({ iconUrl: "/images/maps/marker-icon.png" }), // Make sure you have a marker icon at this path
  },
};

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
  applyFiltersAndRenderFasum(); // Initial render of public facilities
}

/**
 * Fetches all necessary GeoJSON data concurrently.
 */
async function loadData() {
  try {
    const dataSources = appState.categories.map((cat) =>
      fetch(`/data/${cat.file}`).then((res) => res.json())
    );
    const boundarySource = fetch("/data/merbung.geojson").then((res) =>
      res.json()
    );

    const [boundaryData, ...featureDatasets] = await Promise.all([
      boundarySource,
      ...dataSources,
    ]);

    appState.merbungBoundary = boundaryData;

    // Add a category property to each feature and flatten the array
    featureDatasets.forEach((dataset, index) => {
      const categoryName = appState.categories[index].name;
      dataset.features.forEach(
        (feature) => (feature.properties._category = categoryName)
      );
    });

    appState.allFasumData = {
      type: "FeatureCollection",
      features: featureDatasets.flatMap((d) => d.features),
    };

    console.log(
      "🚀 ~ All GeoJSON data loaded and combined:",
      appState.allFasumData
    );
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
 * Filters facility data based on active categories and search term, then renders the results on the map.
 */
function applyFiltersAndRenderFasum() {
  const activeCategories = appState.categories
    .filter((c) => c.isActive)
    .map((c) => c.name);
  const searchTerm = appState.searchTerm.toLowerCase();

  const filteredFeatures = appState.allFasumData.features.filter((feature) => {
    const props = feature.properties;
    const nameMatch = props.Nama.toLowerCase().includes(searchTerm);
    const categoryMatch = activeCategories.includes(props._category);
    return nameMatch && categoryMatch;
  });

  if (appState.fasumLayer) {
    appState.map.removeLayer(appState.fasumLayer);
    appState.layerControl.removeLayer(appState.fasumLayer);
  }

  // Render search results in the UI
  const searchResultContainer = document.getElementById(
    "search-result-container"
  );
  searchResultContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();
  appState.visibleMarkers = {}; // Clear previous markers

  filteredFeatures.forEach((feature) => {
    const { Nama, _category } = feature.properties;
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "btn btn-text btn-primary justify-start h-fit rounded-md text-left w-full";
    button.innerHTML = `
      <div class="p-2 text-xs flex flex-row gap-2 items-center text-left">
      <span class="${fasumCategoriesIconElementMap[_category]} inline-block align-middle size-8 mr-1"></span>
      <div class="">
        <h5 class="relative wrap-break-word mb-1 text-base text-base-content font-bold">${Nama}</h5>
        <span class="badge badge-outline badge-sm badge-primary capitalize">${_category}</span>
      </div>
      </div>`;
    button.addEventListener("click", () => selectMarker(Nama));

    const hr = document.createElement("hr");
    hr.className = "text-base-content/20";

    fragment.appendChild(button);
    fragment.appendChild(hr);
  });
  searchResultContainer.appendChild(fragment);

  function fasumGeoJSONToLayer(feature, latlng) {
    const category = feature.properties._category;
    const marker = L.marker(latlng, {
      icon: getFasumCategoryMarker(category, appState.colors[category]),
      title: feature.properties.Nama,
      riseOnHover: true,
    });

    // Store marker reference for click-to-zoom functionality
    appState.visibleMarkers[feature.properties.Nama] = marker;
    return marker;
  }

  // Create and add the new GeoJSON layer to the map
  appState.fasumLayer = L.geoJSON(
    { type: "FeatureCollection", features: filteredFeatures },
    {
      pointToLayer: fasumGeoJSONToLayer,
      onEachFeature: (feature, layer) => {
        const popUpcontent = createFasumPopupHtml(feature.properties);
        layer.bindPopup(popUpcontent, {
          className: "marker-popup without-tip",
        });
      },
    }
  ).addTo(appState.map);

  appState.layerControl.addOverlay(appState.fasumLayer, "Fasilitas Umum");
}

// --- UI & EVENT HANDLING ---

/**
 * Renders the category filter buttons based on the current state.
 */
function renderFilterButtons() {
  const filterDiv = document.getElementById("categoryFilter");
  const allFiltersSelected = appState.categories.every((c) => c.isActive);
  console.log(
    "🚀 ~ renderFilterButtons ~ allFiltersSelected:",
    allFiltersSelected
  );

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
      return `<button data-category="${c.name}" class="badge shrink-0 badge-lg cursor-pointer w-fit ${activeClass} rounded-full capitalize">${c.name}</button>`;
    })
    .join("");

  filterDiv.innerHTML = buttonsHTML;
}

/**
 * Sets up all event listeners for the page.
 */
function setupEventListeners() {
  const filterDiv = document.getElementById("categoryFilter");
  const searchInput = document.getElementById("search-fasum");
  const clearSearchButton = document.getElementById("clear-search-button");
  const searchIcon = document.getElementById("search-icon");
  const complaintForm = document.getElementById("complain-form-element");
  const formStatusSpan = document.getElementById("form-complain-status");

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    appState.searchTerm = "";
    applyFiltersAndRenderFasum();
    searchIcon.dataset.icon = "search";
  });

  searchInput.addEventListener("input", (e) => {
    appState.searchTerm = e.target.value;
    searchIcon.dataset.icon = appState.searchTerm ? "x" : "search";
    clearTimeout(appState.searchTimeout);
    appState.searchTimeout = setTimeout(
      () => applyFiltersAndRenderFasum(),
      400
    );
  });

  filterDiv.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const categoryName = button.dataset.category;
    const action = button.dataset.action;

    if (action) {
      const selectAll = action === "all";
      appState.categories.forEach((c) => (c.isActive = selectAll));
    } else if (categoryName) {
      const category = appState.categories.find((c) => c.name === categoryName);
      if (category) category.isActive = !category.isActive;
    }

    renderFilterButtons();
    applyFiltersAndRenderFasum();
  });

  HSOverlay.autoInit();

  const { element: modal } = HSOverlay.getInstance("#form-complain", true);
  modal.on("close", clearComplainForm);
  window.openComplainForm = (complainee) => {
    setTimeout(() => {
      document.getElementById("fasum_name").value = complainee;
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
      complaintCategory: "Fasilitas Umum",
      complainee: formData.get("fasum_name"),
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
 * Zooms to a marker when its corresponding item in the search result is clicked.
 * @param {string} name The 'Nama' property of the feature.
 */
function selectMarker(name) {
  const marker = appState.visibleMarkers[name];
  if (marker) {
    const latlng = structuredClone(marker?.getLatLng());
    latlng.lat += 0.0007; // Adjust latitude slightly to avoid popup overlap
    marker.openPopup();
    appState.map.flyTo(latlng, 18, { duration: 1 });
    document.getElementById("close-search")?.click();
  } else {
    console.warn(`Marker with name ${name} not found.`);
  }
}

/**
 * Creates and adds the map legend from the app state.
 */
function setupLegend() {
  const legendDiv = document.getElementById("legend-content");
  let content = `<div class="h-full"><b>Legenda Fasilitas Umum</b><br>`;
  for (const cat of appState.categories) {
    content += `
      <div class="flex items-center gap-2">
        <span style="background:${appState.colors[cat.name]}" class="size-4 ${
      fasumCategoriesIconElementMap[cat.name]
    }"></span>
        <span class="capitalize">${cat.name}</span>
      </div>`;
  }
  legendDiv.innerHTML = content + "</div>";
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
        icon: routing.markerIcon,
      }).addTo(appState.map);
      routing.selectingStart = false;
    } else if (routing.selectingEnd) {
      if (routing.endMarker) appState.map.removeLayer(routing.endMarker);
      routing.endPoint = e.latlng;
      routing.endMarker = L.marker(routing.endPoint, {
        icon: routing.markerIcon,
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
      lineOptions: { styles: [{ color: "green", weight: 4 }] },
      routeWhileDragging: false,
      createMarker: () => null,
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
