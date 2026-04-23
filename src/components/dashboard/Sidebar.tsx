"use client"
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  Wallet, 
  ScrollText,
  Folders,
  UsersRound,
  HandCoins,
  Scale,
  LogOut,
  ChevronRight,
  ShieldCheck
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { INTERNAL_COMPANIES } from "@/lib/constants"

export default function Sidebar() {
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState("ICM");
  const [branchName, setBranchName] = useState("Systems");

  useEffect(() => {
    const tenantId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("tenant-id="))
      ?.split("=")[1];

    if (tenantId) {
      const company = INTERNAL_COMPANIES.find(c => c.id === tenantId);
      if (company) {
        setCompanyName(company.name);
      }
    }
  }, []);
  
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-white border-r border-slate-100 flex flex-col py-8 px-6 z-50">
      <div className="mb-8 px-2">
        <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight uppercase">
                    {companyName}
                  </h1>
                </div>
                <Link 
                  href="/select-company"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors mt-1 group"
                >
                  Switch Entity
                  <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </div>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">
            Global Logistics Command
        </p>
      </div>

      <nav className="flex-1 space-y-1.5">
        <NavItem href="/dashboard" pathname={pathname} icon={LayoutDashboard} label="Dashboard" exact />
        
        <div className="pt-5 pb-1.5 px-3">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Operations</p>
        </div>
        <NavItem href="/dashboard/quotes" pathname={pathname} icon={ScrollText} label="Quotations" />
        <NavItem href="/dashboard/jobs" pathname={pathname} icon={Package} label="Freight Jobs" />
        
        <div className="pt-5 pb-1.5 px-3">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Finance</p>
        </div>
        <NavItem href="/dashboard/invoices" pathname={pathname} icon={Receipt} label="Customer Invoices" />
        <NavItem href="/dashboard/vendor-invoices" pathname={pathname} icon={Wallet} label="Vendor Invoices" />
        <NavItem href="/dashboard/ledger" pathname={pathname} icon={HandCoins} label="Customer Ledger" />
        <NavItem href="/dashboard/vendor-ledger" pathname={pathname} icon={Wallet} label="Vendor Ledger" />
        <NavItem href="/dashboard/reconciliation" pathname={pathname} icon={Scale} label="Financial Audit" />
        
        <div className="pt-5 pb-1.5 px-3">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Workspace</p>
        </div>
        <NavItem href="/dashboard/directory/companies" pathname={pathname} icon={Folders} label="Directory" />
        <NavItem href="/dashboard/team" pathname={pathname} icon={UsersRound} label="Control Team" />
      </nav>

      {/* Footer / Logout Button */}
      <div className="pt-5 mt-auto border-t border-slate-50">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center justify-between group px-4 py-3 text-xs font-bold rounded-2xl transition-all text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        >
          <div className="flex items-center gap-3">
            <LogOut size={16} />
            <span>Secure Logout</span>
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </button>
      </div>
    </aside>
  )
}

function NavItem({ icon: Icon, label, href, pathname, exact }: any) {
  const isActive = exact 
    ? pathname === href 
    : pathname.startsWith(href)
    
  return (
    <Link
      href={href}
      className={`flex items-center justify-between group px-4 py-2 text-xs font-bold rounded-2xl transition-all
      ${isActive 
        ? "text-white bg-blue-600 shadow-lg shadow-blue-500/20" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600 transition-colors"} />
        <span>{label}</span>
      </div>
      {isActive && <ChevronRight size={14} className="text-white/70" />}
    </Link>
  )
}
