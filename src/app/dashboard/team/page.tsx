"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { 
    Shield, 
    Plus, 
    UserPlus, 
    Mail, 
    Lock, 
    Key,
    Activity, 
    UsersRound, 
    ShieldCheck, 
    Scale, 
    Briefcase,
    ChevronRight,
    X,
    User,
    ShieldAlert,
    UserX,
    UserCheck
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function TeamManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [formData, setFormData] = React.useState({
    firstName: "", lastName: "", email: "", password: "", roles: ["Operations"] as string[]
  })

  // Password Reset State
  const [resettingUser, setResettingUser] = React.useState<any>(null)
  const [newPassword, setNewPassword] = React.useState("")
  const [isResetting, setIsResetting] = React.useState(false)

  // Role Edit State
  const [editingRolesUser, setEditingRolesUser] = React.useState<any>(null)
  const [editRoles, setEditRoles] = React.useState<string[]>([])
  const [isUpdatingRoles, setIsUpdatingRoles] = React.useState(false)

  // Subtle UI Abstraction: Silent redirect if not SuperAdmin
  React.useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.roles?.includes("SuperAdmin") && session?.user?.role !== "SuperAdmin") {
      router.push("/dashboard")
    }
  }, [session, status, router])

  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users')
        const json = await res.json()
        if (json.success) setUsers(json.data)
      } catch (error) {
        toast.error("Failed to load team data")
      } finally {
        setIsLoading(false)
      }
    }
    if (session?.user?.roles?.includes("SuperAdmin") || session?.user?.role === "SuperAdmin") {
      fetchUsers()
    } else if (status !== "loading") {
      setIsLoading(false)
    }
  }, [session, status])

  const stats = React.useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.roles?.includes("SuperAdmin") || u.role === "SuperAdmin").length;
    const ops = users.filter(u => u.roles?.includes("Operations") || u.role === "Operations").length;
    const finance = users.filter(u => u.roles?.includes("Finance") || u.role === "Finance").length;
    return { total, admins, ops, finance };
  }, [users]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.roles.length === 0) {
      toast.error("Please select at least one role")
      return
    }
    const loadingToast = toast.loading("Provisioning new account...")
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json()
      
      if (json.success) {
        toast.success("Account provisioned successfully!", { id: loadingToast })
        setUsers([...users, json.data])
        setShowAddForm(false)
        setFormData({ firstName: "", lastName: "", email: "", password: "", roles: ["Operations"] })
      } else {
        toast.error(json.error || "Failed to create account", { id: loadingToast })
      }
    } catch (error) {
      toast.error("Network error occurred", { id: loadingToast })
    }
  }

  const toggleRoleInForm = (role: string) => {
    setFormData(prev => {
        const newRoles = prev.roles.includes(role)
            ? prev.roles.filter(r => r !== role)
            : [...prev.roles, role]
        return { ...prev, roles: newRoles }
    })
  }

  const toggleRoleInEdit = (role: string) => {
    setEditRoles(prev => 
        prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const handleUpdateRoles = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRolesUser) return
    if (editRoles.length === 0) {
        toast.error("User must have at least one role")
        return
    }

    setIsUpdatingRoles(true)
    const loadingToast = toast.loading(`Updating roles for ${editingRolesUser.firstName}...`)

    try {
        const res = await fetch(`/api/users/${editingRolesUser._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roles: editRoles })
        })
        const json = await res.json()

        if (json.success) {
            toast.success("Permissions updated successfully!", { id: loadingToast })
            setUsers(users.map(u => u._id === editingRolesUser._id ? { ...u, roles: editRoles } : u))
            setEditingRolesUser(null)
        } else {
            toast.error(json.error || "Failed to update roles", { id: loadingToast })
        }
    } catch (error) {
        toast.error("Network error occurred", { id: loadingToast })
    } finally {
        setIsUpdatingRoles(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resettingUser || !newPassword) return

    setIsResetting(true)
    const loadingToast = toast.loading(`Resetting password for ${resettingUser.firstName}...`)

    try {
      const res = await fetch(`/api/users/${resettingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      })
      const json = await res.json()

      if (json.success) {
        toast.success("Password updated successfully!", { id: loadingToast })
        setResettingUser(null)
        setNewPassword("")
      } else {
        toast.error(json.error || "Failed to reset password", { id: loadingToast })
      }
    } catch (error) {
      toast.error("Network error occurred", { id: loadingToast })
    } finally {
      setIsResetting(false)
    }
  }

  const toggleUserStatus = async (user: any) => {
    const loadingToast = toast.loading(`${user.isActive ? 'Deactivating' : 'Activating'} account...`)

    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      })
      const json = await res.json()

      if (json.success) {
        toast.success(`Account ${user.isActive ? 'deactivated' : 'activated'} successfully!`, { id: loadingToast })
        setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !user.isActive } : u))
      } else {
        toast.error(json.error || "Failed to update status", { id: loadingToast })
      }
    } catch (error) {
      toast.error("Network error occurred", { id: loadingToast })
    }
  }

  if (status === "loading" || (!session?.user?.roles?.includes("SuperAdmin") && session?.user?.role !== "SuperAdmin")) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 bg-blue-600/20 rounded-2xl"></div>
            <div className="h-4 w-32 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F8FAFC] text-slate-900 antialiased font-body min-h-screen">
      <Sidebar />

      <main className="min-h-screen flex flex-col">
        <TopNav searchTerm="" onSearchChange={() => {}} />

        <div className="pt-24 px-8 lg:px-12 pb-12 space-y-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1 w-8 bg-blue-600 rounded-full"></span>
                <span className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase">
                    Security & Access
                </span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Team Architecture
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Managing access controls for <span className="text-blue-600 font-bold">{stats.total}</span> active system users.
              </p>
            </div>

            <Button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className={`group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold shadow-2xl transition-all border-none ${showAddForm ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-blue-500/20 hover:scale-[1.02] hover:bg-blue-700'}`}
            >
              {showAddForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {showAddForm ? "Cancel Provisioning" : "Provision Employee"}
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UsersRound className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none font-bold">
                    Staff
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Employees</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.total} <span className="text-sm text-slate-400">Users</span></h3>
              <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Active Directory</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Super Admins</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.admins} <span className="text-sm text-slate-400">Root</span></h3>
              <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                <Shield className="h-4 w-4" />
                <span>System Controllers</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Scale className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Finance Unit</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.finance} <span className="text-sm text-slate-400">Accountants</span></h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>Financial Clearance</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Briefcase className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ops Command</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.ops} <span className="text-sm text-slate-400">Coordinators</span></h3>
              <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Freight Logistics</span>
              </div>
            </Card>
          </div>

          {/* PROVISIONING FORM */}
          {showAddForm && (
            <Card className="border-none shadow-2xl shadow-blue-500/10 bg-white rounded-[40px] overflow-hidden animate-in fade-in slide-in-from-top-6 duration-500">
                <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">New Node Deployment</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Provision New Account</h3>
                </div>
                <form onSubmit={handleCreateUser} className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">First Name</label>
                            <Input 
                                required value={formData.firstName} 
                                onChange={e => setFormData({...formData, firstName: e.target.value})} 
                                className="bg-slate-50 border-none rounded-2xl py-6 font-bold focus-visible:ring-blue-600"
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Last Name</label>
                            <Input 
                                required value={formData.lastName} 
                                onChange={e => setFormData({...formData, lastName: e.target.value})} 
                                className="bg-slate-50 border-none rounded-2xl py-6 font-bold focus-visible:ring-blue-600"
                                placeholder="Doe"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Enterprise Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    required type="email" value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                    className="bg-slate-50 border-none rounded-2xl py-6 pl-12 font-bold focus-visible:ring-blue-600"
                                    placeholder="john.doe@company.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Temporary Access Key</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    required value={formData.password} 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    className="bg-slate-50 border-none rounded-2xl py-6 pl-12 font-bold focus-visible:ring-blue-600"
                                    placeholder="Temp Password"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Access Authorization Level (Multi-Select)</label>
                        <div className="flex flex-wrap gap-4">
                            {["SuperAdmin", "Finance", "Operations", "Sales", "Viewer"].map(role => (
                                <button 
                                    key={role} type="button" 
                                    onClick={() => toggleRoleInForm(role)}
                                    className={`px-6 py-3 text-xs font-black uppercase tracking-tighter rounded-xl transition-all border ${
                                        formData.roles.includes(role) 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                                            : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-50 flex justify-end">
                        <Button type="submit" className="px-12 py-7 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all border-none">
                            Deploy New Account
                        </Button>
                    </div>
                </form>
            </Card>
          )}

          {/* TEAM DIRECTORY TABLE */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Access Directory</h3>
                    <p className="text-slate-400 font-medium">Monitoring system engagement and role compliance</p>
                </div>
                <Badge variant="outline" className="border-slate-200 text-slate-400 font-black uppercase text-[10px] px-4 py-1.5">
                    Live Authorization Sync
                </Badge>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-[40px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-50">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Employee Identity</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Communications</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Permission</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Status Hub</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Syncing Directory...</td></tr>
                            ) : users.map(user => (
                                <tr key={user._id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg tracking-tight">{user.firstName} {user.lastName}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">Direct Staff</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <p className="font-bold text-slate-700">{user.email}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-blue-600 font-black uppercase tracking-tighter mt-1">
                                            <Mail className="h-3 w-3" /> Professional Mail
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className="flex flex-wrap gap-2">
                                            {(user.roles || [user.role]).map((role: string) => (
                                                <Badge key={role} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-none ${
                                                    role === 'SuperAdmin' ? 'bg-indigo-50 text-indigo-700' :
                                                    role === 'Finance' ? 'bg-emerald-50 text-emerald-700' :
                                                    role === 'Operations' ? 'bg-blue-50 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {role}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => {
                                                setEditingRolesUser(user)
                                                setEditRoles(user.roles || [user.role] || [])
                                            }}
                                            className="h-10 w-10 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                            title="Edit Roles"
                                          >
                                            <Shield className="h-4 w-4" />
                                          </Button>

                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => setResettingUser(user)}
                                            className="h-10 w-10 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            title="Reset Password"
                                          >
                                            <Key className="h-4 w-4" />
                                          </Button>

                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => toggleUserStatus(user)}
                                            className={`h-10 w-10 rounded-xl transition-colors ${user.isActive ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-emerald-50 hover:text-emerald-600'}`}
                                            title={user.isActive ? "Deactivate Account" : "Activate Account"}
                                          >
                                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                          </Button>

                                          <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-all ml-2">
                                              <div className={`h-2 w-2 rounded-full animate-pulse ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                              <span className={`text-[10px] font-black uppercase tracking-widest ${user.isActive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                  {user.isActive ? 'Live' : 'Locked'}
                                              </span>
                                          </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
          </div>

        </div>
      </main>

      {/* Password Reset Dialog */}
      <Dialog open={!!resettingUser} onOpenChange={(open) => !open && setResettingUser(null)}>
        <DialogContent className="max-w-md bg-white rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Security Protocol</p>
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tighter">
              Reset Access Key
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Assign a new temporary password for <span className="text-slate-900 font-bold">{resettingUser?.firstName} {resettingUser?.lastName}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  required 
                  type="text" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="bg-slate-50 border-none rounded-2xl py-6 pl-12 font-bold focus-visible:ring-blue-600"
                  placeholder="Enter new password"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                The user will be able to log in immediately with this new key.
              </p>
            </div>

            <DialogFooter className="pt-4 gap-3 bg-transparent border-none p-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setResettingUser(null)}
                className="rounded-xl font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isResetting || !newPassword}
                className="bg-blue-600 text-white rounded-xl font-black px-8 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
              >
                {isResetting ? "Updating..." : "Update Key"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Roles Dialog */}
      <Dialog open={!!editingRolesUser} onOpenChange={(open) => !open && setEditingRolesUser(null)}>
        <DialogContent className="max-w-md bg-white rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Access Modification</p>
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tighter">
              Adjust Permissions
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Modifying clearance for <span className="text-slate-900 font-bold">{editingRolesUser?.firstName} {editingRolesUser?.lastName}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateRoles} className="p-8 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Authorized Roles</label>
              <div className="flex flex-wrap gap-3">
                {["SuperAdmin", "Finance", "Operations", "Sales", "Viewer"].map(role => (
                    <button 
                        key={role} type="button" 
                        onClick={() => toggleRoleInEdit(role)}
                        className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all border ${
                            editRoles.includes(role) 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' 
                                : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                        }`}
                    >
                        {role}
                    </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4 gap-3 bg-transparent border-none p-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setEditingRolesUser(null)}
                className="rounded-xl font-bold text-slate-500"
              >
                Discard
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdatingRoles || editRoles.length === 0}
                className="bg-emerald-600 text-white rounded-xl font-black px-8 shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
              >
                {isUpdatingRoles ? "Saving..." : "Apply Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
