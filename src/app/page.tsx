import React from "react";

// --- Sub-components to keep the main page clean ---

const Sidebar = () => (
  <aside className="h-screen w-64 fixed left-0 top-0 border-r-0 bg-slate-50 dark:bg-slate-900 font-inter antialiased tracking-tight flex flex-col py-8 px-6 z-50">
    <div className="mb-10">
      <h1 className="text-lg font-bold tracking-tighter text-slate-900 dark:text-slate-50">Architect Logistician</h1>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Global Command</p>
    </div>
    <nav className="flex-1 space-y-1">
      <a className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors rounded" href="#">
        <span className="material-symbols-outlined text-[20px]">dashboard</span>
        <span className="text-sm">Dashboard</span>
      </a>
      <a className="flex items-center gap-3 px-3 py-2 text-slate-900 dark:text-white font-semibold border-r-2 border-slate-900 dark:border-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors" href="#">
        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
        <span className="text-sm">Jobs</span>
      </a>
      <a className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors rounded" href="#">
        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
        <span className="text-sm">Invoicing</span>
      </a>
      <a className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors rounded" href="#">
        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
        <span className="text-sm">Status</span>
      </a>
      <a className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors rounded" href="#">
        <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
        <span className="text-sm">Reconciliation</span>
      </a>
    </nav>
    <div className="mt-auto border-t border-slate-200/50 pt-6">
      <div className="flex items-center gap-3">
        <img alt="Logistician Executive Profile" className="w-10 h-10 rounded-full object-cover" src="https://ui-avatars.com/api/?name=Alex+Sterling&background=random" />
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Alex Sterling</p>
          <p className="text-[10px] text-slate-500">Fleet Operations</p>
        </div>
      </div>
    </div>
  </aside>
);

const TopNav = () => (
  <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/15 dark:border-slate-800/15 shadow-sm dark:shadow-none flex justify-between items-center h-16 px-8">
    <div className="flex items-center flex-1">
      <div className="relative w-full max-w-md group">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
        <input className="w-full bg-surface-container-highest border-none rounded-lg py-2 pl-10 pr-4 text-sm font-inter focus:ring-2 focus:ring-slate-400 transition-all outline-none" placeholder="Search shipments, vessels, or customers..." type="text" />
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-4">
        <button className="text-slate-500 hover:text-slate-900 transition-all relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
        </button>
        <button className="text-slate-500 hover:text-slate-900 transition-all">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </div>
      <div className="h-6 w-px bg-slate-200"></div>
      <button className="text-slate-500 font-inter text-sm font-medium hover:text-slate-900 transition-all">Support</button>
      <div className="flex items-center gap-2">
        <img alt="User Avatar" className="w-8 h-8 rounded-full border border-slate-200" src="https://ui-avatars.com/api/?name=User&background=random" />
      </div>
    </div>
  </header>
);

const JobTable = () => (
  <div className="bg-surface-container-lowest rounded-2xl shadow-[0_12px_40px_rgba(25,28,30,0.04)] overflow-hidden border border-outline-variant/15">
    {/* Table Filters */}
    <div className="px-8 py-6 flex items-center justify-between border-b border-surface-variant/30">
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded text-sm font-medium text-on-surface">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          Filters
        </button>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-on-surface-variant uppercase px-2">Show:</span>
          <button className="px-3 py-1 text-xs font-bold bg-primary text-on-primary rounded-full">All Jobs</button>
          <button className="px-3 py-1 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-full">Sea</button>
          <button className="px-3 py-1 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-full">Air</button>
          <button className="px-3 py-1 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-full">Road</button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-xs text-on-surface-variant">Showing 1-12 of 1,248 results</p>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-surface-container rounded"><span className="material-symbols-outlined">chevron_left</span></button>
          <button className="p-1 hover:bg-surface-container rounded"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>
      </div>
    </div>

    {/* Table Data */}
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low/50">
            <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Job ID</th>
            <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Customer</th>
            <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Route (Origin/Dest)</th>
            <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Cargo Type</th>
            <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
            <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">ETA Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white">
          <tr className="hover:bg-surface-variant/40 transition-colors group">
            <td className="px-8 py-6"><span className="font-mono text-sm font-bold text-primary">#FR-902341</span></td>
            <td className="px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-[10px]">GL</div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Global Logistics Co.</p>
                  <p className="text-[10px] text-on-surface-variant">Priority Tier 1</p>
                </div>
              </div>
            </td>
            <td className="px-8 py-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Shanghai (CNSHA)</span>
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">trending_flat</span>
                <span className="text-sm font-semibold">Rotterdam (NLRTM)</span>
              </div>
            </td>
            <td className="px-8 py-6">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">directions_boat</span>
                <span className="text-sm">40' Dry High Cube</span>
              </div>
            </td>
            <td className="px-8 py-6">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-on-tertiary-container/15 text-on-tertiary-container">In Transit</span>
            </td>
            <td className="px-8 py-6 text-right">
              <p className="text-sm font-mono font-bold">2024-11-14</p>
              <p className="text-[10px] text-on-surface-variant">5 Days Remaining</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Table Footer */}
    <div className="px-8 py-6 bg-surface-container-low/30 border-t border-surface-variant/30 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <select defaultValue="20" className="bg-transparent border-none text-xs font-bold text-on-surface-variant focus:ring-0 cursor-pointer">
          <option value="10">10 Rows</option>
          <option value="20">20 Rows</option>
          <option value="50">50 Rows</option>
        </select>
        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Select multiple jobs to bulk invoice</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 text-xs font-bold text-primary hover:bg-surface-container-high transition-colors rounded uppercase tracking-wider">Export CSV</button>
        <button className="px-4 py-2 text-xs font-bold text-primary hover:bg-surface-container-high transition-colors rounded uppercase tracking-wider">Print Manifest</button>
      </div>
    </div>
  </div>
);

// --- Main Page Assembly ---

export default function Home() {
  return (
    <>
    Nice</>
  );
}