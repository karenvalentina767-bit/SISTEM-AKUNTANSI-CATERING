/* FRONTEND — tampilan & interaksi.
   Semua akses database ada di backend/app.js (objek `Backend`). */
const state = { invoices: [], search: "", filter: "all" };
const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
});

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const formatMoney = (value) => money.format(Number(value || 0)).replace(/\s/g, " ");
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
};
const dateOnly = (value) => new Date(value).toISOString().slice(0, 10);
const today = () => dateOnly(new Date());

function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.style.background = isError ? "#fff0e8" : "#effaf6";
  toast.style.color = isError ? "#9a4c37" : "#226a5c";
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 3500);
}

function setConfigBanner() {
  if (Backend.isConfigured) return;
  const banner = $("#configBanner");
  banner.textContent =
    "Supabase belum terhubung. Buka backend/app.js, isi SUPABASE_URL dan SUPABASE_ANON_KEY, lalu refresh halaman.";
  banner.classList.remove("is-hidden");
}

function setActiveTab(tab) {
  $$("[data-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
  $$("[data-view]").forEach((view) => view.classList.toggle("is-active", view.dataset.view === tab));
  const labels = { dashboard: "RINGKASAN", booking: "BOOKING BARU", invoices: "INVOICE & PEMBAYARAN", catalog: "KATALOG PAKET" };
  const headings = { dashboard: "Financial cockpit", booking: "Booking baru", invoices: "Invoice & pembayaran", catalog: "Katalog paket" };
  $("#currentArea").textContent = labels[tab];
  $("#pageHeading").textContent = headings[tab];
  if (tab === "dashboard") loadDashboard();
  if (tab === "invoices") loadInvoices();
}

function setDashboardValues(invoices) {
  const paid = invoices.filter((invoice) => invoice.status_bayar === "Lunas");
  const unpaid = invoices.filter((invoice) => invoice.status_bayar === "Belum Lunas");
  const paidRevenue = paid.reduce((sum, invoice) => sum + Number(invoice.total_tagihan || 0), 0);
  const outstanding = unpaid.reduce((sum, invoice) => sum + Number(invoice.total_tagihan || 0), 0);
  const upcoming = invoices
    .filter((invoice) => invoice.pesanan_event?.tanggal_event >= today())
    .sort((a, b) => a.pesanan_event.tanggal_event.localeCompare(b.pesanan_event.tanggal_event));
  const totalCount = paid.length + unpaid.length;
  const share = totalCount ? Math.round((paid.length / totalCount) * 100) : 0;

  $("#paidRevenue").textContent = formatMoney(paidRevenue);
  $("#outstandingReceivables").textContent = formatMoney(outstanding);
  $("#scheduledEvents").textContent = upcoming.length;
  $("#paidCount").textContent = paid.length;
  $("#outstandingCount").textContent = `${unpaid.length} invoice`;
  $("#paidShare").textContent = `${share}%`;
  $("#cashReceived").textContent = formatMoney(paidRevenue);
  $("#cashOutstanding").textContent = formatMoney(outstanding);
  $("#paymentProgress").style.width = `${share}%`;
  $("#paidProgressLabel").textContent = `${paid.length} lunas`;
  $("#unpaidProgressLabel").textContent = `${unpaid.length} outstanding`;

  const eventContainer = $("#upcomingEvents");
  if (!upcoming.length) {
    eventContainer.innerHTML = '<div class="empty-state"><strong>Belum ada event terdekat</strong><p>Booking baru akan muncul di sini setelah tersimpan di Supabase.</p></div>';
    return;
  }
  eventContainer.innerHTML = upcoming.slice(0, 5).map((invoice) => {
    const order = invoice.pesanan_event;
    const date = new Date(`${order.tanggal_event}T00:00:00`);
    return `<div class="event-row">
      <div class="event-date"><strong>${date.getDate().toString().padStart(2, "0")}</strong><span>${new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date)}</span></div>
      <div><div class="event-name">${escapeHtml(order.nama_event)}</div><div class="event-meta">${escapeHtml(order.pelanggan?.nama_pelanggan || "Customer")} · ${escapeHtml(order.jenis_paket)}</div></div>
      <div class="event-pax">${order.jumlah_pax} pax</div>
    </div>`;
  }).join("");
}

async function loadDashboard() {
  try {
    setDashboardValues(await Backend.ambilInvoice());
  } catch (error) {
    setDashboardValues([]);
    showToast(`Gagal memuat dashboard: ${error.message}`, true);
  }
}

async function loadInvoices() {
  try {
    state.invoices = await Backend.ambilInvoice();
    renderInvoices();
  } catch (error) {
    showToast(`Gagal memuat invoice: ${error.message}`, true);
  }
}

function renderInvoices() {
  const needle = state.search.toLowerCase();
  const filtered = state.invoices.filter((invoice) => {
    const order = invoice.pesanan_event || {};
    const customer = order.pelanggan?.nama_pelanggan || "";
    const matchesText = !needle || [invoice.no_invoice, order.nama_event, customer].join(" ").toLowerCase().includes(needle);
    const matchesFilter = state.filter === "all" ||
      (state.filter === "paid" && invoice.status_bayar === "Lunas") ||
      (state.filter === "unpaid" && invoice.status_bayar === "Belum Lunas");
    return matchesText && matchesFilter;
  });
  $("#invoiceCount").textContent = `${filtered.length} invoice`;
  const rows = $("#invoiceRows");
  if (!filtered.length) {
    rows.innerHTML = `<tr><td colspan="6"><div class="empty-state"><strong>${state.invoices.length ? "Tidak ada invoice yang cocok" : "Belum ada invoice"}</strong><p>${state.invoices.length ? "Coba ubah kata kunci atau filter status." : "Invoice akan muncul setelah booking pertama disimpan."}</p></div></td></tr>`;
    return;
  }
  rows.innerHTML = filtered.map((invoice) => {
    const order = invoice.pesanan_event || {};
    const customer = order.pelanggan?.nama_pelanggan || "—";
    const paid = invoice.status_bayar === "Lunas";
    return `<tr>
      <td><div class="invoice-id">${escapeHtml(invoice.no_invoice)}</div><div class="customer-event">Order #${invoice.pesanan_id} · due ${formatDate(invoice.tanggal_tempo)}</div></td>
      <td><div class="customer-name">${escapeHtml(customer)}</div><div class="customer-event">${escapeHtml(order.nama_event || "—")} · ${escapeHtml(order.jenis_paket || "—")}</div></td>
      <td>${formatDate(order.tanggal_event)}<div class="customer-event">${order.jumlah_pax || 0} pax</div></td>
      <td class="money">${formatMoney(invoice.total_tagihan)}</td>
      <td><span class="status ${paid ? "paid" : "unpaid"}">${paid ? "Lunas" : "Belum Lunas"}</span></td>
      <td>
        <div class="row-actions">
          ${paid ? "" : `<button class="button button-primary settle-button" data-id="${invoice.id}">Tandai lunas</button>`}
          <button class="button button-secondary edit-button" data-id="${invoice.id}">Edit</button>
          <button class="button button-secondary delete-button" data-id="${invoice.id}">Hapus</button>
        </div>
      </td>
    </tr>`;
  }).join("");
  $$(".settle-button").forEach((button) => button.addEventListener("click", () => settleInvoice(button.dataset.id)));
  $$(".edit-button").forEach((button) => button.addEventListener("click", () => openEditModal(button.dataset.id)));
  $$(".delete-button").forEach((button) => button.addEventListener("click", () => deleteInvoice(button.dataset.id)));
}

function findInvoice(id) {
  return state.invoices.find((invoice) => String(invoice.id) === String(id));
}

function updateEditEstimate() {
  const form = $("#editForm");
  $("#editEstimatedTotal").textContent = formatMoney(Backend.hitungTagihan(form.pax.value, form.pricePerPax.value).total);
}

function openEditModal(id) {
  const invoice = findInvoice(id);
  if (!invoice) return;
  const order = invoice.pesanan_event || {};
  const form = $("#editForm");
  form.dataset.invoiceId = invoice.id;
  form.dataset.pesananId = invoice.pesanan_id;
  form.eventName.value = order.nama_event || "";
  form.eventDate.value = order.tanggal_event ? String(order.tanggal_event).slice(0, 10) : "";
  form.packageType.value = order.jenis_paket || "";
  form.pax.value = order.jumlah_pax || "";
  form.pricePerPax.value = order.harga_per_pax || "";
  form.statusBayar.value = invoice.status_bayar || "Belum Lunas";
  form.billingDate.value = invoice.tanggal_tagihan ? String(invoice.tanggal_tagihan).slice(0, 10) : "";
  form.dueDate.value = invoice.tanggal_tempo ? String(invoice.tanggal_tempo).slice(0, 10) : "";
  $("#editMessage").textContent = "";
  $("#editMessage").className = "";
  updateEditEstimate();
  $("#editDialog").showModal();
}

async function submitEditForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#editMessage");
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  message.textContent = "Menyimpan perubahan...";
  message.className = "";

  try {
    await Backend.ubahBooking({
      invoiceId: form.dataset.invoiceId,
      pesananId: form.dataset.pesananId,
      values: {
        eventName: form.eventName.value,
        eventDate: form.eventDate.value,
        packageType: form.packageType.value,
        pax: form.pax.value,
        pricePerPax: form.pricePerPax.value,
        statusBayar: form.statusBayar.value,
        billingDate: form.billingDate.value,
        dueDate: form.dueDate.value,
      },
    });
    showToast("Perubahan berhasil disimpan.");
    $("#editDialog").close();
    await Promise.all([loadInvoices(), loadDashboard()]);
  } catch (error) {
    message.textContent = `Perubahan belum tersimpan: ${error.message}`;
    message.className = "is-error";
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteInvoice(id) {
  const invoice = findInvoice(id);
  if (!invoice) return;
  const order = invoice.pesanan_event || {};
  const confirmed = window.confirm(
    `Hapus booking "${order.nama_event || "ini"}" beserta invoice ${invoice.no_invoice}? Tindakan ini tidak bisa dibatalkan.`
  );
  if (!confirmed) return;
  const button = document.querySelector(`.delete-button[data-id="${id}"]`);
  if (button) button.disabled = true;
  try {
    await Backend.hapusBooking(invoice.pesanan_id);
  } catch (error) {
    if (button) button.disabled = false;
    showToast(`Gagal menghapus: ${error.message}`, true);
    return;
  }
  showToast("Booking dan invoice berhasil dihapus.");
  await Promise.all([loadInvoices(), loadDashboard()]);
}

async function settleInvoice(id) {
  const button = document.querySelector(`.settle-button[data-id="${id}"]`);
  if (button) button.disabled = true;
  try {
    await Backend.tandaiLunas(id);
  } catch (error) {
    if (button) button.disabled = false;
    showToast(`Invoice belum dapat dilunasi: ${error.message}`, true);
    return;
  }
  showToast("Invoice berhasil ditandai lunas.");
  await Promise.all([loadInvoices(), loadDashboard()]);
}

function updateEstimate() {
  const pax = document.querySelector('[name="pax"]').value;
  const price = document.querySelector('[name="pricePerPax"]').value;
  $("#estimatedTotal").textContent = formatMoney(Backend.hitungTagihan(pax, price).total);
}

async function submitBooking(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#bookingMessage");
  const values = Object.fromEntries(new FormData(form).entries());
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  message.textContent = "Menyimpan customer, pesanan, dan invoice...";
  message.className = "";

  try {
    const { noInvoice } = await Backend.simpanBooking(values);
    form.reset();
    message.textContent = `Booking berhasil dicatat. Invoice ${noInvoice} dibuat.`;
    message.className = "is-success";
    showToast("Booking dan invoice berhasil disimpan.");
    await loadDashboard();
  } catch (error) {
    message.textContent = `Booking belum tersimpan: ${error.message}`;
    message.className = "is-error";
    showToast("Booking belum tersimpan.", true);
  } finally {
    submitButton.disabled = false;
    updateEstimate();
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character]));
}

function initialize() {
  const formattedToday = dateFormatter.format(new Date());
  $("#sidebarDate").textContent = formattedToday;
  $("#topbarDate").textContent = formattedToday;
  setConfigBanner();

  $$("[data-tab]").forEach((button) => button.addEventListener("click", () => setActiveTab(button.dataset.tab)));
  $("#bookingForm").addEventListener("submit", submitBooking);
  $("#bookingForm").addEventListener("reset", () => window.setTimeout(updateEstimate, 0));
  ['[name="pax"]', '[name="pricePerPax"]'].forEach((selector) => $(selector).addEventListener("input", updateEstimate));
  $("#invoiceSearch").addEventListener("input", (event) => { state.search = event.target.value; renderInvoices(); });
  $("#invoiceFilter").addEventListener("change", (event) => { state.filter = event.target.value; renderInvoices(); });

  $("#editForm").addEventListener("submit", submitEditForm);
  ['[name="pax"]', '[name="pricePerPax"]'].forEach((selector) =>
    $("#editForm").querySelector(selector).addEventListener("input", updateEditEstimate)
  );
  $("#editCancelButton").addEventListener("click", () => $("#editDialog").close());
  $("#editDialog").addEventListener("click", (event) => {
    if (event.target === $("#editDialog")) $("#editDialog").close();
  });

  setActiveTab("dashboard");
  loadDashboard();
  loadInvoices();
}

initialize();