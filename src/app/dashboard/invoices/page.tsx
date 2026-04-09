import Link from "next/link"
import dbConnect from "@/lib/mongodb"
import InvoiceModel from "@/model/InvoiceModel"
import { 
  Search, Bell, HelpCircle, Wallet, Clock, AlertTriangle, 
  Calendar, Filter, Eye, Download, Send, Plus, CheckCircle
} from "lucide-react"

// --- Helper for Status Colors ---
function getStatusBadge(status: string) {
  switch(status.toLowerCase()) {
    case 'paid':
      return "bg-emerald-100 text-emerald-700";
    case 'pending':
    case 'unpaid':
      return "bg-amber-100 text-amber-700";
    case 'overdue':
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function InvoicesDashboardPage() {
  await dbConnect();

  // --- 1. FETCH LIVE DATA ---
  // Grab all invoices from the database, newest first
  const invoices = await InvoiceModel.find({}).sort({ createdAt: -1 }).lean();

  // --- 2. CRUNCH THE KPIs ---
  const stats = invoices.reduce((acc: any, inv: any) => {
    const amount = inv.totals?.netAmount || 0;
    acc.totalRevenue += amount;
    
    if (inv.status === "Unpaid" || inv.status === "Pending") {
      acc.outstanding += amount;
    }
    if (inv.status === "Overdue") {
      acc.overdue += amount;
    }
    return acc;
  }, { totalRevenue: 0, outstanding: 0, overdue: 0 });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans pb-16">
      
      {/* TOP NAV BAR (Optional: Remove if you have a global layout header) */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm flex justify-between items-center h-16 px-8">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search invoices, jobs, or clients..." 
              className="bg-slate-100 border-none rounded-lg py-2 pl-10 pr-4 text-sm w-80 focus:ring-2 focus:ring-slate-300 transition-all outline-none" 
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <button className="p-2 hover:text-slate-900 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 hover:text-slate-900 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
          <button className="text-sm font-medium hover:text-slate-900 transition-all">Support</button>
        </div>
      </header>

      {/* DASHBOARD CANVAS */}
      <div className="pt-10 px-8 lg:px-12 max-w-[1600px] mx-auto">
        
        {/* PAGE HEADER */}
        <div className="flex justify-between items-end mt-4 mb-10 px-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Invoice Management</h1>
            <p className="text-slate-500 text-sm">Monitor revenue cycles and track global freight billing.</p>
          </div>
          <Link href="/dashboard/invoices/new" className="bg-black text-white p-4 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Invoice
          </Link>
        </div>

        {/* KPI BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          <div className="bg-slate-200/50 p-1 rounded-xl">
            <div className="bg-white p-8 rounded-lg flex flex-col gap-4 border border-slate-100 m-0">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                  <Wallet className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">+12.5%</span>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Total Revenue</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">₹{stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
              </div>
            </div>
          </div>

          <div className="bg-slate-200/50 p-1 rounded-xl">
            <div className="bg-white p-8 rounded-lg flex flex-col gap-4 border border-slate-100">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-slate-100 rounded-full text-slate-600">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 px-2 py-1">MTD</span>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Outstanding Receivables</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">₹{stats.outstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
              </div>
            </div>
          </div>

          <div className="bg-slate-200/50 p-1 rounded-xl">
            <div className="bg-white p-8 rounded-lg flex flex-col gap-4 border border-slate-100">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-red-50 rounded-full text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">ACTION REQ.</span>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Overdue Amount</p>
                <h2 className="text-3xl font-black text-red-600 tracking-tighter">₹{stats.overdue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
              </div>
            </div>
          </div>

        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-200/50 rounded-lg p-1">
              <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-white shadow-sm text-slate-900">All Invoices</button>
              <button className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">Paid</button>
              <button className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">Pending</button>
              <button className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">Overdue</button>
            </div>
            <div className="h-6 w-[1px] bg-slate-300"></div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-slate-400 transition-all">
              <Calendar className="w-4 h-4" /> Last 30 Days
            </button>
          </div>
          <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <Filter className="w-4 h-4" /> Advanced Filters
          </button>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Invoice ID</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Job Reference</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">No invoices generated yet. Create your first one above!</td>
                </tr>
              )}

              {invoices.map((inv: any) => (
                <tr key={inv._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5 font-mono text-xs font-bold text-slate-900">{inv.invoiceNo}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-slate-900">{inv.customerDetails?.name || "Unknown"}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-blue-600">{inv.jobId?.toString().slice(-6).toUpperCase() || "N/A"}</span>
                  </td>
                  <td className="px-6 py-5 font-mono text-sm font-bold text-slate-900 text-right">
                    ₹{inv.totals?.netAmount?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${getStatusBadge(inv.status || 'Pending')}`}>
                      {inv.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"><Download className="w-4 h-4" /></button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"><Send className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
          
          {/* PAGINATION */}
          <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Showing {invoices.length} total invoices</span>
          </div>
        </div>

        {/* BOTTOM CHARTS (Editorial Feel) */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-slate-200/50 p-1 rounded-xl">
            <div className="bg-white p-6 rounded-lg border border-slate-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Payment Velocity</h3>
              <div className="flex items-end gap-3 h-48">
                <div className="flex-1 bg-slate-200 rounded-t-sm hover:bg-slate-300 transition-colors" style={{ height: '60%' }}></div>
                <div className="flex-1 bg-slate-200 rounded-t-sm hover:bg-slate-300 transition-colors" style={{ height: '45%' }}></div>
                <div className="flex-1 bg-slate-900 rounded-t-sm" style={{ height: '85%' }}></div>
                <div className="flex-1 bg-slate-200 rounded-t-sm hover:bg-slate-300 transition-colors" style={{ height: '55%' }}></div>
                <div className="flex-1 bg-slate-200 rounded-t-sm hover:bg-slate-300 transition-colors" style={{ height: '70%' }}></div>
                <div className="flex-1 bg-slate-200 rounded-t-sm hover:bg-slate-300 transition-colors" style={{ height: '40%' }}></div>
                <div className="flex-1 bg-slate-200 rounded-t-sm hover:bg-slate-300 transition-colors" style={{ height: '65%' }}></div>
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}