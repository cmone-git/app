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
    icon: "▦",
    children: [
      ["companysetup", "Company Setup", "companysetup.html"],
      ["branches", "Branches", "branches.html"],
      ["users", "Users", "users.html"]
    ]
  },
  {
    title: "CLIENTS",
    icon: "♙",
    children: [
      ["clients", "Clients", "clients.html"],
      ["credentials", "Credentials", "credentials.html"],
      ["compliance", "Compliance", "compliance.html"],
      ["contact", "Contacts", "contact.html"]
    ]
  },
  {
    title: "VOUCHERS",
    icon: "▤",
    children: [
      ["ledgers", "Ledgers", "ledgers.html"],
      ["vouchers", "Vouchers", "vouchers.html"]
    ]
  },
  {
    title: "BILLINGS AND PAYMENTS",
    icon: "₹",
    children: [
      ["qr", "QR", "qr.html"],
      ["voucher-sales", "Voucher Sales", "voucher-sales.html"]
    ]
  },
  {
    title: "REPORTS",
    icon: "▥",
    children: [["report", "Reports", "report.html"]]
  },
  {
    title: "DATA IMPORT & EXPORT",
    icon: "⇅",
    children: [
      ["import", "Import", "import.html"],
      ["export", "Export", "export.html"]
    ]
  },
  {
    title: "MORE",
    icon: "⋯",
    children: [["more", "More", "more.html"]]
  }
];

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
    <a class="nav-home ${active === "index" ? "active" : ""}" href="index.html">⌂ <span>Dashboard</span></a>
    ${menu.map(group => `
      <div class="menu-group">
        <div class="menu-head"><span class="menu-icon">${group.icon}</span>${group.title}</div>
        <div class="submenu">
          ${group.children.map(([id, label, href]) =>
            `<a class="${active === id ? "active" : ""}" href="${href}">${label}</a>`
          ).join("")}
        </div>
      </div>
    `).join("")}
    <button id="logoutBtn" class="logout">⇥ Sign out</button>
  `;
  document.getElementById("logoutBtn").onclick = logout;
}

function pageShell(title, subtitle, body) {
  root.innerHTML = `
    <header class="topbar">
      <button id="mobileMenu" class="icon-btn">☰</button>
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
      <button id="addClient" class="primary">＋ Add Client</button>
    </div>
    <div id="clientTable" class="card"></div>

    <dialog id="clientDialog">
      <form method="dialog" id="clientForm" class="dialog-form">
        <div class="dialog-head"><h2 id="dialogTitle">Register Client</h2><button value="cancel">×</button></div>
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
          <button type="button" id="cancelClient" class="secondary">Cancel</button>
          <button class="primary">Save Client</button>
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
            <td><button class="link-btn" onclick="__editClient('${c.id}')">Edit</button>
                <button class="danger-btn" onclick="__deleteClient('${c.id}')">Delete</button></td>
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
          <div class="hero"><h2>ClientHub CRM</h2><p>Central business management workspace.</p></div>
          <div class="cards">
            <a href="clients.html" class="module-card"><b>Clients</b><span>Master client records and Client IDs</span></a>
            <a href="credentials.html" class="module-card"><b>Credentials</b><span>Client-specific credentials</span></a>
            <a href="compliance.html" class="module-card"><b>Compliance</b><span>Compliance records</span></a>
            <a href="vouchers.html" class="module-card"><b>Vouchers</b><span>Ledgers and voucher transactions</span></a>
          </div>
        `);
      } else if (found) {
        await renderPage(page, found[1]);
      } else {
        pageShell("Page", "", `<div class="card empty">Page not found.</div>`);
      }
    }

    bindMobileMenu();
  });
}

boot();
