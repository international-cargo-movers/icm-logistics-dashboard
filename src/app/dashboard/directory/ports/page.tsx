"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Anchor,
  Plane,
  X,
  MapPin,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Download,
  CheckCircle2,
  Activity,
  Globe,
  ChevronRight
} from "lucide-react"
import { useSession } from "next-auth/react";
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface IPort {
  _id?: string;
  name: string;
  locode: string;
  country: string;
  countryCode: string;
  type: string[];
  isActive: boolean;
}

export default function MasterPortsPage() {
  const { data: session } = useSession()
  const [ports, setPorts] = React.useState<IPort[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
  const canEditMasterData = session && (userRoles.includes("SuperAdmin") || userRoles.includes("Finance") || userRoles.includes("Sales") || userRoles.includes("Operations"));

  // Single Add State
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [newPort, setNewPort] = React.useState<IPort>({
    name: "", locode: "", country: "", countryCode: "", type: ["Sea"], isActive: true
  })

  // Bulk Import State (CSV)
  const [isBulkOpen, setIsBulkOpen] = React.useState(false)
  const [parsedData, setParsedData] = React.useState<IPort[] | null>(null)
  const [bulkError, setBulkError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    async function fetchPorts() {
      try {
        const res = await fetch("/api/ports")
        const json = await res.json()
        if (json.success) setPorts(json.data)
      } catch (error) {
        console.error("Failed to fetch ports:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPorts()
  }, [])

  const filteredPorts = ports.filter(port => {
    const query = searchQuery.toLowerCase()
    return port.name.toLowerCase().includes(query) ||
      port.locode.toLowerCase().includes(query) ||
      port.country.toLowerCase().includes(query)
  })

  const stats = React.useMemo(() => {
    const total = ports.length;
    const sea = ports.filter(p => p.type.includes("Sea")).length;
    const air = ports.filter(p => p.type.includes("Air")).length;
    const countries = new Set(ports.map(p => p.countryCode)).size;
    return { total, sea, air, countries };
  }, [ports]);

  // --- SINGLE SAVE HANDLER ---
  const handleSave = async () => {
    if (newPort.locode && newPort.locode.length !== 5) return alert("UN/LOCODE must be exactly 5 characters if provided.");
    if (newPort.countryCode.length !== 2) return alert("Country Code must be exactly 2 characters.");

    try {
      const res = await fetch("/api/ports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPort)
      });
      const json = await res.json();

      if (json.success) {
        setPorts([json.data, ...ports].sort((a, b) => a.name.localeCompare(b.name)));
        setIsAddOpen(false);
        setNewPort({ name: "", locode: "", country: "", countryCode: "", type: ["Sea"], isActive: true });
      } else {
        alert("Error saving port: " + json.error);
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  }

  // --- NATIVE CSV PARSER ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setBulkError("Please upload a valid .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

        if (lines.length <= 1) {
          setBulkError("File appears to be empty or missing data rows.");
          return;
        }

        const newPorts: IPort[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          if (cols.length >= 4) {
            let typeInput = cols[4] ? cols[4].trim() : "Sea";
            let types = ["Sea"];
            if (typeInput.includes("|")) types = typeInput.split("|");
            else if (typeInput) types = [typeInput];

            newPorts.push({
              name: cols[0].trim(),
              locode: cols[1].trim().toUpperCase(),
              country: cols[2].trim(),
              countryCode: cols[3].trim().toUpperCase(),
              type: types,
              isActive: true
            });
          }
        }
        setParsedData(newPorts);
        setBulkError("");
      } catch (err) {
        setBulkError("Failed to parse CSV file. Ensure it matches the template format.");
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  // --- BULK SAVE HANDLER ---
  const handleBulkSave = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setBulkError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/ports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData)
      });

      const json = await res.json();

      if (json.success) {
        setPorts([...json.data, ...ports].sort((a, b) => a.name.localeCompare(b.name)));
        setIsBulkOpen(false);
        setParsedData(null);
        alert(`Successfully imported ${json.data.length} ports!`);
      } else {
        setBulkError(json.error || "Failed to import ports.");
      }
    } catch (err: any) {
      setBulkError(err.message || "Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- TEMPLATE DOWNLOADER ---
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Port Name,UN/LOCODE,Country Name,Country Code,Type (Sea/Air/Sea|Air)\n"
      + "Port of Antwerp,BEANR,Belgium,BE,Sea\n"
      + "Heathrow Airport,GBLHR,United Kingdom,GB,Air\n"
      + "Port of Hamburg,DEHAM,Germany,DE,Sea|Air";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "port_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const toggleType = (typeValue: string) => {
    setNewPort(prev => {
      const types = [...prev.type];
      if (types.includes(typeValue)) return { ...prev, type: types.filter(t => t !== typeValue) }
      return { ...prev, type: [...types, typeValue] }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Syncing Global LOCODEs...</p>
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
                  Logistics Master Data
                </span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Ports & Locations
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Managing <span className="text-blue-600 font-bold">{stats.total}</span> UN/LOCODEs across <span className="text-blue-600 font-bold">{stats.countries}</span> countries.
              </p>
            </div>

            <div className="flex gap-4">
              {canEditMasterData && (
                <Button 
                    onClick={() => setIsBulkOpen(true)}
                    variant="outline"
                    className="group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold border-slate-200 hover:bg-white transition-all text-slate-600"
                >
                    <Upload className="h-5 w-5" />
                    Bulk Import
                </Button>
              )}
              {canEditMasterData && (
                <Button 
                  onClick={() => setIsAddOpen(true)} 
                  className="group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white border-none"
                >
                  <Plus className="h-5 w-5" />
                  Add Port
                </Button>
              )}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Anchor className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none font-bold">
                    Global
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Locations</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.total} <span className="text-sm text-slate-400">Codes</span></h3>
              <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>UN/LOCODE Standard</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Anchor className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Sea Ports</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.sea} <span className="text-sm text-slate-400">Terminals</span></h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Ocean Freight</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Plane className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Airports</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.air} <span className="text-sm text-slate-400">Hubs</span></h3>
              <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Air Cargo</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Globe className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Coverage</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.countries} <span className="text-sm text-slate-400">Countries</span></h3>
              <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Global Reach</span>
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
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                            Ports & Locations
                        </button>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search by name or LOCODE..." 
                            className="pl-12 py-5 bg-white border-none shadow-sm rounded-xl focus-visible:ring-blue-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {filteredPorts.length} Locations Found
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-50">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Port / Location</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">UN / LOCODE</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Country</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transport Mode</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPorts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-bold">
                                        No ports found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredPorts.map((port) => (
                                    <tr key={port._id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-blue-600">
                                                    {port.type.includes("Sea") ? <Anchor className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
                                                </div>
                                                <p className="font-black text-slate-900">{port.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-blue-600 font-mono text-[10px] font-black tracking-widest border border-slate-100">
                                                {port.locode}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{port.country}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{port.countryCode}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex gap-2">
                                                {port.type.includes("Sea") && <Badge className="bg-blue-50 text-blue-700 border-none text-[8px] font-black uppercase px-2 py-0">Sea</Badge>}
                                                {port.type.includes("Air") && <Badge className="bg-sky-50 text-sky-700 border-none text-[8px] font-black uppercase px-2 py-0">Air</Badge>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Badge className={`border-none text-[8px] font-black uppercase px-3 py-1 ${port.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {port.isActive ? "Active" : "Inactive"}
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

      {/* Bulk Import Slide-over */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Mass Deployment</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Bulk Import</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setIsBulkOpen(false); setBulkError(""); setParsedData(null); }} className="rounded-xl h-12 w-12 hover:bg-rose-50 hover:text-rose-600">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-600 text-white flex items-center justify-center rounded-2xl shadow-lg shadow-blue-500/20">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-blue-900">Import Template</p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">Standard CSV Format</p>
                        </div>
                    </div>
                    <Button onClick={downloadTemplate} className="bg-white text-blue-600 font-bold rounded-xl shadow-sm hover:bg-white/80 border-none">
                        <Download className="w-4 h-4 mr-2" /> Template
                    </Button>
                </div>

                {bulkError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex gap-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {bulkError}
                    </div>
                )}

                <div className="relative border-4 border-dashed border-slate-100 rounded-[40px] p-12 flex flex-col items-center justify-center text-center group hover:border-blue-100 transition-colors">
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    
                    {!parsedData ? (
                        <>
                            <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 mb-6 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                <Upload className="w-8 h-8" />
                            </div>
                            <p className="font-black text-slate-900 text-lg tracking-tight">Drop your CSV here</p>
                            <p className="text-slate-400 font-medium mt-1">or click to browse local files</p>
                        </>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <p className="font-black text-slate-900 text-lg tracking-tight">Data Parsed Successfully</p>
                            <Badge className="mt-4 bg-emerald-600 text-white font-black border-none px-4 py-1.5 rounded-xl">
                                {parsedData.length} Records Detected
                            </Badge>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                <Button variant="outline" onClick={() => { setIsBulkOpen(false); setBulkError(""); setParsedData(null); }} className="flex-1 py-7 rounded-2xl font-bold border-slate-200 hover:bg-white transition-all text-slate-500">
                    Cancel
                </Button>
                <Button 
                    onClick={handleBulkSave} 
                    disabled={!parsedData || parsedData.length === 0 || isSubmitting}
                    className="flex-1 py-7 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-white transition-all border-none"
                >
                    {isSubmitting ? "Processing..." : "Commit Import"}
                </Button>
            </div>
          </div>
        </div>
      )}

      {/* Single Add Slide-over */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Manual Entry</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Add New Port</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)} className="rounded-xl h-12 w-12 hover:bg-rose-50 hover:text-rose-600">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Port / Location Name *</label>
                        <Input 
                            value={newPort.name} 
                            onChange={(e) => setNewPort({ ...newPort, name: e.target.value })} 
                            className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-bold" 
                            placeholder="e.g. Port of Mumbai" 
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">UN/LOCODE *</label>
                        <Input 
                            value={newPort.locode} 
                            onChange={(e) => setNewPort({ ...newPort, locode: e.target.value.toUpperCase() })} 
                            maxLength={5} 
                            className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-mono font-bold uppercase" 
                            placeholder="INBOM" 
                        />
                        <p className="text-[10px] text-slate-400 font-medium mt-2 ml-1">Must be exactly 5 characters.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Country Name *</label>
                            <Input 
                                value={newPort.country} 
                                onChange={(e) => setNewPort({ ...newPort, country: e.target.value })} 
                                className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-bold" 
                                placeholder="India" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Country Code *</label>
                            <Input 
                                value={newPort.countryCode} 
                                onChange={(e) => setNewPort({ ...newPort, countryCode: e.target.value.toUpperCase() })} 
                                maxLength={2} 
                                className="bg-slate-50 border-none rounded-2xl py-6 focus-visible:ring-blue-600 font-mono font-bold uppercase" 
                                placeholder="IN" 
                            />
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-50">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 block">Capabilities</label>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => toggleType("Sea")} 
                                className={`flex-1 py-5 flex flex-col items-center gap-3 rounded-2xl border-2 transition-all ${
                                    newPort.type.includes("Sea") 
                                        ? 'border-blue-600 bg-blue-50 text-blue-600' 
                                        : 'border-slate-50 bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                <Anchor className="w-6 h-6" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Sea Port</span>
                            </button>
                            <button 
                                onClick={() => toggleType("Air")} 
                                className={`flex-1 py-5 flex flex-col items-center gap-3 rounded-2xl border-2 transition-all ${
                                    newPort.type.includes("Air") 
                                        ? 'border-blue-600 bg-blue-50 text-blue-600' 
                                        : 'border-slate-50 bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                <Plane className="w-6 h-6" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Airport</span>
                            </button>
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
                    disabled={!newPort.name || (newPort.locode && newPort.locode.length !== 5) || newPort.countryCode.length !== 2} 
                    className="flex-1 py-7 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-white transition-all border-none"
                >
                    Save Port
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
