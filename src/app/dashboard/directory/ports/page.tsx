"use client"

import * as React from "react"
import {
  Bell,
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
  CheckCircle2
} from "lucide-react"
import { useSession } from "next-auth/react";

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
  const canEditMasterData = session && ["SuperAdmin", "Finance","Sales"].includes(session?.user?.role || "")

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

  // --- SINGLE SAVE HANDLER ---
  const handleSave = async () => {
    if (newPort.locode.length !== 5) return alert("UN/LOCODE must be exactly 5 characters.");
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

    // Check if it's a CSV
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setBulkError("Please upload a valid .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        // Split by lines and remove completely empty ones
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

        if (lines.length <= 1) {
          setBulkError("File appears to be empty or missing data rows.");
          return;
        }

        const newPorts: IPort[] = [];

        // Start at index 1 to skip the header row
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");

          if (cols.length >= 4) {
            // Determine type. Accept "Sea", "Air", or "Sea|Air" for both.
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

  return (
    <div className="bg-surface text-on-surface antialiased overflow-hidden min-h-screen">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tight text-slate-900">Architectural Logistician</span>
          <div className="hidden md:flex gap-6">
            <a className="text-slate-500 hover:text-slate-900 transition-colors" href="/dashboard/new-job">Shipments</a>
            <a className="text-slate-500 hover:text-slate-900 transition-colors" href="/dashboard/directory/companies">Companies</a>
            <a className="text-blue-700 border-b-2 border-blue-700 transition-colors" href="/dashboard/directory/ports">Ports Hub</a>
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
              <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Ports & Locations</h1>
              <p className="text-on-surface-variant text-lg">Manage global UN/LOCODEs for routing validation.</p>
            </div>
            <div className="flex gap-4">
              {canEditMasterData && <button
                onClick={() => setIsBulkOpen(true)}
                className="bg-surface-container-low border border-outline-variant/20 text-on-surface font-semibold px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors"
              >
                <Upload className="w-4 h-4" /> Bulk Import (CSV)
              </button>}

              {canEditMasterData && <button
                onClick={() => setIsAddOpen(true)}
                className="bg-primary text-on-primary px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Add Port
              </button>}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12">
              {/* Search Bar */}
              <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="w-[40%] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                    <input
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                      placeholder="Search by name, LOCODE, or country..." type="text"
                    />
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(25,28,30,0.04)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Port / Location</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">UN / LOCODE</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Country</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Transport Mode</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-transparent">
                      {filteredPorts.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">No ports found matching your search.</td></tr>
                      )}
                      {filteredPorts.map((port) => (
                        <tr key={port._id} className="group hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-6 py-5"><span className="font-bold text-on-surface">{port.name}</span></td>
                          <td className="px-6 py-5">
                            <span className="px-2.5 py-1 rounded bg-surface-container-highest text-primary font-mono text-xs font-bold tracking-widest">{port.locode}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-on-surface">{port.country}</span>
                              <span className="text-xs text-on-surface-variant">{port.countryCode}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex gap-2">
                              {port.type.includes("Sea") && <div title="Sea Port" className="p-1.5 bg-blue-100 text-blue-700 rounded-md"><Anchor className="w-3.5 h-3.5" /></div>}
                              {port.type.includes("Air") && <div title="Airport" className="p-1.5 bg-sky-100 text-sky-700 rounded-md"><Plane className="w-3.5 h-3.5" /></div>}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${port.isActive ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-error-container text-on-error-container'}`}>
                              {port.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- BULK IMPORT SLIDE-OVER (EXCEL/CSV) --- */}
        {isBulkOpen && (
          <div className="w-[500px] min-w-[500px] bg-surface-container-lowest border-l border-outline-variant/20 shadow-2xl z-[60] flex flex-col transition-all">
            <div className="p-8 border-b border-outline-variant/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-on-surface">Import Data</h2>
                <button onClick={() => { setIsBulkOpen(false); setBulkError(""); setParsedData(null); }} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary text-white flex items-center justify-center rounded-lg shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">Excel / CSV Upload</p>
                    <p className="text-xs text-primary/70">Upload your master data sheet.</p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 text-xs font-bold bg-white text-primary px-3 py-2 rounded-lg shadow-sm hover:shadow transition-all border border-primary/10"
                >
                  <Download className="w-3.5 h-3.5" /> Template
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar flex flex-col gap-6">

              {bulkError && (
                <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm flex gap-3 items-start border border-error/20">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="font-medium">{bulkError}</p>
                </div>
              )}

              <div className="flex flex-col flex-1 h-full">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Upload File</label>

                <div className="flex-1 border-2 border-dashed border-outline-variant/50 rounded-xl bg-surface-container-lowest flex flex-col items-center justify-center p-8 text-center relative group hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {!parsedData ? (
                    <>
                      <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-on-surface">Click or drag CSV file to upload</p>
                      <p className="text-xs text-on-surface-variant mt-2">Maximum file size: 5MB</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant mb-4">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-on-surface">File parsed successfully!</p>
                      <span className="mt-3 px-3 py-1 bg-surface-container-highest text-primary font-bold text-xs rounded-full">
                        {parsedData.length} valid records found
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 bg-surface-container-low border-t border-outline-variant/10 flex gap-4">
              <button onClick={() => { setIsBulkOpen(false); setBulkError(""); setParsedData(null); }} className="flex-1 px-6 py-3 border border-outline-variant text-on-surface-variant font-semibold rounded-lg hover:bg-white transition-colors">Cancel</button>
              <button
                onClick={handleBulkSave}
                disabled={!parsedData || parsedData.length === 0 || isSubmitting}
                className="flex-1 px-6 py-3 bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmitting ? "Importing..." : "Run Import"}
              </button>
            </div>
          </div>
        )}

        {/* --- SINGLE ADD SLIDE-OVER --- */}
        {isAddOpen && (
          <div className="w-[450px] min-w-[450px] bg-surface-container-lowest border-l border-outline-variant/20 shadow-2xl z-[60] flex flex-col transition-all">
            <div className="p-8 border-b border-outline-variant/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-on-surface">Add Port</h2>
                <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                <div className="h-10 w-10 bg-primary text-white flex items-center justify-center rounded-lg shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-primary">Master Data Entry</p>
                  <p className="text-xs text-primary/70">Requires exact UN/LOCODE details.</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-6">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Port / Location Name *</label>
                <input value={newPort.name} onChange={(e) => setNewPort({ ...newPort, name: e.target.value })} className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" type="text" placeholder="e.g. Jebel Ali Port" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">UN/LOCODE *</label>
                <input value={newPort.locode} onChange={(e) => setNewPort({ ...newPort, locode: e.target.value.toUpperCase() })} maxLength={5} className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none uppercase placeholder:normal-case" placeholder="e.g. AEJEA" type="text" />
                <p className="text-[10px] text-on-surface-variant mt-1.5 ml-1">Must be exactly 5 alphanumeric characters.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Country Name *</label>
                  <input value={newPort.country} onChange={(e) => setNewPort({ ...newPort, country: e.target.value })} className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" type="text" placeholder="United Arab Emirates" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">ISO Country Code *</label>
                  <input value={newPort.countryCode} onChange={(e) => setNewPort({ ...newPort, countryCode: e.target.value.toUpperCase() })} maxLength={2} className="w-full bg-surface-container-highest border-none rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none uppercase placeholder:normal-case" type="text" placeholder="AE" />
                </div>
              </div>
              <div className="pt-4 border-t border-outline-variant/10">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Transport Capabilities</label>
                <div className="flex gap-4">
                  <button onClick={() => toggleType("Sea")} className={`flex-1 py-3 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${newPort.type.includes("Sea") ? 'border-primary bg-primary/5 text-primary' : 'border-surface-container-highest bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'}`}><Anchor className="w-5 h-5" /><span className="text-xs font-bold">Sea Port</span></button>
                  <button onClick={() => toggleType("Air")} className={`flex-1 py-3 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${newPort.type.includes("Air") ? 'border-primary bg-primary/5 text-primary' : 'border-surface-container-highest bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'}`}><Plane className="w-5 h-5" /><span className="text-xs font-bold">Airport</span></button>
                </div>
              </div>
            </div>

            <div className="p-8 bg-surface-container-low border-t border-outline-variant/10 flex gap-4">
              <button onClick={() => setIsAddOpen(false)} className="flex-1 px-6 py-3 border border-outline-variant text-on-surface-variant font-semibold rounded-lg hover:bg-white transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!newPort.name || newPort.locode.length !== 5 || newPort.countryCode.length !== 2} className="flex-1 px-6 py-3 bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">Save Port</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}