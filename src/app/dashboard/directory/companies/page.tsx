"use client"

import * as React from "react"
import {
  Bell,
  Plus,
  Search,
  SlidersHorizontal,
  Mail,
  Pencil,
  FileEdit,
  X,
  Building2
} from "lucide-react"
import { useSession } from "next-auth/react";
import CompanyLedger from "@/components/dashboard/ledger/CompanyLedger";

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

  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedCompany, setSelectedCompany] = React.useState<ICompany | null>(null)
  const [editForm, setEditForm] = React.useState<Partial<ICompany>>({})
  const canEditMasterData = session && ["SuperAdmin", "Finance", "Sales"].includes(session?.user?.role || "")
  const [panelTab, setPanelTab] = React.useState<"Details" | "Ledger">("Details")
  React.useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/companies")
        const json = await res.json()
        if (json.success) setCompanies(json.data)
      } catch (error) {
        console.error("Failed to fetch companies:", error)
      }
    }
    fetchCompanies()
  }, [])

  const filteredCompanies = companies.filter(company => {
    let matchesTab = false;
    if (activeTab === "Customers") matchesTab = company.type?.includes("Customer");
    if (activeTab === "Vendors") matchesTab = company.type?.includes("Vendor");
    if (activeTab === "Shippers/Consignees") matchesTab = company.type?.includes("Shipper") || company.type?.includes("Consignee");

    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.taxId && company.taxId.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesTab && matchesSearch;
  })

  // 2. The "Create New" handler
  const openAddPanel = () => {
    setSelectedCompany(null)

    // Default the new company type based on the active tab!
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

  // 3. The "Edit Existing" handler
  const openEditPanel = (company: ICompany) => {
    setSelectedCompany(company)
    setEditForm(company)
    setIsEditOpen(true)
  }

  // 4. The Unified Save function (POST for new, PUT for existing)
  const handleSave = async () => {
    try {
      const isNew = !selectedCompany;
      const method = isNew ? "POST" : "PUT";

      // THE FIX: Direct PUT requests to the dynamic ID endpoint!
      const endpoint = isNew ? "/api/companies" : `/api/companies/${editForm._id}`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });

      const json = await res.json();

      if (json.success) {
        if (isNew) {
          setCompanies([json.data, ...companies]); // Add to top of list
        } else {
          setCompanies(companies.map(c => c._id === editForm._id ? json.data : c)); // Update in list
        }
        setIsEditOpen(false);
      } else {
        alert("Error saving entity: " + json.error);
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  }

  return (
    <div className="bg-surface text-on-surface antialiased overflow-hidden min-h-screen">

      <header className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tight text-slate-900">International Cargo Movers</span>
          <div className="hidden md:flex gap-6">
            <a className="text-slate-500 hover:text-slate-900 transition-colors" href="/dashboard/jobs">Shipments</a>
            <a className="text-blue-700 border-b-2 border-blue-700 transition-colors" href="/dashboard/directory/companies">Companies</a>
            <a className="text-slate-500 hover:text-slate-900 transition-colors" href="/dashboard/directory/ports">Ports Hub</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 transition-colors rounded-lg">
            <Bell className="w-5 h-5 text-on-surface-variant" />
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200"></div>
        </div>
      </header>

      <main className="pt-16 min-h-screen bg-surface flex transition-all duration-300">
        <div className="flex-1 px-10 py-12">

          <div className="flex justify-between items-end mb-12">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Master Directory</h1>
              <p className="text-on-surface-variant text-lg">Manage global entities, partners, and routing locations.</p>
            </div>
            {/* Hooked up the openAddPanel here */}
            {/* 4. HIDE THE ADD BUTTON IF NOT AUTHORIZED */}
            {canEditMasterData && (
              <button onClick={openAddPanel} className="bg-primary text-on-primary px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" />
                + Add New Record
              </button>
            )}
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-12">

              <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center border-b border-outline-variant/20 gap-8">
                  {/* Removed Ports from these tabs for now */}
                  {["Customers", "Vendors", "Shippers/Consignees"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm transition-all ${activeTab === tab ? "font-bold border-b-2 border-primary text-primary" : "font-medium text-on-surface-variant hover:text-on-surface"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-[40%] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                      placeholder="Search by name, tax ID or city..."
                      type="text"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">
                    <SlidersHorizontal className="w-4 h-4" /> Filters
                  </button>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(25,28,30,0.04)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Company Name</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Type</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Location</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Primary Contact</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Tax ID / Status</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-transparent">

                      {filteredCompanies.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">No entities found.</td>
                        </tr>
                      )}

                      {filteredCompanies.map((company) => {
                        const isStub = !company.taxId;
                        const initials = company.name.substring(0, 2).toUpperCase();

                        return (
                          <tr key={company._id} className="group hover:bg-surface-container-low/50 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold ${isStub ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-primary-fixed text-primary'}`}>
                                  {initials}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-on-surface truncate max-w-[200px]">{company.name}</span>
                                  <span className="text-xs text-on-surface-variant truncate max-w-[200px]">{company.streetAddress || "No address"}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-sm text-on-surface font-medium">{company.type.join(", ")}</span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="text-sm text-on-surface">{company.city || "—"}</span>
                                <span className="text-xs text-on-surface-variant">{company.country || "—"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              {company.contactName ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-on-surface-variant" />
                                  <span className="text-sm text-on-surface">{company.contactName}</span>
                                </div>
                              ) : (
                                <span className="text-sm italic text-outline">Pending</span>
                              )}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1">
                                <span className={`text-xs font-mono ${isStub ? 'text-outline italic' : 'text-on-surface-variant'}`}>
                                  {company.taxId || "Missing ID"}
                                </span>
                                <div className="flex">
                                  {isStub ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">Incomplete</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-tertiary-fixed text-on-tertiary-fixed-variant">Verified</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              {canEditMasterData && (<button
                                onClick={() => openEditPanel(company)}
                                className={`p-2 rounded-lg transition-colors ${isStub ? 'bg-primary-container text-white' : 'hover:bg-surface-container text-on-surface-variant'}`}
                              >
                                {isStub ? <FileEdit className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                              </button>)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Updated Slide-over Panel Form */}
        {isEditOpen && (
          <div className="w-[450px] min-w-[450px] bg-surface-container-lowest border-l border-outline-variant/20 shadow-2xl z-[60] flex flex-col transition-all">
            <div className="p-8 border-b border-outline-variant/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                  {selectedCompany ? "Edit Profile" : "Add New Entity"}
                </h2>
                <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedCompany ? (
                <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                  <div className="h-12 w-12 bg-primary text-on-primary flex items-center justify-center rounded-lg text-lg font-bold">
                    {selectedCompany.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface truncate max-w-[250px]">{selectedCompany.name}</p>
                    <p className="text-xs text-on-surface-variant">Entity ID: {selectedCompany._id.substring(0, 8)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="h-10 w-10 bg-primary text-white flex items-center justify-center rounded-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">Creating New Record</p>
                    <p className="text-xs text-primary/70">Fill out the details below.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-6">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Legal Company Name *</label>
                <input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  type="text"
                  placeholder="e.g. Apex Global Traders"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Tax ID (GSTIN/EIN)</label>
                  <input
                    value={editForm.taxId || ""}
                    onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Enter ID..."
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Entity Type</label>
                  <select
                    value={editForm.type?.[0] || "Customer"}
                    onChange={(e) => setEditForm({ ...editForm, type: [e.target.value] })}
                    className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm outline-none"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Shipper">Shipper</option>
                    <option value="Consignee">Consignee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Street Address</label>
                <input
                  value={editForm.streetAddress || ""}
                  onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value })}
                  className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  type="text"
                  placeholder="Line 1 & 2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">City</label>
                  <input
                    value={editForm.city || ""}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">State / Province</label>
                  <input
                    value={editForm.state || ""}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Zip Code</label>
                  <input
                    value={editForm.zipCode || ""}
                    onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Country</label>
                  <input
                    value={editForm.country || ""}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    type="text"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/10">
                <h3 className="text-sm font-bold text-on-surface mb-4">Communication Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Contact Name</label>
                    <input
                      value={editForm.contactName || ""}
                      onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                      className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Assign primary contact..."
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Contact Email</label>
                    <input
                      value={editForm.contactEmail || ""}
                      onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                      className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="email@company.com"
                      type="email"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-surface-container-low border-t border-outline-variant/10 flex gap-4">
              <button onClick={() => setIsEditOpen(false)} className="flex-1 px-6 py-3 border border-outline-variant text-on-surface-variant font-semibold rounded-lg hover:bg-white transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex-1 px-6 py-3 bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90 transition-opacity">Save Changes</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}