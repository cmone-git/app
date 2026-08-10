import { saveClientSubdocument, listClientSubcollection } from "./client-service.js";

function refreshPageIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons({ attrs: { "stroke-width": 2 } });
  }
}

export async function renderPage(id, title) {
  const root = document.getElementById("app");

  root.innerHTML = `
    <header class="topbar">
      <button id="mobileMenu" class="icon-btn">
        <i data-lucide="menu"></i>
      </button>

      <div>
        <h1>${title}</h1>
        <p>${description(id)}</p>
      </div>

      <img
        src="assets/logo.png"
        class="top-logo"
        onerror="this.style.display='none'"
      >
    </header>

    <main class="content">
      ${pageTemplate(id, title)}
    </main>
  `;

  if (["credentials", "compliance", "contact", "ledgers", "vouchers", "voucher-sales"].includes(id)) {
    bindClientSubcollectionPage(id);
  }

  // IMPORTANT: render Lucide icons after inserting HTML
  refreshPageIcons();
}