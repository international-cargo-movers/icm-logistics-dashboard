"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Shield, Plus, UserPlus, Mail, Lock } from "lucide-react"
import { toast } from "sonner"

export default function TeamManagementPage() {
  const { data: session } = useSession()
  const [users, setUsers] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  // New User Form State
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [formData, setFormData] = React.useState({
    firstName: "", lastName: "", email: "", password: "", role: "Operations"
  })

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
    // Only fetch if they are a SuperAdmin
    if (session?.user?.role === "SuperAdmin") {
      fetchUsers()
    } else {
      setIsLoading(false)
    }
  }, [session])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
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
        setFormData({ firstName: "", lastName: "", email: "", password: "", role: "Operations" })
      } else {
        toast.error(json.error || "Failed to create account", { id: loadingToast })
      }
    } catch (error) {
      toast.error("Network error occurred", { id: loadingToast })
    }
  }

  // Security Gate: If they aren't a SuperAdmin, kick them out of this specific view
  if (session?.user?.role !== "SuperAdmin") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center px-6">
        <Shield className="w-16 h-16 text-red-500 mb-4 opacity-20" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Restricted Area</h1>
        <p className="text-slate-500 max-w-md">Your current role ({session?.user?.role || 'Unknown'}) does not have clearance to view or modify team architecture.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-12 py-12 bg-slate-50 text-slate-900 font-sans min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Team Architecture</h1>
            <p className="text-slate-500 text-lg mt-1">Provision accounts and manage Role-Based Access Control.</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-black text-white rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md"
          >
            {showAddForm ? "Cancel" : <><UserPlus className="w-4 h-4" /> Provision Employee</>}
          </button>
        </div>

        {/* PROVISIONING FORM */}
        {showAddForm && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">New Account Details</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">First Name</label>
                <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-50 border-none rounded-lg h-11 px-4 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Last Name</label>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-50 border-none rounded-lg h-11 px-4 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-lg h-11 pl-10 pr-4 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Temporary Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Give this to the employee" className="w-full bg-slate-50 border-none rounded-lg h-11 pl-10 pr-4 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold text-slate-600 block mb-2">Access Role Level</label>
                <div className="flex gap-4">
                  {["SuperAdmin", "Finance", "Operations", "Sales", "Viewer"].map(role => (
                    <button 
                      key={role} type="button" 
                      onClick={() => setFormData({...formData, role})}
                      className={`flex-1 py-3 text-sm font-bold rounded-lg border transition-all ${formData.role === role ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2 flex justify-end pt-4 border-t border-slate-100">
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TEAM DIRECTORY TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium">Loading directory...</td></tr>
              ) : users.map(user => (
                <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{user.firstName} {user.lastName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      user.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'Finance' ? 'bg-emerald-100 text-emerald-700' :
                      user.role === 'Operations' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs font-bold text-slate-500">{user.isActive ? 'Active' : 'Suspended'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}