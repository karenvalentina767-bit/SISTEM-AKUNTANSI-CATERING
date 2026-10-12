/* ============================================================
   BACKEND — koneksi & logika data (Supabase PostgreSQL)
   File ini mengurus: konfigurasi Supabase, perhitungan PPN,
   dan semua operasi database (simpan, baca, ubah, hapus).
   Tampilan (UI) ada di frontend/js/app.js dan memanggil
   fungsi-fungsi di objek `Backend` di bawah ini.

   Isi dua nilai ini dari Project Supabase milik kamu.
   Jangan gunakan service_role key di browser.
   ============================================================ */
const SUPABASE_URL = "https://rrggksnvyxzhwzxapkdr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0D1NMpLVYsUU6uIi21JfNA_OsXCk8J_";

const Backend = (() => {
  const TAX_RATE = 0.11;

  const isConfigured = Boolean(
    window.supabase &&
      SUPABASE_URL.startsWith("https://") &&
      !SUPABASE_URL.includes("ISI_") &&
      SUPABASE_ANON_KEY &&
      !SUPABASE_ANON_KEY.includes("ISI_")
  );

  const client = isConfigured
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  const round2 = (value) => Math.round(value * 100) / 100;

  // Hitung subtotal, PPN 11%, dan total tagihan
  function hitungTagihan(pax, hargaPerPax) {
    const subtotal = round2(Number(pax || 0) * Number(hargaPerPax || 0));
    const pajak = round2(subtotal * TAX_RATE);
    const total = round2(subtotal + pajak);
    return { subtotal, pajak, total };
  }

  function wajibTerhubung() {
    if (!client) {
      throw new Error("Supabase belum terhubung. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di backend/app.js.");
    }
  }

  // Ambil semua invoice beserta data event & pelanggan
  async function ambilInvoice() {
    if (!client) return [];
    const { data, error } = await client
      .from("pembayaran")
      .select("*, pesanan_event(id, nama_event, tanggal_event, jenis_paket, jumlah_pax, harga_per_pax, pelanggan(nama_pelanggan))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Simpan booking baru: pelanggan -> pesanan_event -> pembayaran
  async function simpanBooking(values) {
    wajibTerhubung();
    const pax = Number(values.pax);
    const hargaPerPax = Number(values.pricePerPax);
    const { subtotal, pajak, total } = hitungTagihan(pax, hargaPerPax);

    const { data: pelanggan, error: pelangganError } = await client
      .from("pelanggan")
      .insert({
        nama_pelanggan: values.customerName,
        no_hp: values.phone,
        email: values.email || "",
      })
      .select("id")
      .single();
    if (pelangganError) throw pelangganError;

    const { data: pesanan, error: pesananError } = await client
      .from("pesanan_event")
      .insert({
        pelanggan_id: pelanggan.id,
        nama_event: values.eventName,
        tanggal_event: values.eventDate,
        jenis_paket: values.packageType,
        jumlah_pax: pax,
        harga_per_pax: hargaPerPax,
        total_penjualan: subtotal,
      })
      .select("id")
      .single();
    if (pesananError) throw pesananError;

    const noInvoice = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
    const { error: pembayaranError } = await client.from("pembayaran").insert({
      pesanan_id: pesanan.id,
      no_invoice: noInvoice,
      tanggal_tagihan: values.billingDate,
      tanggal_tempo: values.dueDate,
      pajak_ppn: pajak,
      total_tagihan: total,
      status_bayar: "Belum Lunas",
    });
    if (pembayaranError) throw pembayaranError;

    return { noInvoice };
  }

  // Ubah data event dan invoice
  async function ubahBooking({ invoiceId, pesananId, values }) {
    wajibTerhubung();
    const pax = Number(values.pax);
    const hargaPerPax = Number(values.pricePerPax);
    const { subtotal, pajak, total } = hitungTagihan(pax, hargaPerPax);

    const { error: pesananError } = await client
      .from("pesanan_event")
      .update({
        nama_event: values.eventName,
        tanggal_event: values.eventDate,
        jenis_paket: values.packageType,
        jumlah_pax: pax,
        harga_per_pax: hargaPerPax,
        total_penjualan: subtotal,
      })
      .eq("id", pesananId);
    if (pesananError) throw pesananError;

    const { error: pembayaranError } = await client
      .from("pembayaran")
      .update({
        tanggal_tagihan: values.billingDate,
        tanggal_tempo: values.dueDate,
        pajak_ppn: pajak,
        total_tagihan: total,
        status_bayar: values.statusBayar,
      })
      .eq("id", invoiceId);
    if (pembayaranError) throw pembayaranError;
  }

  // Tandai invoice lunas
  async function tandaiLunas(invoiceId) {
    wajibTerhubung();
    const { error } = await client.from("pembayaran").update({ status_bayar: "Lunas" }).eq("id", invoiceId);
    if (error) throw error;
  }

  // Hapus booking (invoice ikut terhapus lewat ON DELETE CASCADE)
  async function hapusBooking(pesananId) {
    wajibTerhubung();
    const { error } = await client.from("pesanan_event").delete().eq("id", pesananId);
    if (error) throw error;
  }

  return { TAX_RATE, isConfigured, hitungTagihan, ambilInvoice, simpanBooking, ubahBooking, tandaiLunas, hapusBooking };
})();
