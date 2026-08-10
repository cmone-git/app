import { saveClientSubdocument, listClientSubcollection } from "./client-service.js";

export async function renderPage(id, title) {
  const root = document.getElementById("app");
  root.innerHTML = `
    <header class="topbar">
      <button id="mobileMenu" class="icon-btn">☰</button>
      <div><h1>${title}</h1><p>${description(id)}</p></div>
      <img src="assets/logo.png" class="top-logo" onerror="this.style.display='none'">
    </header>
    <main class="content">
      ${pageTemplate(id, title)}
    </main>
  `;

  if (["credentials","compliance","contact","ledgers","vouchers","voucher-sales"].includes(id)) {
    bindClientSubcollectionPage(id);
  }
}

function description(id) {
  return {
    companysetup:"Company master setup.",
    branches:"Branch management.",
    users:"Application users and roles.",
    credentials:"Client credentials stored under the selected Client ID.",
    compliance:"Client compliance records.",
    contact:"Client contact records.",
    ledgers:"Client ledger accounts.",
    vouchers:"Client voucher transactions.",
    qr:"QR and payment configuration.",
    "voucher-sales":"Voucher sales and billing.",
    report:"Reports and summaries.",
    import:"Import data without duplicating Client IDs.",
    export:"Export application data.",
    more:"Additional application tools."
  }[id] || "ClientHub module.";
}

function pageTemplate(id, title) {
  if (["credentials","compliance","contact","ledgers","vouchers","voucher-sales"].includes(id)) {
    return `
      <div class="card">
        <h2>${title}</h2>
        <p class="muted">All records here are linked to a master Client ID such as <span class="mono">C40001</span>.</p>
        <div class="inline-form">
          <input id="subClientId" placeholder="Enter Client ID, e.g. C40001">
          <button id="loadSub" class="primary">Load</button>
        </div>
        <div id="subData" class="sub-data"></div>
      </div>
    `;
  }

  return `
    <div class="card">
      <h2>${title}</h2>
      <p class="muted">Module ready. This page is separated from the Clients master and can be expanded independently.</p>
      <div class="empty">No records yet.</div>
    </div>
  `;
}

function bindClientSubcollectionPage(id) {
  const subMap = {
    credentials:"credentials",
    compliance:"compliance",
    contact:"contacts",
    ledgers:"ledgers",
    vouchers:"vouchers",
    "voucher-sales":"voucherSales"
  };

  document.getElementById("loadSub").onclick = async () => {
    const clientId = document.getElementById("subClientId").value.trim().toUpperCase();
    const target = document.getElementById("subData");
    if (!/^C\d{5,}$/.test(clientId)) {
      target.innerHTML = `<div class="error">Enter a valid Client ID such as C40001.</div>`;
      return;
    }

    try {
      const rows = await listClientSubcollection(clientId, subMap[id]);
      target.innerHTML = rows.length
        ? `<pre>${escapeHtml(JSON.stringify(rows, null, 2))}</pre>`
        : `<div class="empty">No ${id} records for ${clientId}.</div>`;
    } catch (e) {
      target.innerHTML = `<div class="error">${escapeHtml(e.message || "Unable to load records.")}</div>`;
    }
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
