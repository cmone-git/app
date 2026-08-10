import { watchAuth, logout, getUserProfile } from "./auth.js";
import {
  watchClients,
  createClient,
  createClientWithSpecifiedId,
  updateClient,
  deleteClient,
  getNextClientId
} from "./client-service.js";
import { renderPage } from "./pages.js";

const root = document.getElementById("app");
const nav = document.getElementById("sidebar");
const backdrop = document.getElementById("sidebar-backdrop");

const menu = [
  {
    title: "COMPANY",
    icon: "building-2",
    children: [
      ["companysetup", "Company Setup", "companysetup.html"],
      ["branches", "Branches", "branches.html"],
      ["users", "Users", "users.html"]
    ]
  },
  {
    title: "CLIENTS",
    icon: "users",
    children: [
      ["clients", "Clients", "clients.html"],
      ["credentials", "Credentials", "credentials.html"],
      ["compliance", "Compliance", "compliance.html"],
      ["contact", "Contacts", "contact.html"]
    ]
  },
  {
    title: "VOUCHERS",
    icon: "receipt-text",
    children: [
      ["ledgers", "Ledgers", "ledgers.html"],
      ["vouchers", "Vouchers", "vouchers.html"]
    ]
  },
  {
    title: "BILLINGS AND PAYMENTS",
    icon: "wallet-cards",
    children: [
      ["qr", "QR", "qr.html"],
      ["voucher-sales", "Voucher Sales", "voucher-sales.html"]
    ]
  },
  {
    title: "REPORTS",
    icon: "bar-chart-3",
    children: [["report", "Reports", "report.html"]]
  },
  {
    title: "DATA IMPORT & EXPORT",
    icon: "arrow-down-up",
    children: [
      ["import", "Import", "import.html"],
      ["export", "Export", "export.html"]
    ]
  },
  {
    title: "MORE",
    icon: "ellipsis",
    children: [["more", "More", "more.html"]]
  }
];

const itemIcons = {
  "Company Setup":"building-2",
  "Branches":"git-branch",
  "Users":"users",
  "Clients":"users-round",
  "Credentials":"key-round",
  "Compliance":"shield-check",
  "Contacts":"contact-round",
  "Ledgers":"book-open",
  "Vouchers":"receipt",
  "QR":"qr-code",
  "Voucher Sales":"shopping-bag",
  "Reports":"bar-chart-3",
  "Import":"upload",
  "Export":"download",
  "More":"ellipsis"
};

function icon(name, size = "18") {
  return `<i data-lucide="${name}" width="${size}" height="${size}"></i>`;
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons({
      attrs: { "stroke-width": 2 }
    });
  }
}

function currentPage() {
  const name = location.pathname.split("/").pop() || "index.html";
  return name.replace(".html", "");
}

function renderMenu() {
  const active = currentPage();
  nav.innerHTML = `
    <div class="brand">
      <img src="assets/logo.png" onerror="this.style.display='none'">
      <div><strong>ClientHub</strong><small>CM Filings</small></div>
    </div>
    <a class="nav-home ${active === "index" ? "active" : ""}" href="index.html">${icon("layout-dashboard")}<span>Dashboard</span></a>
    ${menu.map(group => `
      <div class="menu-group">
        <div class="menu-head"><span class="menu-icon">${icon(group.icon)}</span>${group.title}</div>
        <div class="submenu">
          ${group.children.map(([id, label, href]) =>
            `<a class="${active === id ? "active" : ""}" href="${href}">${icon(itemIcons[label] || "circle")}<span>${label}</span></a>`
          ).join("")}
        </div>
      </div>
    `).join("")}
    <button id="logoutBtn" class="logout">${icon("log-out")}<span>Sign out</span></button>
  `;
  document.getElementById("logoutBtn").onclick = logout;
  refreshIcons();

  // Mobile bottom navigation: Home / Clients / Compliance / Menu
  let bottomNav = document.getElementById("mobile-bottom-nav");
  if (!bottomNav) {
    bottomNav = document.createElement("nav");
    bottomNav.id = "mobile-bottom-nav";
    document.body.appendChild(bottomNav);
  }

  const activeBottom = currentPage();
  bottomNav.innerHTML = `
    <a href="index.html" class="${activeBottom === "index" ? "active" : ""}">
      <span class="bottom-icon">${icon("home","24")}</span>
      <span>Home</span>
      ${activeBottom === "index" ? '<span class="bottom-active-mark"></span>' : ''}
    </a>
    <a href="clients.html" class="${activeBottom === "clients" ? "active" : ""}">
      <span class="bottom-icon">${icon("users-round","24")}</span>
      <span>Clients</span>
      ${activeBottom === "clients" ? '<span class="bottom-active-mark"></span>' : ''}
    </a>
    <a href="compliance.html" class="${activeBottom === "compliance" ? "active" : ""}">
      <span class="bottom-icon">${icon("shield-check","24")}</span>
      <span>Compliance</span>
      ${activeBottom === "compliance" ? '<span class="bottom-active-mark"></span>' : ''}
    </a>
    <button type="button" class="menu-bottom" id="bottomMenuBtn">
      <span class="bottom-icon">${icon("menu","24")}</span>
      <span>Menu</span>
    </button>
  `;

  document.getElementById("bottomMenuBtn")?.addEventListener("click", () => {
    nav.classList.toggle("open");
    backdrop.classList.toggle("show");
    refreshIcons();
  });
  refreshIcons();
}

function pageShell(title, subtitle, body) {
  root.innerHTML = `
    <header class="topbar">
      <button id="mobileMenu" class="icon-btn" aria-label="Open menu">${icon("menu","22")}</button>
      <div>
        <h1>${title}</h1>
        <p>${subtitle || ""}</p>
      </div>
      <div class="top-actions">
        <img src="assets/logo.png" class="top-logo" onerror="this.style.display='none'">
      </div>
    </header>
    <main class="content">${body}</main>
  `;
}

function bindMobileMenu() {
  document.getElementById("mobileMenu")?.addEventListener("click", () => {
    nav.classList.toggle("open");
    backdrop.classList.toggle("show");
  });
  backdrop.onclick = () => {
    nav.classList.remove("open");
    backdrop.classList.remove("show");
  };
}

let clientsCache = [];

async function clientsPage() {
  pageShell(
    "Clients",
    "Master client register — every related record is tied to Client ID.",
    `
    <div class="toolbar">
      <input id="clientSearch" placeholder="Search Client ID, name, PAN, GSTIN, mobile...">
      <button id="addClient" class="primary">${icon("user-plus","18")}<span>Add Client</span></button>
    </div>
    <div id="clientTable" class="card"></div>

    <dialog id="clientDialog">
      <form method="dialog" id="clientForm" class="dialog-form">
        <div class="dialog-head"><h2 id="dialogTitle">Register Client</h2><button value="cancel" aria-label="Close">${icon("x","20")}</button></div>
        <div class="grid">
          <label>Client ID<input id="clientId" readonly></label>
          <label>Client Name *<input id="clientName" required></label>
          <label>Legal Name<input id="legalName"></label>
          <label>Mobile<input id="mobile" inputmode="numeric" maxlength="10"></label>
          <label>Email<input id="email" type="email"></label>
          <label>Constitution
            <select id="constitution">
              <option>Individual</option><option>Proprietorship</option><option>Partnership</option>
              <option>Private Limited</option><option>LLP</option><option>HUF</option><option>Trust</option>
            </select>
          </label>
          <label>PAN<input id="pan"></label>
          <label>GSTIN<input id="gstin"></label>
          <label>Aadhaar Reference<input id="aadhaar" maxlength="12"></label>
          <label>Branch ID<input id="branchId" value="HQ"></label>
          <label>Status
            <select id="status"><option>Active</option><option>Inactive</option><option>Pending</option></select>
          </label>
          <label class="full">Address<textarea id="address"></textarea></label>
          <label class="full">Client Cloud Folder URL<input id="folderUrl" type="url"></label>
          <label class="full">Secure Notes / Vault Data<textarea id="notes"></textarea></label>
        </div>
        <div class="dialog-actions">
          <button type="button" id="cancelClient" class="secondary">${icon("x","17")}<span>Cancel</span></button>
          <button class="primary">${icon("check","18")}<span>Save Client</span></button>
        </div>
      </form>
    </dialog>
    `
  );

  const dialog = document.getElementById("clientDialog");
  let editing = null;

  const fields = ["clientId","clientName","legalName","mobile","email","constitution","pan","gstin","aadhaar","branchId","status","address","folderUrl","notes"];
  const getForm = () => Object.fromEntries(fields.map(k => [k, document.getElementById(k).value]));

  document.getElementById("addClient").onclick = async () => {
    editing = null;
    document.getElementById("dialogTitle").textContent = "Register Client";
    document.getElementById("clientId").value = await getNextClientId();
    fields.filter(x => x !== "clientId").forEach(k => document.getElementById(k).value = "");
    document.getElementById("constitution").value = "Individual";
    document.getElementById("status").value = "Active";
    document.getElementById("branchId").value = "HQ";
    dialog.showModal();
  };

  document.getElementById("cancelClient").onclick = () => dialog.close();

  document.getElementById("clientForm").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const data = getForm();
      if (!data.clientName.trim()) return alert("Client Name is required.");

      if (editing) {
        await updateClient(editing.id, data);
        alert(`Updated ${editing.id}`);
      } else {
        // Do not trust the displayed ID for creation.
        const created = await createClient(data);
        alert(`Created ${created.clientId}`);
      }
      dialog.close();
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to save client.");
    }
  };

  window.__editClient = (id) => {
    const c = clientsCache.find(x => x.id === id);
    if (!c) return;
    editing = c;
    document.getElementById("dialogTitle").textContent = `Edit ${c.id}`;
    fields.forEach(k => {
      if (document.getElementById(k)) document.getElementById(k).value = c[k] ?? "";
    });
    dialog.showModal();
  };

  window.__deleteClient = async (id) => {
    if (!confirm(`Delete ${id}? This deletes only the master client document. Related subcollections should be archived/handled separately.`)) return;
    try {
      await deleteClient(id);
    } catch (e) {
      alert(e.message || "Delete failed.");
    }
  };

  const render = () => {
    const q = (document.getElementById("clientSearch").value || "").toLowerCase();
    const rows = clientsCache.filter(c =>
      [c.id,c.clientName,c.legalName,c.pan,c.gstin,c.mobile,c.email]
        .some(v => String(v || "").toLowerCase().includes(q))
    );
    document.getElementById("clientTable").innerHTML = rows.length ? `
      <div class="table-wrap"><table>
        <thead><tr><th>Client ID</th><th>Client Name</th><th>Mobile</th><th>PAN</th><th>GSTIN</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows.map(c => `
          <tr>
            <td class="mono">${c.id}</td>
            <td><strong>${esc(c.clientName)}</strong><small>${esc(c.constitution)}</small></td>
            <td>${esc(c.mobile)}</td>
            <td class="mono">${esc(c.pan)}</td>
            <td class="mono">${esc(c.gstin)}</td>
            <td><span class="status">${esc(c.status)}</span></td>
            <td><button class="link-btn" onclick="__editClient('${c.id}')">${icon("pencil","16")}<span>Edit</span></button>
                <button class="danger-btn" onclick="__deleteClient('${c.id}')">${icon("trash-2","16")}<span>Delete</span></button></td>
          </tr>`).join("")}</tbody>
      </table></div>
    ` : `<div class="empty">No clients found.</div>`;
  };

  document.getElementById("clientSearch").oninput = render;
  const stop = watchClients(list => { clientsCache = list; render(); });
  window.addEventListener("beforeunload", stop, { once: true });
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

async function boot() {
  renderMenu();

  watchAuth(async (user) => {
    if (!user) {
      location.href = "signin.html";
      return;
    }

    document.body.dataset.uid = user.uid;
    const page = currentPage();

    if (page === "clients") {
      await clientsPage();
    } else {
      const found = menu.flatMap(g => g.children).find(x => x[0] === page);
      if (page === "index") {
        pageShell("Dashboard", "ClientHub CRM", `
          <section class="hero">
            <div class="hero-icon">${icon("layout-dashboard","25")}</div>
            <h2>ClientHub CRM</h2>
            <p>Central business management workspace for clients, compliance, accounting records and business operations.</p>
          </section>
          <section class="cards">
            <a href="clients.html" class="module-card">
              <div class="module-icon">${icon("users-round","23")}</div>
              <b>Clients</b><span>Master client records and Client IDs</span>
            </a>
            <a href="credentials.html" class="module-card">
              <div class="module-icon">${icon("key-round","23")}</div>
              <b>Credentials</b><span>Client-specific credentials and secure records</span>
            </a>
            <a href="compliance.html" class="module-card">
              <div class="module-icon yellow">${icon("shield-check","23")}</div>
              <b>Compliance</b><span>Compliance records and statutory tracking</span>
            </a>
            <a href="vouchers.html" class="module-card">
              <div class="module-icon">${icon("receipt-text","23")}</div>
              <b>Vouchers</b><span>Ledgers and voucher transactions</span>
            </a>
          </section>
        `);
      } else if (found) {
        await renderPage(page, found[1]);
      } else {
        pageShell("Page", "", `<div class="card empty">Page not found.</div>`);
      }
    }

    bindMobileMenu();
    refreshIcons();
  });
}

boot();
