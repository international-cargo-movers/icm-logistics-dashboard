"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Anchor,
  Plane,
  X,
  Activity,
  ChevronRight,
  Ship,
  Settings2
} from "lucide-react"
import { useSession } from "next-auth/react";
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface IVehicle {
  _id?: string;
  name: string;
  type: "Sea" | "Air";
  code?: string;
  carrierName?: string;
  isActive: boolean;
}

export default function MasterVehiclesPage() {
  const { data: session } = useSession()
  const [vehicles, setVehicles] = React.useState<IVehicle[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const canEditMasterData = session && ["SuperAdmin", "Finance", "Sales", "Operations"].includes(session?.user?.role || "")

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [newVehicle, setNewVehicle] = React.useState<IVehicle>({
    name: "", type: "Sea", code: "", carrierName: "", isActive: true
  })

  React.useEffect(() => {
    async function fetchVehicles() {
      try {
        const res = await fetch("/api/carrier-vehicles")
        const json = await res.json()
        if (json.success) setVehicles(json.data)
      } catch (error) {
        console.error("Failed to fetch vehicles:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchVehicles()
  }, [])

  const filteredVehicles = vehicles.filter(v => {
    const query = searchQuery.toLowerCase()
    return v.name.toLowerCase().includes(query) ||
      (v.carrierName?.toLowerCase().includes(query)) ||
      (v.code?.toLowerCase().includes(query))
  })

  const stats = React.useMemo(() => {
    const total = vehicles.length;
    const sea = vehicles.filter(v => v.type === "Sea").length;
    const air = vehicles.filter(v => v.type === "Air").length;
    return { total, sea, air };
  }, [vehicles]);

  const handleSave = async () => {
    if (!newVehicle.name) return alert("Name is required.");

    try {
      const res = await fetch("/api/carrier-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVehicle)
      });
      const json = await res.json();

      if (json.success) {
        // If it already exists, just show it, don't duplicate in local state if it's there
        const exists = vehicles.find(v => v._id === json.data._id);
        if (!exists) {
          setVehicles([json.data, ...vehicles].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setIsAddOpen(false);
        setNewVehicle({ name: "", type: "Sea", code: "", carrierName: "", isActive: true });
      } else {
        alert("Error saving vehicle: " + json.error);
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Hydrating Carrier Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] text-slate-900 antialiased font-body min-h-screen">
      <Sidebar />

      <main className="min-h-screen flex flex-col">
        <TopNav searchTerm={searchQuery} onSearchChange={setSearchQuery} />

        <div className="pt-24 px-8 lg:px-12 pb-12 space-y-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1 w-8 bg-indigo-600 rounded-full"></span>
                <span className="text-[10px] font-black tracking-[0.3em] text-indigo-600 uppercase">
                  Logistics Master Data
                </span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Vessels & Flights
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Persistent registry of <span className="text-indigo-600 font-bold">{stats.total}</span> carriers used across all ICM companies.
              </p>
            </div>

            <div className="flex gap-4">
              {canEditMasterData && (
                <Button 
                  onClick={() => setIsAddOpen(true)} 
                  className="group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all bg-indigo-600 hover:bg-indigo-700 text-white border-none"
                >
                  <Plus className="h-5 w-5" />
                  Register Carrier
                </Button>
              )}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all border-l-4 border-l-indigo-600">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Ship className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Carriers</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.total}</h3>
              <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Global Registry Active</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Anchor className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Vessels</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.sea}</h3>
              <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Ocean Fleet</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-sky-50 rounded-2xl text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Plane className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Flights</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.air}</h3>
              <div className="mt-4 flex items-center gap-2 text-sky-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Air Cargo Routes</span>
              </div>
            </Card>
          </div>

          {/* Table Section */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        <Link href="/dashboard/directory/companies">
                            <button className="px-4 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all text-slate-400 hover:text-slate-600">
                                Companies
                            </button>
                        </Link>
                        <Link href="/dashboard/directory/ports">
                            <button className="px-4 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all text-slate-400 hover:text-slate-600">
                                Ports
                            </button>
                        </Link>
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                            Vessels & Flights
                        </button>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search by name, carrier or code..." 
                            className="pl-12 py-5 bg-white border-none shadow-sm rounded-xl focus-visible:ring-indigo-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {filteredVehicles.length} Carriers Found
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-50">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Carrier Name</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Type</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Operator / Line</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">IMO / Code</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredVehicles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-bold">
                                        No carriers found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredVehicles.map((v) => (
                                    <tr key={v._id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${v.type === 'Sea' ? 'bg-blue-50 text-blue-600' : 'bg-sky-50 text-sky-600'}`}>
                                                    {v.type === "Sea" ? <Anchor className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
                                                </div>
                                                <p className="font-black text-slate-900">{v.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge className={`border-none text-[8px] font-black uppercase px-2 py-0.5 ${v.type === 'Sea' ? 'bg-blue-50 text-blue-700' : 'bg-sky-50 text-sky-700'}`}>
                                                {v.type}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{v.carrierName || "—"}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 font-mono text-[10px] font-black tracking-widest border border-slate-100">
                                                {v.code || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Badge className={`border-none text-[8px] font-black uppercase px-3 py-1 ${v.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {v.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
          </div>

        </div>
      </main>

      {/* Single Add Slide-over */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Registry Entry</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Add Carrier</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)} className="rounded-xl h-12 w-12 hover:bg-rose-50 hover:text-rose-600">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Carrier Name (Vessel/Flight Number) *</label>
                        <Input 
                            value={newVehicle.name} 
                            onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value.toUpperCase() })} 
                            className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-indigo-600 font-bold uppercase" 
                            placeholder="e.g. MAERSK KARACHI or EK501" 
                        />
                    </div>
                    
                    <div className="pt-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 block">Transport Category</label>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setNewVehicle({...newVehicle, type: "Sea"})} 
                                className={`flex-1 py-5 flex flex-col items-center gap-3 rounded-2xl border-2 transition-all ${
                                    newVehicle.type === "Sea" 
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                                        : 'border-slate-50 bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                <Anchor className="w-6 h-6" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Sea Vessel</span>
                            </button>
                            <button 
                                onClick={() => setNewVehicle({...newVehicle, type: "Air"})} 
                                className={`flex-1 py-5 flex flex-col items-center gap-3 rounded-2xl border-2 transition-all ${
                                    newVehicle.type === "Air" 
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                                        : 'border-slate-50 bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                <Plane className="w-6 h-6" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Flight / Air</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Operator / Shipping Line</label>
                            <Input 
                                value={newVehicle.carrierName} 
                                onChange={(e) => setNewVehicle({ ...newVehicle, carrierName: e.target.value })} 
                                className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-indigo-600 font-bold" 
                                placeholder="e.g. Maersk, Emirates" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">IMO / Flight Code</label>
                            <Input 
                                value={newVehicle.code} 
                                onChange={(e) => setNewVehicle({ ...newVehicle, code: e.target.value.toUpperCase() })} 
                                className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-indigo-600 font-mono font-bold uppercase" 
                                placeholder="e.g. 9123456" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                <Button variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1 py-7 rounded-2xl font-bold border-slate-200 hover:bg-white transition-all text-slate-500">
                    Cancel
                </Button>
                <Button 
                    onClick={handleSave} 
                    disabled={!newVehicle.name} 
                    className="flex-1 py-7 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 text-white transition-all border-none"
                >
                    Save Carrier
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
