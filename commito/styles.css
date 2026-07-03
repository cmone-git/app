* { -webkit-tap-highlight-color: transparent; }  
body { background-color: #f1f5f9; color: #0f172a; font-size: 14.5px; } 

::-webkit-scrollbar { width: 5px; height: 5px; }  
::-webkit-scrollbar-track { background: transparent; }  
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }  
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.sidebar-transition { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }  

/* --- Collapsed Sidebar Rules --- */
.sidebar-collapsed { width: 88px !important; }
.sidebar-collapsed .sidebar-text,
.sidebar-collapsed .nav-item span { display: none !important; }
.sidebar-collapsed .chevron-icon { display: none !important; }
.sidebar-collapsed .submenu { display: none !important; }
.sidebar-collapsed .nav-item { padding: 0.75rem 0 !important; justify-content: center !important; }
.sidebar-collapsed .nav-item > div { justify-content: center !important; gap: 0 !important; width: 100% !important; margin: 0 !important; }
.sidebar-collapsed .nav-item i { margin: 0 !important; }
.sidebar-collapsed .logo-inner { display: none !important; } /* Hide logo text/img to center the button */
.sidebar-collapsed .logo-wrapper { justify-content: center !important; padding: 0 !important; }
.sidebar-collapsed #sidebar-toggle-btn { display: flex !important; }

/* Submenu Accordion */
.submenu { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-out; }
.submenu.open { max-height: 1200px; } 

.brand-logo-text { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
.brand-logo-text span { color: #00b955; }

/* Clean Crisp Corporate Cards */
.card-classic { 
    background: white; 
    border-radius: 0.75rem; 
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); 
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
}

/* Nav Link Highlights for Dark Background */
.nav-item { border-left: 3px solid transparent; color: #94a3b8; }
.nav-item.active { background-color: rgba(255, 255, 255, 0.1) !important; color: #ffffff !important; border-radius: 9999px; border-left: none; }
.nav-item.active svg { color: #00b955 !important; }
.nav-item:hover:not(.active) { background-color: rgba(255, 255, 255, 0.05); color: #ffffff !important; border-radius: 9999px; }
.nav-item:hover:not(.active) svg { color: #ffffff !important; }

/* Calendar Components */
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
.cal-day { padding: 4px; font-size: 13px; font-weight: 600; color: #475569; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
.cal-day.pending { background-color: #fef3c7; color: #d97706; font-weight: 800; border: 1px solid #fde68a; cursor: pointer; }
.cal-day.active { background-color: #00b955; color: white; }

/* Dynamic Splash Screen */
#splash-screen {
    position: fixed; inset: 0; z-index: 9999;
    background-color: #00b955;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    transition: opacity 0.5s ease-in-out;
}

@keyframes spin-slow { 100% { transform: rotate(360deg); } }  
.syncing { animation: spin-slow 1s linear infinite; }
