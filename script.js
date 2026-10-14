(() => {
  "use strict";

  const STORAGE_KEY = "pharmasafe_records_v1";
  const $ = (id) => document.getElementById(id);
  const form = $("form");
  const els = {
    id: $("id"), name: $("name"), batch: $("batch"), expiry: $("expiry"),
    qty: $("qty"), threshold: $("threshold"), category: $("category"),
    body: $("body"), empty: $("empty"), search: $("search"), filter: $("filter"),
    message: $("message"), formTitle: $("formTitle"), save: $("save"),
    cancel: $("cancel"), recordCount: $("recordCount")
  };

  let records = loadRecords();

  function loadRecords() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter((r) => r && r.id) : [];
    } catch (error) {
      return [];
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch (error) {
      showMessage("Could not save. Browser storage may be full or disabled.", true);
      return false;
    }
  }

  function todayLocal() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseLocalDate(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function dayDifference(date) {
    return Math.round((date.getTime() - todayLocal().getTime()) / 86400000);
  }

  function getFlags(record) {
    const date = parseLocalDate(record.expiry);
    const days = date ? dayDifference(date) : null;
    return {
      expired: days !== null && days < 0,
      soon: days !== null && days >= 0 && days <= 30,
      low: Number(record.qty) <= Number(record.threshold),
      days
    };
  }

  function flagsForFilter(record, filter) {
    const flags = getFlags(record);
    if (filter === "expired") return flags.expired;
    if (filter === "soon") return flags.soon;
    if (filter === "low") return flags.low;
    if (filter === "ok") return !flags.expired && !flags.soon && !flags.low;
    return true;
  }

  function showMessage(message, isError = false) {
    els.message.textContent = message;
    els.message.classList.toggle("error", isError);
  }

  function formatDate(value) {
    const date = parseLocalDate(value);
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function statusMarkup(record) {
    const f = getFlags(record);
    const badges = [];
    if (f.expired) badges.push('<span class="status-badge status-expired">Expired</span>');
    else if (f.soon) badges.push('<span class="status-badge status-soon">Expiring soon</span>');
    if (f.low) badges.push('<span class="status-badge status-low">Low stock</span>');
    if (!badges.length) badges.push('<span class="status-badge status-ok">On track</span>');
    return `<div class="status-list">${badges.join("")}</div>`;
  }

  function render() {
    const query = els.search.value.trim().toLowerCase();
    const filter = els.filter.value;
    const filtered = records.filter((record) => {
      const matchesText = `${record.name} ${record.batch} ${record.category}`.toLowerCase().includes(query);
      return matchesText && flagsForFilter(record, filter);
    });

    const units = records.reduce((sum, record) => sum + (Number(record.qty) || 0), 0);
    $("total").textContent = records.length.toLocaleString("en-IN");
    $("units").textContent = units.toLocaleString("en-IN");
    $("soon").textContent = records.filter((r) => getFlags(r).soon && !getFlags(r).expired).length.toLocaleString("en-IN");
    $("expired").textContent = records.filter((r) => getFlags(r).expired).length.toLocaleString("en-IN");
    $("low").textContent = records.filter((r) => getFlags(r).low).length.toLocaleString("en-IN");

    els.body.innerHTML = filtered.map((record) => `
      <tr>
        <td><div class="medicine-cell"><strong>${escapeHTML(record.name)}</strong><small>Batch: ${escapeHTML(record.batch)}</small></div></td>
        <td><span class="category-pill">${escapeHTML(record.category)}</span></td>
        <td>${formatDate(record.expiry)}</td>
        <td><span class="quantity-value">${Number(record.qty).toLocaleString("en-IN")}</span> units</td>
        <td>${statusMarkup(record)}</td>
        <td class="action-cell">
          <button type="button" class="action-btn" data-action="edit" data-id="${escapeHTML(record.id)}">Edit</button>
          <button type="button" class="action-btn delete" data-action="delete" data-id="${escapeHTML(record.id)}">Delete</button>
        </td>
      </tr>`).join("");

    els.empty.hidden = filtered.length > 0;
    if (filtered.length === 0 && records.length > 0) {
      els.empty.querySelector("strong").textContent = "No matching records";
      els.empty.querySelector("p").textContent = "Try another search term or filter.";
      $("sample").hidden = true;
    } else {
      els.empty.querySelector("strong").textContent = "No medicine records yet";
      els.empty.querySelector("p").textContent = "Add a medicine above or load sample records to explore the dashboard.";
      $("sample").hidden = false;
    }
    els.recordCount.textContent = `Showing ${filtered.length} of ${records.length} record${records.length === 1 ? "" : "s"}`;
  }

  function resetForm() {
    form.reset();
    els.id.value = "";
    els.threshold.value = "10";
    els.formTitle.textContent = "Add medicine record";
    els.save.innerHTML = "<span>＋</span> Save medicine";
    els.cancel.hidden = true;
    showMessage("");
  }

  function startEdit(id) {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    els.id.value = record.id;
    els.name.value = record.name;
    els.batch.value = record.batch;
    els.expiry.value = record.expiry;
    els.qty.value = record.qty;
    els.threshold.value = record.threshold;
    els.category.value = record.category;
    els.formTitle.textContent = "Edit medicine record";
    els.save.textContent = "Save changes";
    els.cancel.hidden = false;
    showMessage("Editing the selected record.");
    $("medicine-form").scrollIntoView({ behavior: "smooth", block: "start" });
    els.name.focus({ preventScroll: true });
  }

  function validInteger(value) {
    return value !== "" && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = els.name.value.trim();
    const batch = els.batch.value.trim();
    const expiryDate = parseLocalDate(els.expiry.value);
    const qty = els.qty.value;
    const threshold = els.threshold.value;

    if (!name || !batch || !expiryDate || !validInteger(qty) || !validInteger(threshold)) {
      showMessage("Please complete every required field with valid values.", true);
      return;
    }

    const existingIndex = records.findIndex((r) => r.id === els.id.value);
    const record = {
      id: els.id.value || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      name, batch, expiry: els.expiry.value,
      qty: Number(qty), threshold: Number(threshold), category: els.category.value
    };

    if (existingIndex >= 0) records[existingIndex] = record;
    else records.unshift(record);

    if (!persist()) {
      records = loadRecords();
      render();
      return;
    }
    render();
    resetForm();
    showMessage(existingIndex >= 0 ? "Medicine record updated successfully." : "Medicine saved successfully.");
  });

  $("clear").addEventListener("click", resetForm);
  els.cancel.addEventListener("click", resetForm);
  $("addNew").addEventListener("click", () => {
    resetForm();
    $("medicine-form").scrollIntoView({ behavior: "smooth", block: "start" });
    els.name.focus({ preventScroll: true });
  });

  $("sample").addEventListener("click", () => {
    if (records.length && !confirm("Add demo records to your existing inventory? Existing records will be kept.")) return;
    const today = todayLocal();
    const plusDays = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const samples = [
      { name: "Paracetamol 500 mg", batch: "PCM-2401", expiry: plusDays(240), qty: 120, threshold: 20, category: "Tablet" },
      { name: "Vitamin C 500 mg", batch: "VTC-1182", expiry: plusDays(18), qty: 80, threshold: 15, category: "Tablet" },
      { name: "Cough Relief Syrup", batch: "CRS-0914", expiry: plusDays(-12), qty: 16, threshold: 10, category: "Syrup" },
      { name: "Amoxicillin 250 mg", batch: "AMX-5502", expiry: plusDays(130), qty: 6, threshold: 10, category: "Capsule" }
    ];
    const existingBatches = new Set(records.map((r) => r.batch.toLowerCase()));
    const fresh = samples.filter((r) => !existingBatches.has(r.batch.toLowerCase()))
      .map((r) => ({ ...r, id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}` }));
    records = [...fresh, ...records];
    if (!persist()) { records = loadRecords(); render(); return; }
    render();
    showMessage(`${fresh.length} demo record${fresh.length === 1 ? "" : "s"} added. Demo data is fictional.`);
  });

  els.body.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = button.dataset.id;
    if (button.dataset.action === "edit") startEdit(id);
    if (button.dataset.action === "delete") {
      const record = records.find((r) => r.id === id);
      if (!record || !confirm(`Delete "${record.name}" (batch ${record.batch})?`)) return;
      records = records.filter((r) => r.id !== id);
      if (persist()) {
        if (els.id.value === id) resetForm();
        render();
        showMessage("Medicine record deleted.");
      } else { records = loadRecords(); render(); }
    }
  });

  $("clearAll").addEventListener("click", () => {
    if (!records.length) { showMessage("There are no records to delete."); return; }
    if (!confirm("Delete ALL medicine records from this browser? This cannot be undone.")) return;
    const oldRecords = records;
    records = [];
    if (persist()) { resetForm(); render(); showMessage("All medicine records deleted."); }
    else { records = oldRecords; render(); }
  });

  els.search.addEventListener("input", render);
  els.filter.addEventListener("change", render);

  function exportCSV() {
    if (!records.length) {
      showMessage("There are no records to export yet.", true);
      return;
    }
    const headers = ["Medicine name", "Batch number", "Category", "Expiry date", "Quantity", "Low-stock threshold", "Status"];
    const rows = records.map((r) => {
      const flags = getFlags(r);
      const statuses = [];
      if (flags.expired) statuses.push("Expired");
      else if (flags.soon) statuses.push("Expiring soon");
      if (flags.low) statuses.push("Low stock");
      if (!statuses.length) statuses.push("On track");
      return [r.name, r.batch, r.category, r.expiry, r.qty, r.threshold, statuses.join("; ")];
    });
    const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pharmasafe-inventory-${todayLocal().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showMessage("CSV export downloaded.");
  }

  $("export").addEventListener("click", exportCSV);
  $("export2").addEventListener("click", exportCSV);

  render();
})();
