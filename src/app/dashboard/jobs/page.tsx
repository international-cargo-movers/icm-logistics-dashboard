"use client"
import * as React from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import JobTable from "@/components/dashboard/JobTable"
import { Button } from "@/components/ui/button" 
import { useRouter } from "next/navigation"
import { 
    Plus, 
    Package, 
    Ship, 
    Plane, 
    CheckCircle2, 
    Activity,
    Search,
    ChevronRight,
    Weight,
    Timer
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"

export default function JobsDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Subtle UI Abstraction: Silent redirect if not authorized
  React.useEffect(() => {
    if (status === "loading") return
    const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
    if (!userRoles.some(r => ["SuperAdmin", "Operations", "Sales"].includes(r))) {
      router.push("/dashboard")
    }
  }, [session, status, router])

  const [searchTerm, setSearchTerm] = React.useState("");
  const [stats, setStats] = React.useState({
    active: 0,
    completed: 0,
    air: 0,
    ocean: 0,
    totalWeight: 0
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/jobs");
        const json = await res.json();
        
        if (json.success && json.data) {
          const jobs = json.data;
          const active = jobs.filter((j: any) => j.cargoDetails?.jobStatus !== "Completed").length;
          const completed = jobs.filter((j: any) => j.cargoDetails?.jobStatus === "Completed").length;
          const air = jobs.filter((j: any) => j.shipmentDetails?.mode?.toLowerCase().includes("air")).length;
          const ocean = jobs.filter((j: any) => 
            j.shipmentDetails?.mode?.toLowerCase().includes("ocean") || 
            j.shipmentDetails?.mode?.toLowerCase().includes("sea")
          ).length;
          const totalWeight = jobs.reduce((acc: number, j: any) => acc + (Number(j.cargoDetails?.grossWeight) || 0), 0);
          setStats({ active, completed, air, ocean, totalWeight });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Syncing Operational Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] text-slate-900 antialiased font-body min-h-screen">
      <Sidebar />

      <main className="min-h-screen flex flex-col">
        <TopNav searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        <div className="pt-24 px-8 lg:px-12 pb-12 space-y-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1 w-8 bg-blue-600 rounded-full"></span>
                <span className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase">
                  Operational Control
                </span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Freight Jobs
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Live monitoring of <span className="text-blue-600 font-bold">{stats.active}</span> active shipments across global trade lanes.
              </p>
            </div>

            <Button 
              onClick={()=>{router.push("/dashboard/new-job")}} 
              className="group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white border-none"
            >
              <Plus className="h-5 w-5" />
              Initialize New Job
            </Button>
          </div>

          {/* Operational KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Package className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none font-bold">
                  Active
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Shipments</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.active} <span className="text-sm text-slate-400">Loads</span></h3>
              <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Timer className="h-4 w-4" />
                <span>In-Transit Control</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Completed Jobs</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.completed} <span className="text-sm text-slate-400">Total</span></h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Delivery Performance</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Plane className="h-5 w-5" />
                    </div>
                    <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                        <Ship className="h-5 w-5" />
                    </div>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mode Breakdown</p>
              <div className="flex items-baseline gap-4">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.air} <span className="text-[10px] text-slate-400 uppercase">Air</span></h3>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.ocean} <span className="text-[10px] text-slate-400 uppercase">Sea</span></h3>
              </div>
              <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                <ChevronRight className="h-4 w-4" />
                <span>Multimodal Distribution</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Weight className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tonnage</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{(stats.totalWeight / 1000).toFixed(1)} <span className="text-sm text-slate-400">Metric Tons</span></h3>
              <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Payload Volume</span>
              </div>
            </Card>
          </div>

          {/* Job Terminal */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                        placeholder="Search Job ID, Client or Routing..." 
                        className="w-full pl-12 py-4 bg-white border-none shadow-xl shadow-slate-200/50 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-50 text-xs font-bold text-slate-500">
                    Showing All Freight Records
                </div>
            </div>

            <JobTable searchTerm={searchTerm} />
          </div>

        </div>
      </main>
    </div>
  )
}
