# Karsa — Sistem Akuntansi Penjualan & Booking Catering Event

Sistem informasi operasional dan akuntansi sederhana untuk usaha catering event.
Aplikasi membantu mencatat customer, booking event, invoice (termasuk PPN 11%),
status pembayaran, serta menampilkan ringkasan pendapatan dan piutang.

## Struktur folder

```text
sistem-akuntansi-catering/
├── backend/            # Koneksi & logika database
│   ├── app.js          # Supabase client, hitung PPN, simpan/ubah/hapus data
│   └── schema.sql      # Skema tabel database
├── frontend/           # Tampilan web
│   ├── index.html
│   ├── css/
│   │   ├── style.css
│   │   └── katalog.css
│   ├── js/
│   │   ├── app.js      # Tampilan, form, tabel, dashboard (memanggil backend/app.js)
│   │   └── catalog.js  # Katalog paket
│   └── img/
├── .gitignore
├── index.html          # Mengarahkan otomatis ke frontend/index.html
└── README.md
```

## Menyiapkan Supabase

1. Buka atau buat project di Supabase.
2. Masuk ke **SQL Editor**.
3. Copy seluruh isi `backend/schema.sql`, tempel, lalu klik **Run**.
4. Buka **Project Settings → API**, salin **Project URL** dan **anon / publishable key**.

> Jangan pernah memakai `service_role key` di kode frontend.

## Memasukkan URL & key Supabase

Buka `backend/app.js`, lalu ubah dua baris paling atas:

```javascript
const SUPABASE_URL = "https://xxxx.supabase.co";
const SUPABASE_ANON_KEY = "isi-anon-atau-publishable-key";
```

## Menjalankan di laptop

Jalankan dari **root folder** ini (bukan dengan double-click `file://`).

**VS Code Live Server** — klik kanan `index.html` di root → *Open with Live Server*.

**Python:**

```bash
python -m http.server 5500
```

Buka `http://localhost:5500`.

**Node.js:**

```bash
npx serve .
```

## Deploy ke GitHub Pages

1. Push semua isi folder ini ke repo GitHub (branch `main`).
2. Buka **Settings → Pages**.
3. Pilih **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Simpan, lalu tunggu beberapa menit sampai link demo aktif.

`index.html` di root akan otomatis membuka `frontend/index.html`.

## Fitur

- Dashboard revenue terbayar, piutang, event terjadwal, dan invoice lunas.
- Form booking customer dan event dengan kalkulasi subtotal, PPN 11%, dan total realtime.
- Penyimpanan berurutan: customer → pesanan event → pembayaran.
- Daftar invoice dengan pencarian, filter status, edit, dan pelunasan.
- Katalog paket catering yang mengisi form booking otomatis.

## Catatan keamanan

`backend/schema.sql` menonaktifkan RLS untuk kebutuhan testing/tugas. Sebelum dipakai
publik, aktifkan kembali RLS dan buat policy yang sesuai.
