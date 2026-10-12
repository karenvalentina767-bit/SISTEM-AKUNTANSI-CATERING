/* Katalog paket catering. Ubah daftar PACKAGES untuk mengganti nama, harga, menu, dan gambar paket. */
const PACKAGES = [
  { name: "Prasmanan Nusantara", category: "Pernikahan", price: 85000, minPax: 100, image: "./img/katalog/prasmanan.jpg",
    menu: ["Nasi putih & nasi liwet", "Ayam bakar madu", "Rendang daging sapi", "Sayur asem", "Kerupuk, sambal, buah"] },
  { name: "Royal Wedding Buffet", category: "Pernikahan", price: 150000, minPax: 300, image: "./img/katalog/wedding.jpg",
    menu: ["2 jenis nasi & 6 lauk", "Zuppa soup", "4 stall gubukan", "Dessert corner", "Dekorasi meja"] },
  { name: "Gubukan Stall Food", category: "Pernikahan", price: 95000, minPax: 150, image: "./img/katalog/gubukan.jpg",
    menu: ["Nasi goreng kampung", "Sate ayam & kambing", "Bakso", "Siomay", "Es campur"] },
  { name: "Nasi Box Sehat", category: "Kantor", price: 45000, minPax: 30, image: "./img/katalog/nasibox.jpg",
    menu: ["Nasi merah / putih", "Ayam panggang", "Telur & sayur", "Buah segar", "Air mineral"] },
  { name: "Corporate Lunch Set", category: "Kantor", price: 120000, minPax: 50, image: "./img/katalog/corporate.jpg",
    menu: ["Salad", "Main course ikan / daging", "Roti & butter", "Dessert"] },
  { name: "Coffee Break", category: "Snack", price: 30000, minPax: 25, image: "./img/katalog/coffee.jpg",
    menu: ["Kopi & teh", "3 jenis kue basah", "Pastry", "Air mineral"] },
  { name: "Dessert Corner", category: "Snack", price: 35000, minPax: 50, image: "./img/katalog/dessert.jpg",
    menu: ["Panna cotta", "Puding", "Mini cake", "Buah potong"] },
  { name: "Paket Syukuran", category: "Syukuran", price: 55000, minPax: 50, image: "./img/katalog/syukuran.jpg",
    menu: ["Nasi putih", "Gulai kambing / kari ayam", "Acar & kerupuk", "Teh manis"] },
  { name: "Party Western", category: "Syukuran", price: 75000, minPax: 30, image: "./img/katalog/party.jpg",
    menu: ["Mini burger", "Spaghetti", "Chicken wings & fries", "Soft drink"] },
];

const rupiah = (value) => "Rp " + value.toLocaleString("id-ID");

// Isi jenis paket dan harga per pax di form booking
function pilihPaket(index) {
  const paket = PACKAGES[index];
  const form = document.querySelector("#bookingForm");
  form.packageType.value = paket.name;
  form.pricePerPax.value = paket.price;
  form.pricePerPax.dispatchEvent(new Event("input")); // supaya estimasi total ikut berubah
  document.querySelectorAll(".picker-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.index === String(index));
  });
}

// Halaman katalog
document.querySelector("#catalogGrid").innerHTML = PACKAGES.map((paket, index) => `
  <div class="package-card">
    <img src="${paket.image}" alt="${paket.name}" />
    <div class="package-body">
      <span class="package-category">${paket.category}</span>
      <h3>${paket.name}</h3>
      <ul>${paket.menu.map((item) => `<li>${item}</li>`).join("")}</ul>
      <div class="package-footer">
        <div>
          <strong>${rupiah(paket.price)}</strong> /pax
          <small>Minimal ${paket.minPax} pax</small>
        </div>
        <button type="button" class="button button-primary" data-pilih="${index}">Pilih paket</button>
      </div>
    </div>
  </div>`).join("");

// Pilihan paket di form booking
document.querySelector("#packagePicker").innerHTML = PACKAGES.map((paket, index) => `
  <button type="button" class="picker-card" data-index="${index}">
    <img src="${paket.image}" alt="" />
    <strong>${paket.name}</strong>
    <span>${rupiah(paket.price)}/pax</span>
  </button>`).join("");

document.querySelectorAll(".picker-card").forEach((card) => {
  card.addEventListener("click", () => pilihPaket(Number(card.dataset.index)));
});

document.querySelectorAll("[data-pilih]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector('.nav-item[data-tab="booking"]').click();
    pilihPaket(Number(button.dataset.pilih));
  });
});

// Judul di topbar untuk tab katalog
document.querySelectorAll('[data-tab="catalog"]').forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#currentArea").textContent = "KATALOG PAKET";
    document.querySelector("#pageHeading").textContent = "Katalog paket";
  });
});

// Hapus tanda pilihan saat form dibersihkan
document.querySelector("#bookingForm").addEventListener("reset", () => {
  document.querySelectorAll(".picker-card").forEach((card) => card.classList.remove("is-selected"));
});
