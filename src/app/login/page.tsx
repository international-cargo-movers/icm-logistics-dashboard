"use client"

import * as React from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Anchor, Lock, Mail, ArrowRight } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // This calls the NextAuth Credentials provider we built earlier
      const res = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false, 
      })

      if (res?.error) {
        toast.error("Authentication Failed", { description: "Invalid email or password." })
        setIsLoading(false)
      } else {
        toast.success("Welcome back!", { description: "Authenticating secure session..." })
        // Send them to the dashboard!
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("System Error", { description: "Could not reach authentication servers." })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-900/20">
            <Anchor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">International Cargo Movers</h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Global Logistics Interface</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Employee Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg h-12 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all" 
                  placeholder="admin@logistics.com" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg h-12 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all" 
                  placeholder="••••••••" 
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-slate-900 text-white rounded-lg h-12 font-bold flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {isLoading ? "Verifying..." : (
              <>Access Dashboard <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="pt-6 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Unauthorized access is strictly prohibited. <br/> Activity is monitored and logged.
          </p>
        </div>

      </div>
    </div>
  )
}