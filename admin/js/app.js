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

const root = document.getElementById("app") || document.querySelector("main");
const nav = document.getElementById("sidebar") || document.createElement("div"); // Kept for safety if not in DOM
const backdrop = document.getElementById("sidebar-backdrop");

// 1. Updated Menu with Lucide Icon names
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
    icon: "receipt",
    children: [
      ["ledgers", "Ledgers", "ledgers.html"],
      ["vouchers", "Vouchers", "vouchers.html"]
    ]
  },
  {
    title: "BILLINGS AND PAYMENTS",
    icon: "indian-rupee",
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
    icon: "arrow-up-down",
    children: [
      ["import", "Import", "import.html"],
      ["export", "Export", "export.html"]
    ]
  },
  {
    title: "MORE",
    icon: "menu",
    children: [["more", "More", "more.html"]]
  }
];

function currentPage() {
  const name = location.pathname.split("/").pop() || "index.html";
  return name.replace(".html", "");
}

// 2. Updated to generate the NEW Bottom Navigation
function renderMenu() {
  const active = currentPage();
  
  // Find bottom nav in DOM, or create one if it's missing
  let bottomNav = document.querySelector(".bottom-nav");
  if (!bottomNav) {
    bottomNav = document.createElement("nav");
    bottomNav.className = "bottom-nav";
    document.body.appendChild(bottomNav);
  }

  bottomNav.innerHTML = `
    <a href="index.html" class="nav-item ${active === "index" ? "active" : ""}">
      <i data-lucide="home"></i>
      <span>Home</span>
    </a>
    <a href="clients.html" class="nav-item ${active === "clients" ? "active" : ""}">
      <i data-lucide="users"></i>
      <span>Clients</span>
    </a>
    <a href="compliance.html" class="nav-item ${active === "compliance" ? "active" : ""}">
      <i data-lucide="shield-check"></i>
      <span>Compliance</span>
    </a>
    <a href="more.html" class="nav-item ${active === "more" ? "active" : ""}">
      <i data-lucide="menu"></i>
      <span>Menu</span>
    </a>
  `;
  
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

// 3. Updated Page Shell using the new Header design
function pageShell(title, subtitle, body) {
  if (!root) return;
  root.innerHTML = `
    <header class="bg-white border-b border-gray sticky top-0 z-30 shadow-sm mb-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-yellow shadow-md">
              <i data-lucide="layout-dashboard"></i>
            </div>
            <div class="text-left">
              <h1 class="text-xl font-bold text-navy leading-tight">${title}</h1>
              <p class="text-sm text-navy-soft font-medium">${subtitle || "Client Hub CRM"}</p>
            </div>
          </div>
          <button id="logoutBtn" class="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-800 transition-colors bg-red-50 px-4 py-2 rounded-lg">
            <i data-lucide="log-out" style="width: 18px; height: 18px;"></i> Logout
          </button>
        </div>
      </div>
    </header>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
      ${body}
    </div>
  `;
  
  document.getElementById("logoutBtn").onclick = logout;
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

let clientsCache = [];

// 4. Fully styled dynamic Client Page with new theme
async function clientsPage() {
  pageShell(
    "Client Directory",
    "Master register for all CRM records",
    `
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="relative flex-grow">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i data-lucide="search" class="text-navy-soft" style="width: 20px; height: 20px;"></i>
        </div>
        <input id="clientSearch" class="w-full pl-12 pr-4 py-3.5 bg-white border border-gray shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy text-navy transition-all font-medium text-sm" placeholder="Search ID, name, PAN, GSTIN, mobile...">
      </div>
      <button id="addClient" class="btn-primary whitespace-nowrap">
        <i data-lucide="user-plus"></i> Add Client
      </button>
    </div>
    
    <div id="clientTable" class="bg-white rounded-3xl p-6 sm:p-8 shadow-custom border border-gray/60 overflow-x-auto w-full">
      <!-- Table populated dynamically -->
    </div>

    <!-- NEW HTML5 Dialog Styling -->
    <dialog id="clientDialog" class="bg-transparent p-0 m-auto backdrop:bg-navy/40 backdrop:backdrop-blur-sm rounded-3xl w-full max-w-2xl border-none">
      <form method="dialog" id="clientForm" class="bg-white rounded-3xl shadow-custom border border-gray/60 flex flex-col overflow-hidden w-full max-h-[90vh]">
        <div class="p-6 border-b border-gray flex justify-between items-center bg-gray/30">
          <h2 id="dialogTitle" class="text-xl font-extrabold text-navy">Register Client</h2>
          <button value="cancel" class="text-navy-soft hover:text-red-500 transition-colors">
            <i data-lucide="x"></i>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto space-y-4 text-left">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">Client ID</label>
              <input id="clientId" readonly class="w-full px-4 py-3 text-sm bg-gray/50 border border-gray rounded-xl text-navy-soft font-mono">
            </div>
            <div>
              <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">Client Name *</label>
              <input id="clientName" required class="w-full px-4 py-3 text-sm bg-gray border border-gray/80 rounded-xl focus:ring-2 focus:ring-navy focus:bg-white text-navy">
            </div>
            <div>
              <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">Legal Name</label>
              <input id="legalName" class="w-full px-4 py-3 text-sm bg-gray border border-gray/80 rounded-xl focus:ring-2 focus:ring-navy focus:bg-white text-navy">
            </div>
            <div>
              <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">Mobile</label>
              <input id="mobile" inputmode="numeric" maxlength="10" class="w-full px-4 py-3 text-sm bg-gray border border-gray/80 rounded-xl focus:ring-2 focus:ring-navy focus:bg-white text-navy">
            </div>
            <div>
              <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">Email</label>
              <input id="email" type="email" class="w-full px-4 py-3 text-sm bg-gray border border-gray/80 rounded-xl focus:ring-2 focus:ring-navy focus:bg-white text-navy">
            </div>
            <div>
              <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">Constitution</label>
              <select id="constitution" class="w-full px-4 py-3 text-sm bg-gray border border-gray/80 rounded-xl focus:ring-2 focus:ring-navy focus:bg-white text-navy">
                <option>Individual</option><option>Proprietorship</option><option>Partnership</option>
                <option>Private Limited</option><option>LLP</option><option>HUF</option><option>Trust</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">PAN</label>
              <input id="pan" class="w-full px-4 py-3 text-sm bg-gray border border-gray/80 rounded-xl focus:ring-2 focus:ring-navy focus:bg-white text-navy font-mono">
            </div>
            <div>
              <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">GSTIN</label>
              <input id="gstin" class="w-full px-4 py-3 text-sm bg-gray border border-gray/80 rounded-xl focus:ring-2 focus:ring-navy focus:bg-white text-navy font-mono">
            </div>
            <div>
              <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">Aadhaar Ref</label>
              <input id="aadhaar" maxlength="12" class="w-full px-4 py-3 text-sm bg-gray border border-gray/80 rounded-xl focus:ring-2 focus:ring-navy focus:bg-white text-navy font-mono">
            </div>
            <div>
              <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">Status</label>
              <select id="status" class="w-full px-4 py-3 text-sm bg-gray border border-gray/80 rounded-xl focus:ring-2 focus:ring-navy focus:bg-white text-navy">
                <option>Active</option><option>Inactive</option><option>Pending</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-xs font-bold text-navy-soft uppercase tracking-wider mb-2">Address</label>
            <textarea id="address" rows="2" class="w-full px-4 py-3 text-sm bg-gray border border-gray/80 rounded-xl focus:ring-2 focus:ring-navy focus:bg-white text-navy"></textarea>
          </div>
        </div>
        
        <div class="p-6 border-t border-gray flex justify-end gap-3 bg-gray/30">
          <button type="button" id="cancelClient" class="px-6 py-3 rounded-xl font-bold text-navy-soft bg-white border border-gray shadow-sm hover:bg-gray transition-colors">Cancel</button>
          <button type="submit" class="btn-primary">
            <i data-lucide="save"></i> Save Client
          </button>
        </div>
      </form>
    </dialog>
    `
  );

  const dialog = document.getElementById("clientDialog");
  let editing = null;

  const fields = ["clientId","clientName","legalName","mobile","email","constitution","pan","gstin","aadhaar","status","address"];
  const getForm = () => Object.fromEntries(fields.map(k => [k, document.getElementById(k)?.value || ""]));

  document.getElementById("addClient").onclick = async () => {
    editing = null;
    document.getElementById("dialogTitle").textContent = "Register Client";
    document.getElementById("clientId").value = await getNextClientId();
    fields.filter(x => x !== "clientId").forEach(k => {
      if(document.getElementById(k)) document.getElementById(k).value = "";
    });
    document.getElementById("constitution").value = "Individual";
    document.getElementById("status").value = "Active";
    dialog.showModal();
    if(typeof lucide !== 'undefined') lucide.createIcons();
  };

  document.getElementById("cancelClient").onclick = () => dialog.close();

  document.getElementById("clientForm").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const data = getForm();
      if (!data.clientName.trim()) return alert("Client Name is required.");

      if (editing) {
        await updateClient(editing.id, data);
      } else {
        await createClient(data);
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
    document.getElementById("dialogTitle").textContent = `Edit Client: ${c.id}`;
    fields.forEach(k => {
      if (document.getElementById(k)) document.getElementById(k).value = c[k] ?? "";
    });
    dialog.showModal();
  };

  window.__deleteClient = async (id) => {
    if (!confirm(`Delete ${id}? This deletes only the master client document.`)) return;
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
    
    // Updated Table Rendering with new styles
    document.getElementById("clientTable").innerHTML = rows.length ? `
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray">
            <th class="pb-3 text-xs font-bold text-navy-soft uppercase tracking-wider">Client ID</th>
            <th class="pb-3 text-xs font-bold text-navy-soft uppercase tracking-wider">Client Name</th>
            <th class="pb-3 text-xs font-bold text-navy-soft uppercase tracking-wider">Mobile</th>
            <th class="pb-3 text-xs font-bold text-navy-soft uppercase tracking-wider">PAN / GSTIN</th>
            <th class="pb-3 text-xs font-bold text-navy-soft uppercase tracking-wider">Status</th>
            <th class="pb-3 text-xs font-bold text-navy-soft uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-gray/40">
          ${rows.map(c => `
          <tr class="hover:bg-gray/20 transition-colors">
            <td class="py-4 font-mono font-medium text-navy-soft">${c.id}</td>
            <td class="py-4">
              <div class="font-bold text-navy text-base">${esc(c.clientName)}</div>
              <div class="text-xs text-navy-soft mt-0.5">${esc(c.constitution)}</div>
            </td>
            <td class="py-4 font-medium">${esc(c.mobile) || '—'}</td>
            <td class="py-4 font-mono text-xs">
              <div>${esc(c.pan) || '—'}</div>
              <div class="text-navy-soft mt-0.5">${esc(c.gstin) || '—'}</div>
            </td>
            <td class="py-4">
               <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${c.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray border border-gray text-navy-soft'}">
                 ${esc(c.status)}
               </span>
            </td>
            <td class="py-4 text-right">
                <button class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray hover:bg-navy hover:text-white text-navy transition-colors mr-1" onclick="__editClient('${c.id}')" title="Edit">
                  <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
                </button>
                <button class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors" onclick="__deleteClient('${c.id}')" title="Delete">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
            </td>
          </tr>`).join("")}
        </tbody>
      </table>
    ` : `<div class="text-center py-10 text-navy-soft flex flex-col items-center">
           <div class="w-16 h-16 bg-gray rounded-2xl flex items-center justify-center mb-4">
             <i data-lucide="users-2" class="text-navy"></i>
           </div>
           <h3 class="text-lg font-bold text-navy">No clients found</h3>
           <p class="text-sm mt-1">Try adjusting your search criteria.</p>
         </div>`;
         
    if(typeof lucide !== 'undefined') lucide.createIcons();
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
        pageShell("Dashboard", "Central business management workspace", `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
            <a href="clients.html" class="bg-white rounded-2xl p-6 shadow-custom border border-gray/60 hover:border-navy transition-all flex flex-col">
              <div class="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-yellow mb-4"><i data-lucide="users"></i></div>
              <b class="text-lg text-navy mb-1">Clients</b>
              <span class="text-sm text-navy-soft">Master client records and Client IDs</span>
            </a>
            <a href="credentials.html" class="bg-white rounded-2xl p-6 shadow-custom border border-gray/60 hover:border-navy transition-all flex flex-col">
              <div class="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-yellow mb-4"><i data-lucide="key-round"></i></div>
              <b class="text-lg text-navy mb-1">Credentials</b>
              <span class="text-sm text-navy-soft">Client-specific credentials</span>
            </a>
            <a href="compliance.html" class="bg-white rounded-2xl p-6 shadow-custom border border-gray/60 hover:border-navy transition-all flex flex-col">
              <div class="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-yellow mb-4"><i data-lucide="shield-check"></i></div>
              <b class="text-lg text-navy mb-1">Compliance</b>
              <span class="text-sm text-navy-soft">Compliance records</span>
            </a>
            <a href="vouchers.html" class="bg-white rounded-2xl p-6 shadow-custom border border-gray/60 hover:border-navy transition-all flex flex-col">
              <div class="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-yellow mb-4"><i data-lucide="receipt"></i></div>
              <b class="text-lg text-navy mb-1">Vouchers</b>
              <span class="text-sm text-navy-soft">Ledgers and voucher transactions</span>
            </a>
          </div>
        `);
      } else if (found) {
        await renderPage(page, found[1]);
      } else {
        pageShell("Page", "", `<div class="bg-white rounded-3xl p-8 text-center text-navy-soft">Page not found.</div>`);
      }
    }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
  });
}

boot();
