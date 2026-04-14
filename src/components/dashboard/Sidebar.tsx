"use client"
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  Truck, 
  Wallet, 
  ScrollText,
  Folders,
  UsersRound,
  LogOut // Added LogOut icon
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react" // Added NextAuth signOut

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
        <NavItem href="/dashboard" pathname={pathname} icon={LayoutDashboard} label="Dashboard" exact />
        <NavItem href="/dashboard/quotes" pathname={pathname} icon={ScrollText} label="Quotations" />
        <NavItem href="/dashboard/jobs" pathname={pathname} icon={Package} label="Jobs" />
        <NavItem href="/dashboard/invoices" pathname={pathname} icon={Receipt} label="Invoicing" />
        <NavItem href="/dashboard/directory/companies" pathname={pathname} icon={Folders} label="Directory" />
        <NavItem href="/dashboard/team" pathname={pathname} icon={UsersRound} label="Team" />
      </nav>

      {/* Footer / Logout Button */}
      <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded transition text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <LogOut size={18} />
          Secure Logout
        </button>
      </div>
    </aside>
  )
}

function NavItem({ icon: Icon, label, active, href, pathname, exact }: any) {
  const isActive = exact 
    ? pathname === href 
    : pathname.startsWith(href)
    
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 text-sm rounded transition
      ${isActive ? "text-white bg-black dark:bg-white dark:text-black" : "text-muted-foreground hover:bg-muted"}`}
    >
      <Icon size={18} />
      {label}
    </Link>
  )
}