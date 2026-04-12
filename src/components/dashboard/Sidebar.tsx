"use client"
import { LayoutDashboard, Package, Receipt, Truck, Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname=usePathname();
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-900 flex flex-col py-8 px-6">
      <div className="mb-10">
        <h1 className="text-lg font-bold">Architect Logistician</h1>
        <p className="text-[10px] uppercase text-slate-500 mt-1">
          Global Command
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        <NavItem href="/dashboard" pathname = {pathname} icon={LayoutDashboard} label="Dashboard" exact />
        <NavItem href="/dashboard/jobs" pathname = {pathname} icon={Package} label="Jobs" active />
        <NavItem href="/dashboard/invoices" pathname = {pathname} icon={Receipt} label="Invoicing" />
        <NavItem href="/dashboard/directory/companies" pathname = {pathname} icon={Truck} label="Directory" />
        <NavItem href="/dashboard/quotes/new" pathname = {pathname} icon={Wallet} label="Reconciliation" />
      </nav>
    </aside>
  )
}

function NavItem({ icon: Icon, label, active,href,pathname,exact }: any) {
  const isActive = exact 
    ? pathname === href 
    : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 text-sm rounded transition
      ${isActive ? "text-white bg-black" : "text-muted-foreground hover:bg-muted"}`}
    >
      <Icon size={18} />
      {label}
    </Link>
  )
}