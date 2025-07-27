import { tileLayer } from "leaflet";
import { divIcon } from "leaflet";
const STADIA_API_KEY = "1a256c84-864d-4947-901f-3d4253483521";

/**
 * An object containing various tile layers for the Leaflet map.
 * These can be imported and used to create a layer control.
 */
export const tileLayers = {
  OpenStreetMap: tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  ),
  "Dark Mode": tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }
  ),
  Satellite: tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri",
    }
  ),
  Positron: tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }
  ),
  "ESRI World Street": tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri",
    }
  ),
  "Stamen Toner Lite": tileLayer(
    `https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png?api_key=${STADIA_API_KEY}`,
    {
      minZoom: 0,
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }
  ),
  "CARTO Voyager": tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }
  ),
};

export const categoriesIconElementMap = {
  "Makanan & Minuman": "icon-[tabler--bowl-spoon]",
  "Fashion & Aksesoris": "icon-[tabler--shirt]",
  Jasa: "icon-[tabler--user-cog]",
  "Bahan Baku": "icon-[tabler--pepper]",
  Lainnya: "icon-[tabler--category-2]",

  // unused
  Fashion: "icon-[tabler--shirt-sport]",
  "Produk Makanan Berat": "icon-[tabler--tools-kitchen-3]",
  Aksesoris: "icon-[tabler--pencil-cog]",
  "Produk Makanan Ringan": "icon-[tabler--cookie]",
  Kerajinan: "icon-[tabler--wood]",
  "Bahan Makanan": "icon-[tabler--carrot]",
  "Produk Minuman": "icon-[tabler--cup]",
  Kelontong: "icon-[tabler--building-store]",
  "Bahan Bangunan": "icon-[tabler--hammer]",
  Otomotif: "icon-[tabler--motorbike]",
  "Jasa Penjahit": "icon-[tabler--needle-thread]",
  "Produk Makanan dan Minuman": "icon-[tabler--salad]",
  "Minuman Herbal Tradisional": "icon-[tabler--leaf]",
  "Minuman Tradisional": "icon-[tabler--bottle]",
  "Produk Bumbu Masak": "icon-[tabler--salt]",
  "Produk Ikan Olahan": "icon-[tabler--fish]",
  "Bahan Pertanian": "icon-[tabler--plant]",
  Percetakan: "icon-[tabler--paperclip]",
  "Kebutuhan Hewan Peliharaan": "icon-[tabler--paw]",
};

export const fasumCategoriesIconElementMap = {
  masjid: "icon-[tabler--building-mosque]",
  tps: "icon-[tabler--trash]",
  sekolah: "icon-[tabler--school]",
  poskampling: "icon-[tabler--building-bank]",
  makam: "icon-[tabler--grave-2]",
};

export function getUmkmCategoryMarker(category, color = "#c30b82") {
  return divIcon({
    className: "custom-div-icon",
    html: `
    <div style='background-color:${color};' class='marker-pin'></div>
    <span class="${categoriesIconElementMap[category]} size-5 absolute bg-black left-[50%] top-[50%] -translate-[50%]"></span>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
}

export function getFasumCategoryMarker(category, color = "#c30b82") {
  return divIcon({
    className: "custom-div-icon",
    html: `
    <div style='background-color:${color};' class='marker-pin'></div>
    <span class="${fasumCategoriesIconElementMap[category]} size-5 absolute bg-black left-[50%] top-[50%] -translate-[50%]"></span>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
}

/**
 * Creates the HTML content for a UMKM popup card.
 * @param {object} properties - The properties object from a GeoJSON feature.
 * @returns {string} The HTML string for the popup.
 */
export function createUmkmPopupHtml(properties) {
  const { ID, Jenis_UMKM, ALAMAT, Variasi, Range_Harg, No_Telp } = properties;

  const imageName = ID.toLowerCase().replace(/"/g, "");
  const pngUrl = `/images/umkm/${imageName}.png`;
  const jpgUrl = `/images/umkm/${imageName}.jpg`;
  const defaultImageUrl = "/images/umkm/default.jpg";

  // Prepare the contact number for a 'tel:' link. Takes the first number if multiple exist.
  const firstPhoneNumber = No_Telp ? No_Telp.split("/")[0].trim() : "";
  const contactButtonHtml =
    firstPhoneNumber && firstPhoneNumber !== "-"
      ? `
      <a href="tel:${firstPhoneNumber}" class="btn btn-primary !text-primary-content font-bold btn-sm w-full mt-2">
        <span class="icon-[tabler--phone] inline-block align-text-top size-4.5"></span>
        Hubungi
      </a>`
      : "";

  const imageErrorHandler = `
    this.onerror=null; 
    this.src='${jpgUrl}'; 
    this.onerror=function() {
      this.onerror=null; 
      this.src='${defaultImageUrl}';
    };
  `.replace(/\n\s*/g, "");

  const VariantElem = Variasi.split(",")
    .map((item, index) => {
      return `
      <p class="!m-0 inline-block !mr-1">
        <span class="icon-[tabler--check] bg-primary inline-block align-text-top size-4"></span>
        ${item.trim()}
      </p>`;
    })
    .join("");

  // The 'onerror' attribute on the <img> tag handles fallback to a default image.
  const content = `
      <figure>
        <img src="${pngUrl}" alt="${ID}" class="h-32 w-full object-cover" onerror="${imageErrorHandler}" />
      </figure>
      <div class="card-body p-3 gap-1">
        <span class="badge badge-outline badge-primary badge-sm ">${Jenis_UMKM}</span>
        <h2 class="card-title relative wrap-break-word text-base text-base-content font-bold">
          <span class="${
            categoriesIconElementMap[Jenis_UMKM]
          } inline-block align-text-top size-4.5"></span>
          ${ID}
        </h2>
        <p class="!m-0 !mb-1 text-xs">${ALAMAT}</p>
        <div class="bg-primary/10 text-xs p-2 !mb-2 rounded-xl">
          <p class="!m-0 !mb-1 !font-bold">
            Menyediakan
          </p>
          ${VariantElem}
        </div>
        <p class="!m-0 text-sm !font-bold">
          <span class="icon-[tabler--cash] bg-primary inline-block align-middle size-5"></span>
          <span class="inline-block align-text-top">${
            Range_Harg && Range_Harg.trim() !== "-"
              ? Range_Harg
              : "Harga Tidak Tersedia"
          }
          </span> 
        </p>
        ${contactButtonHtml}
        <button type="button" class="btn report-button btn-warning btn-outline btn-sm mt-1" aria-haspopup="dialog" aria-controls="form-complain">
          <span class="icon-[tabler--alert-hexagon] inline-block align-text-top size-4.5"></span>
          Laporkan Keluhan
        </button>
      </div>
    </div>
  `;

  const outerDiv = document.createElement("div");
  outerDiv.className =
    "card w-64 bg-base-100 mb-7 rounded-2xl shadow-2xl !text-base-content !font-[Inter]";
  outerDiv.innerHTML = content;
  outerDiv
    .querySelector(".report-button")
    .addEventListener("click", () => window.openComplainForm(ID));

  return outerDiv;
}

const fasumDesc = {
  masjid:
    "Bangunan atau tempat yang dirancang khusus untuk ibadah umat Islam, terutama shalat",
  tps: "Fasilitas atau lokasi yang dirancang untuk menerima, memproses, dan mengelola sampah, baik itu sampah rumah tangga, sampah sejenis sampah rumah tangga, maupun sampah lainnya",
  sekolah:
    "Lembaga pendidikan formal yang menyelenggarakan pengajaran dan pendidikan bagi siswa di bawah bimbingan guru",
  poskampling:
    "Pos Keamanan Lingkungan adalah sebuah tempat atau pos yang didirikan oleh masyarakat untuk menjaga keamanan dan ketertiban di lingkungan",
  makam: "Tempat menguburkan jenazah atau kuburan",
};

/**
 * Creates the HTML content for a Fasum popup card.
 * @param {object} properties - The properties object from a GeoJSON feature.
 * @returns {string} The HTML string for the popup.
 */
export function createFasumPopupHtml(properties) {
  const { Nama: name, _category: category } = properties;

  const webpUrl = `/images/fasum/${category}.webp`;
  const jpgUrl = `/images/fasum/${category}.jpg`;

  const imageErrorHandler = `
    this.onerror=null; 
    this.src='${jpgUrl}'; 
  `.replace(/\n\s*/g, "");

  // The 'onerror' attribute on the <img> tag handles fallback to a default image.
  const content = `
      <figure>
        <img src="${webpUrl}" alt="${category}" class="h-32 w-full object-cover" onerror="${imageErrorHandler}" />
      </figure>
      <div class="card-body p-3 gap-1">
        <span class="badge badge-soft badge-sm badge-default capitalize">${category}</span>
        <h2 class="card-title relative wrap-break-word text-base text-primary font-bold">
          <span class="${fasumCategoriesIconElementMap[category]} inline-block align-text-top size-4.5"></span>
          ${name}
        </h2>
        <p class="!m-0 !mb-1 text-xs">${fasumDesc[category]}</p>
        <button type="button" class="btn report-button btn-warning btn-outline btn-sm mt-1" aria-haspopup="dialog" aria-controls="form-complain">
          <span class="icon-[tabler--alert-hexagon] inline-block align-text-top size-4.5"></span>
          Laporkan Keluhan
        </button>
      </div>
  `;

  const outerDiv = document.createElement("div");
  outerDiv.className =
    "card w-64 bg-base-100 mb-7 rounded-2xl shadow-2xl !text-base-content !font-[Inter]";
  outerDiv.innerHTML = content;
  outerDiv
    .querySelector(".report-button")
    .addEventListener("click", () => window.openComplainForm(name));

  return outerDiv;
}

/**
 * Creates the HTML content for a administrative region popup card.
 * @param {object} properties - The properties object from a GeoJSON feature.
 * @returns {string} The HTML string for the popup.
 */
export function createAdminPopupHtml(properties, groupName) {
  const { RT, RT_RW, RW } = properties;

  const imgUrl = `/images/administrasi/default.jpeg`;

  // The 'onerror' attribute on the <img> tag handles fallback to a default image.
  const content = `
    <figure>
      <img src="${imgUrl}" alt="ilustrasi rt" class="h-32 w-full object-cover"  />
    </figure>
    <div class="card-body p-3 gap-1">
      <span class="badge badge-soft badge-sm badge-default capitalize">${groupName}</span>
      <h2 class="card-title relative wrap-break-word text-base text-primary font-bold">
        <span class="icon-[tabler--building-community] inline-block align-text-top size-4.5"></span>
        RT ${RT} / RW ${RW}
      </h2>
      <button type="button" class="btn report-button btn-warning btn-outline btn-sm mt-1" aria-haspopup="dialog" aria-controls="form-complain">
        <span class="icon-[tabler--alert-hexagon] inline-block align-text-top size-4.5"></span>
        Laporkan Keluhan
      </button>
    </div>
  `;

  const outerDiv = document.createElement("div");
  outerDiv.className =
    "card w-64 bg-base-100 rounded-2xl shadow-2xl !text-base-content !font-[Inter]";
  outerDiv.innerHTML = content;
  outerDiv
    .querySelector(".report-button")
    .addEventListener("click", () => window.openComplainForm(RT_RW));

  return outerDiv;
}
