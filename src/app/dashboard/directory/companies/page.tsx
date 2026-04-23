"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Mail,
  Pencil,
  FileEdit,
  X,
  Building2,
  Activity,
  ShieldCheck,
  TrendingUp,
  Globe,
  ChevronRight,
  MoreHorizontal,
  MapPin,
  Filter
} from "lucide-react"
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"

// 1. Updated Interface to match our new MongoDB Schema
interface ICompany {
  _id: string;
  name: string;
  type: string[];
  taxId?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
}

export default function MasterDirectoryPage() {
  const { data: session } = useSession()
  const [companies, setCompanies] = React.useState<ICompany[]>([])
  const [activeTab, setActiveTab] = React.useState("Customers")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)

  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedCompany, setSelectedCompany] = React.useState<ICompany | null>(null)
  const [editForm, setEditForm] = React.useState<Partial<ICompany>>({})
  
  const canEditMasterData = session && ["SuperAdmin", "Finance", "Sales"].includes(session?.user?.role || "")
  
  React.useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/companies")
        const json = await res.json()
        if (json.success) setCompanies(json.data)
      } catch (error) {
        console.error("Failed to fetch companies:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  const filteredCompanies = React.useMemo(() => {
    return companies.filter(company => {
        let matchesTab = false;
        if (activeTab === "Customers") matchesTab = company.type?.includes("Customer");
        if (activeTab === "Vendors") matchesTab = company.type?.includes("Vendor");
        if (activeTab === "Shippers/Consignees") matchesTab = company.type?.includes("Shipper") || company.type?.includes("Consignee");

        const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.taxId && company.taxId.toLowerCase().includes(searchQuery.toLowerCase()))

        return matchesTab && matchesSearch;
    })
  }, [companies, activeTab, searchQuery]);

  const stats = React.useMemo(() => {
    const total = companies.length;
    const customers = companies.filter(c => c.type?.includes("Customer")).length;
    const vendors = companies.filter(c => c.type?.includes("Vendor")).length;
    const incomplete = companies.filter(c => !c.taxId).length;
    return { total, customers, vendors, incomplete };
  }, [companies]);

  const openAddPanel = () => {
    setSelectedCompany(null)
    let defaultType = "Customer"
    if (activeTab === "Vendors") defaultType = "Vendor"
    if (activeTab === "Shippers/Consignees") defaultType = "Shipper"

    setEditForm({
      name: "",
      type: [defaultType],
      taxId: "",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      contactName: "",
      contactEmail: ""})
    setIsEditOpen(true)
  }

  const openEditPanel = (company: ICompany) => {
    setSelectedCompany(company)
    setEditForm(company)
    setIsEditOpen(true)
  }

  const handleSave = async () => {
    try {
      const isNew = !selectedCompany;
      const method = isNew ? "POST" : "PUT";
      const endpoint = isNew ? "/api/companies" : `/api/companies/${editForm._id}`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });

      const json = await res.json();

      if (json.success) {
        if (isNew) {
          setCompanies([json.data, ...companies]);
        } else {
          setCompanies(companies.map(c => c._id === editForm._id ? json.data : c));
        }
        setIsEditOpen(false);
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Mapping Global Entities...</p>
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
                <span className="h-1 w-8 bg-blue-600 rounded-full"></span>
                <span className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase">
                  Enterprise Directory
                </span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Master Directory
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Tracking <span className="text-blue-600 font-bold">{stats.total}</span> legal entities across global trade operations.
              </p>
            </div>

            {canEditMasterData && (
              <Button 
                onClick={openAddPanel} 
                className="group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white border-none"
              >
                <Plus className="h-5 w-5" />
                Add New Entity
              </Button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none font-bold">
                    Partners
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Entities</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.total} <span className="text-sm text-slate-400">Records</span></h3>
              <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Verified Partners</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Clients</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.customers} <span className="text-sm text-slate-400">Entities</span></h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <TrendingUp className="h-4 w-4" />
                <span>Revenue Source</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Globe className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Supply Partners</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.vendors} <span className="text-sm text-slate-400">Vendors</span></h3>
              <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                <ChevronRight className="h-4 w-4" />
                <span>Global Suppliers</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Incomplete Data</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.incomplete} <span className="text-sm text-slate-400">Stubs</span></h3>
              <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Update Required</span>
              </div>
            </Card>
          </div>

          {/* Table Section */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        {["Customers", "Vendors", "Shippers/Consignees"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${
                                    activeTab === tab 
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                                        : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search entities..." 
                            className="pl-12 py-5 bg-white border-none shadow-sm rounded-xl focus-visible:ring-blue-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {filteredCompanies.length} Entities Found
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-50">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Entity Name</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Legal Type</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location Logic</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tax ID / Compliance</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Building2 className="h-10 w-10 text-slate-200" />
                                            <p className="text-slate-400 font-bold">No global entities found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCompanies.map((company) => {
                                    const isStub = !company.taxId;
                                    const initials = company.name.substring(0, 2).toUpperCase();
                                    return (
                                        <tr key={company._id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${isStub ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 truncate max-w-[200px]">{company.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{company.contactEmail || "No Email Bound"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none text-[9px] font-bold uppercase px-3 py-1">
                                                    {company.type.join(" / ")}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3 w-3 text-slate-300" />
                                                    <span className="text-xs font-bold text-slate-600">{company.city || "TBD"}, {company.country || "TBD"}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-[10px] font-mono font-bold ${isStub ? 'text-slate-300 italic' : 'text-slate-500'}`}>
                                                        {company.taxId || "MISSING_ID"}
                                                    </span>
                                                    <div className="flex">
                                                        {isStub ? (
                                                            <Badge className="bg-rose-50 text-rose-700 border-none text-[8px] font-black uppercase px-2 py-0">Pending</Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-black uppercase px-2 py-0">Verified</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {canEditMasterData && (
                                                    <Button 
                                                        onClick={() => openEditPanel(company)}
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                    >
                                                        {isStub ? <FileEdit className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
          </div>

        </div>
      </main>

      {/* Slide-over Panel */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Entity Configuration</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                        {selectedCompany ? "Edit Profile" : "Register New Entity"}
                    </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)} className="rounded-xl h-12 w-12 hover:bg-rose-50 hover:text-rose-600">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Legal Company Name *</label>
                        <Input
                            value={editForm.name || ""}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-bold"
                            placeholder="Enter legal name..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Tax ID / Compliance</label>
                            <Input
                                value={editForm.taxId || ""}
                                onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                                className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-mono font-bold"
                                placeholder="GSTIN/EIN..."
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Primary Type</label>
                            <select
                                value={editForm.type?.[0] || "Customer"}
                                onChange={(e) => setEditForm({ ...editForm, type: [e.target.value] })}
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold outline-none ring-0 focus:ring-2 focus:ring-blue-600 transition-all appearance-none"
                            >
                                <option value="Customer">Customer</option>
                                <option value="Vendor">Vendor</option>
                                <option value="Shipper">Shipper</option>
                                <option value="Consignee">Consignee</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Global Headquarters</label>
                        <Input
                            value={editForm.streetAddress || ""}
                            onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value })}
                            className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-bold mb-4"
                            placeholder="Street Address..."
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                value={editForm.city || ""}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-bold"
                                placeholder="City"
                            />
                            <Input
                                value={editForm.country || ""}
                                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-bold"
                                placeholder="Country"
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-50">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 block">Contact Intelligence</label>
                        <div className="space-y-4">
                            <Input
                                value={editForm.contactName || ""}
                                onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                                className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-bold"
                                placeholder="Assigned Liaison Name"
                            />
                            <Input
                                value={editForm.contactEmail || ""}
                                onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                                className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-bold"
                                placeholder="liaison@entity.com"
                                type="email"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1 py-7 rounded-2xl font-bold border-slate-200 hover:bg-white transition-all text-slate-500">
                    Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 py-7 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-white transition-all border-none">
                    Commit Changes
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
