document.addEventListener("DOMContentLoaded", () => {
  const kata = ["UMKM", "Fasilitas Umum", "Administrasi Desa"];
  let index = 0;
  const el = document.getElementById("dynamicText");

  setInterval(() => {
    el.classList.add("opacity-0");
    el.style.transform = "scale(0.8) rotateY(90deg)";
    setTimeout(() => {
      el.textContent = kata[index];
      el.style.transform = "scale(1) rotateY(0deg)";
      el.classList.remove("opacity-0");
      index = (index + 1) % kata.length;
    }, 200);
  }, 2000);

  const cards = document.querySelectorAll("[data-fade]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-6");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  cards.forEach((card) => observer.observe(card));

  AOS.init({ duration: 800, once: true });

  const toggles = [
    {
      toggle: document.getElementById("themeToggleSidebar"),
      icon: document.getElementById("themeIconSidebar"),
      label: document.getElementById("themeLabelSidebar"),
    },
  
  ];

 
});


const geoJsonData = {
  "type": "FeatureCollection",
  "features": [
    {"type":"Feature","id":0,"properties":{"ID":"Catering Hik Ukhuwah","Variasi":"Nasi bukhori, Tumpeng, Nasi box"}},
    {"type":"Feature","id":1,"properties":{"ID":"Aneka Camilan Noltig","Variasi":"Aneka makanan ringan"}},
    {"type":"Feature","id":2,"properties":{"ID":"Renita Sayur","Variasi":"Aneka sayur mentah, Bumbu dapur"}},
    {"type":"Feature","id":3,"properties":{"ID":"Batik Lurik Dhemes","Variasi":"Aneka kain batik, Aneka lurik"}},
    {"type":"Feature","id":4,"properties":{"ID":"Rejo Buah","Variasi":"Aneka Buah"}},
    {"type":"Feature","id":5,"properties":{"ID":"Produsen Es Potong \"Mas Joko\"","Variasi":"Vanilla, Coklat, Strawberry"}},
    {"type":"Feature","id":6,"properties":{"ID":"Eggroll Prima Rasa Bu kuncoro","Variasi":"Eggroll (Original, Coklat, Keju, Wijen), Stick bawang"}},
    {"type":"Feature","id":7,"properties":{"ID":"Kedai Kreatif","Variasi":"Pot, Tempat sampah, Wadah bumbu, Vas bunga, Wadah seserahan, Wadah sesaji"}},
    {"type":"Feature","id":8,"properties":{"ID":"Donat Kentang Bu Agus","Variasi":"Donat, Aneka jajanan pasar"}},
    {"type":"Feature","id":9,"properties":{"ID":"Bakso Pangsit","Variasi":"Bakso Pangsit, Siomay, Tahu isi"}},
    {"type":"Feature","id":10,"properties":{"ID":"Kios Ratna","Variasi":"Aneka sembako"}},
    {"type":"Feature","id":11,"properties":{"ID":"Toko Dwie Kaos","Variasi":"Kaos, Baju, Celana, Jasa bordir"}},
    {"type":"Feature","id":12,"properties":{"ID":"Joy Pet Shop","Variasi":"Aksesoris, Pakan hewan, Obat-obatan, Kandang"}},
    {"type":"Feature","id":13,"properties":{"ID":"Baja RIngan & Gypsum \"Maju Mapan\"","Variasi":"Baja ringan, Gypsum, Galvium, Besi, dll"}},
    {"type":"Feature","id":14,"properties":{"ID":"Sop Ayam dan Nasi Sayayur \"Mak Soem\"","Variasi":"Sop ayam, Nasi sayur"}},
    {"type":"Feature","id":15,"properties":{"ID":"Restu Food","Variasi":"Anka kue, Jajanan pasar, Nasi box"}},
    {"type":"Feature","id":16,"properties":{"ID":"Teras Nouvar Ban & Oli Motor","Variasi":"Servis, Ganti Oli, Ganti Ban"}},
    {"type":"Feature","id":17,"properties":{"ID":"Aneka Snack & Nasi Box \"Mujur\"","Variasi":"Jajanan pasar, Nasi box"}},
    {"type":"Feature","id":18,"properties":{"ID":"UD Budi Rahayu","Variasi":"Peyek kacang, Peyek belut, Peyek paru"}},
    {"type":"Feature","id":19,"properties":{"ID":"Onde-onde Kering Pak Wahyudi","Variasi":"Onde-onde kering"}},
    {"type":"Feature","id":20,"properties":{"ID":"Barokah Kripik","Variasi":"Aneka keripik, Peyek"}},
    {"type":"Feature","id":21,"properties":{"ID":"Peyek Kacang Bu Muji Lestari","Variasi":"Peyek Kacang"}},
    {"type":"Feature","id":22,"properties":{"ID":"Tempe (Sumber Rejeki)","Variasi":"Tempe Kedelai"}},
    {"type":"Feature","id":23,"properties":{"ID":"Jamu Bu Sumini","Variasi":"Kunyit, Galian, Godogan, Suruk, Galian, Cabu pyam, Temulawak, Daun pepaya, Beras kencur, Kunyit asem, Gula asem"}},
    {"type":"Feature","id":24,"properties":{"ID":"Jamu Bu Suminten","Variasi":"Daun sirih, Beras kencur, Temulawak, Cabe puyang, Galian, Brotowali, Daun Pepaya"}},
    {"type":"Feature","id":25,"properties":{"ID":"Jamu Bu Legiyem","Variasi":"Kunyit, Galian, Godogan, Suruk, Galian, Cabu pyam, Temulawak, Daun pepaya, Beras kencur, Kunyit asem, Gula asem"}},
    {"type":"Feature","id":26,"properties":{"ID":"Jamu Bu Partiyem","Variasi":"Kunyit, Galian, Godogan, Suruk, Galian, Cabu pyam, Temulawak, Daun pepaya, Beras kencur, Kunyit asem, Gula asem"}},
    {"type":"Feature","id":27,"properties":{"ID":"Makanan Snack Bu sri Sudaryanti","Variasi":"Aneka snack, Sayur & Lauk, Nasi box"}},
    {"type":"Feature","id":28,"properties":{"ID":"Warung Sayur Mateng Bu Tri Sujatmoko","Variasi":"Gorengan, Aneka sayur & Lauk"}},
    {"type":"Feature","id":29,"properties":{"ID":"Warung Sayur Mateng Bu Suparti","Variasi":"Gorengan, Bubur, Soto, Aneka sayur & Lauk"}},
    {"type":"Feature","id":30,"properties":{"ID":"Brambang Goreng Bu Sri Mulyani","Variasi":"Brambang Goreng"}},
    {"type":"Feature","id":31,"properties":{"ID":"Penjahit Bu Catur Wulandari","Variasi":"Jahit baju, Permak Jeans"}},
    {"type":"Feature","id":32,"properties":{"ID":"Dawet Bu Sri Atun (Dawet Sor Ringin)","Variasi":"Es dawet"}},
    {"type":"Feature","id":33,"properties":{"ID":"Karak Bu Lestari","Variasi":"Kerupuk karak"}},
    {"type":"Feature","id":34,"properties":{"ID":"Karak Bu Atika","Variasi":"Karak mentah"}},
    {"type":"Feature","id":35,"properties":{"ID":"Warung Bu Sujiati (Masakan Mateng)","Variasi":"Aneka sayur & Lauk, Nasi box"}},
    {"type":"Feature","id":36,"properties":{"ID":"Es Dung-dung Pak Ginem dan Bu Ida","Variasi":"Es Dung-dung"}},
    {"type":"Feature","id":37,"properties":{"ID":"Penjahit Bu Etik","Variasi":"Jahit baju, Permak jeans"}},
    {"type":"Feature","id":38,"properties":{"ID":"JapuJapu Minuman Herbal Ibu Diyah","Variasi":"Jamu Instan"}},
    {"type":"Feature","id":39,"properties":{"ID":"Angkringan Bu Wiji","Variasi":"Aneka sayur & lauk, Minuman, Gorengan"}},
    {"type":"Feature","id":40,"properties":{"ID":"Angkringan Bu Sugiyem","Variasi":"Aneka sayur & lauk, Minuman, Gorengan"}},
    {"type":"Feature","id":41,"properties":{"ID":"Mafia Bandeng Presto","Variasi":"Bandeng presto"}},
    {"type":"Feature","id":42,"properties":{"ID":"Es Ganja (Degan Saja)","Variasi":"Degan Gula Pasir, Degan gula Jawa"}},
    {"type":"Feature","id":43,"properties":{"ID":"Toko Sayur PDN Mulia","Variasi":"Aneka Sayur, Bumbu Dapur"}},
    {"type":"Feature","id":44,"properties":{"ID":"Toko Gas PDN Mulia","Variasi":"Gas 3 Kg"}},
    {"type":"Feature","id":45,"properties":{"ID":"Warung Makan Bu Nining","Variasi":"Soto, Pecel, Minuman"}},
    {"type":"Feature","id":46,"properties":{"ID":"Boy Motor","Variasi":"Servis, Ganti Oli"}},
    {"type":"Feature","id":47,"properties":{"ID":"Putro Tani","Variasi":"Pupuk, Benih"}},
    {"type":"Feature","id":48,"properties":{"ID":"Apo Alpucok","Variasi":"Alpukat kocok"}},
    {"type":"Feature","id":49,"properties":{"ID":"Toko Bu Eni","Variasi":"Aneka camilan, Sembako"}},
    {"type":"Feature","id":50,"properties":{"ID":"Jamu Bu Sumarsih","Variasi":"Beras kencur, Kunir asem"}},
    {"type":"Feature","id":51,"properties":{"ID":"Toko Ahad","Variasi":"Aneka camilan, Sembako"}},
    {"type":"Feature","id":52,"properties":{"ID":"Toko Ibu Suminah","Variasi":"Aneka camilan, Sembako"}},
    {"type":"Feature","id":53,"properties":{"ID":"Yani Penyet","Variasi":"Ayam Geprek, Ayam Kremes"}},
    {"type":"Feature","id":54,"properties":{"ID":"Angkringan Bu Sikar","Variasi":"Soto, Pecel, Minuman"}},
    {"type":"Feature","id":55,"properties":{"ID":"Tari's Steak","Variasi":"Ayam Krispi, Ayam Blackpaper"}},
    {"type":"Feature","id":56,"properties":{"ID":"Kedai N'A","Variasi":"Tempura, Cilok, Batagor"}},
    {"type":"Feature","id":57,"properties":{"ID":"Pang Jati","Variasi":"Kursi, Meja"}},
    {"type":"Feature","id":58,"properties":{"ID":"Warung Udin Sayur","Variasi":"Aneka sayur, Bumbu dapur"}},
    {"type":"Feature","id":59,"properties":{"ID":"Gudeg Jogja Mbak Peni","Variasi":"Gudeg, Telur kecap"}},
    {"type":"Feature","id":60,"properties":{"ID":"Madu Murni Sekar Wangi","Variasi":"Aneka jenis madu"}},
    {"type":"Feature","id":61,"properties":{"ID":"Warung Mbak Putri","Variasi":"Tempura, Donat"}},
    {"type":"Feature","id":62,"properties":{"ID":"Ketoprak","Variasi":"Ketoprak, Nasi Goreng, Magelangan"}},
    {"type":"Feature","id":63,"properties":{"ID":"Lucky Printing","Variasi":"Kalender, Stiker, Nota, Kartu nama, Buku yasin, dll"}}
  ]
};





const umkmData = geoJsonData.features.map(feature => {
  const baseName = feature.properties.ID.toLowerCase().replace(/['"]/g, '');
  return {
    name: feature.properties.ID,
    description: feature.properties.Variasi,
    image: `/images/umkm/${baseName}.jpg`,
    imagePng: `/images/umkm/${baseName}.png`
  };
});

function updateCards() {
  const card1 = {
    image: document.getElementById('umkmImage1'),
    name: document.getElementById('umkmName1'),
    desc: document.getElementById('umkmDesc1')
  };
  const card2 = {
    image: document.getElementById('umkmImage2'),
    name: document.getElementById('umkmName2'),
    desc: document.getElementById('umkmDesc2')
  };

  const index1 = currentIndex % umkmData.length;
  const index2 = (currentIndex + 1) % umkmData.length;


  const img1 = new Image();
  img1.src = umkmData[index1].image;
  img1.onload = () => { card1.image.src = umkmData[index1].image; };
  img1.onerror = () => {
    const img1png = new Image();
    img1png.src = umkmData[index1].imagePng;
    img1png.onload = () => { card1.image.src = umkmData[index1].imagePng; };
    img1png.onerror = () => { console.log(`Gagal load ${umkmData[index1].name}: .jpg dan .png tidak ditemukan`); };
  };

  const img2 = new Image();
  img2.src = umkmData[index2].image;
  img2.onload = () => { card2.image.src = umkmData[index2].image; };
  img2.onerror = () => {
    const img2png = new Image();
    img2png.src = umkmData[index2].imagePng;
    img2png.onload = () => { card2.image.src = umkmData[index2].imagePng; };
    img2png.onerror = () => { console.log(`Gagal load ${umkmData[index2].name}: .jpg dan .png tidak ditemukan`); };
  };

  card1.image.alt = umkmData[index1].name;
  card1.name.textContent = umkmData[index1].name;
  card1.desc.textContent = umkmData[index1].description;

  card2.image.alt = umkmData[index2].name;
  card2.name.textContent = umkmData[index2].name;
  card2.desc.textContent = umkmData[index2].description;

  AOS.refresh();
  card1.image.parentElement.parentElement.setAttribute('data-aos', 'fade-right');
  card2.image.parentElement.parentElement.setAttribute('data-aos', 'fade-left');

  currentIndex = (currentIndex + 2) % umkmData.length;
}



let currentIndex = 0;
updateCards();

setInterval(updateCards, 7000);
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});