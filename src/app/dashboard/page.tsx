"use client"

import * as React from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import JobTable from "@/components/dashboard/JobTable"
import { Button } from "@/components/ui/button" 
import { useRouter } from "next/navigation"
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Briefcase,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Building2,
    PieChart as PieChartIcon
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { RevenueChart, JobModeChart, ProfitTrendChart } from "@/components/dashboard/AnalyticsCharts"
import CompanyPerformance from "@/components/dashboard/CompanyPerformance"

export default function DashboardPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [timeframe, setTimeframe] = React.useState("monthly");

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard?timeframe=${timeframe}&t=${Date.now()}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Orchestrating Global Logistics...</p>
        </div>
      </div>
    );
  }

  const { stats, modeData, trendData, topCompanies, allCompanyMetrics } = data;

  return (
    <div className="bg-[#F8FAFC] text-slate-900 antialiased font-body min-h-screen">
      <Sidebar />

      <main className="min-h-screen flex flex-col">
        <TopNav searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        <div className="pt-24 px-8 lg:px-12 pb-12 space-y-12">
          
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1 w-8 bg-blue-600 rounded-full"></span>
                <span className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase">
                  Executive Terminal
                </span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Freight Intelligence
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Real-time visibility into <span className="text-blue-600 font-bold">{stats.activeJobs}</span> active shipments and global profitability.
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

          {/* High-Level KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-none font-bold">
                  Live
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalRevenue)}</h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <ArrowUpRight className="h-4 w-4" />
                <span>Gross Billing</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <DollarSign className="h-6 w-6" />
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold">
                    {stats.profitMargin.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Net Margin</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalProfit)}</h3>
              <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Operational Profit</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Briefcase className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Pipeline</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.activeJobs} <span className="text-sm text-slate-400">Jobs</span></h3>
              <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-xs">
                <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="h-5 w-5 rounded-full border-2 border-white bg-slate-200" />)}
                </div>
                <span className="ml-2">In-Transit Shipments</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <TrendingDown className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.outstanding)}</h3>
              <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-xs">
                <ArrowDownRight className="h-4 w-4" />
                <span>Pending Receivables</span>
              </div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-8 border-none shadow-2xl shadow-slate-200/50 bg-white rounded-3xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Financial Trajectory</h3>
                  <p className="text-slate-400 text-sm font-medium">Revenue vs Gross Profit Trend</p>
                </div>
                <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  {['weekly', 'monthly', 'yearly'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        timeframe === t 
                          ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <ProfitTrendChart data={trendData} />
            </Card>

            <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 bg-white rounded-3xl">
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Mode Distribution</h3>
                <p className="text-slate-400 text-sm font-medium">Shipment breakdown by mode</p>
              </div>
              <JobModeChart data={modeData} />
            </Card>
          </div>

          {/* NEW: Company Performance Section */}
          <CompanyPerformance allCompanies={allCompanyMetrics} />

          {/* Job Terminal */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-blue-600" /> Active Job Terminal
                    </h3>
                    <p className="text-slate-400 font-medium">Monitoring global freight movements</p>
                </div>
                <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50" onClick={() => router.push("/dashboard/jobs")}>
                    View All Shipments <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
            <JobTable searchTerm={searchTerm} />
          </div>

        </div>
      </main>
    </div>
  )
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function Badge({ children, className, variant = "default" }: any) {
    const variants: any = {
        default: "bg-slate-900 text-slate-50",
        secondary: "bg-slate-100 text-slate-900",
        outline: "border border-slate-200 text-slate-900"
    }
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 ${variants[variant]} ${className}`}>
            {children}
        </span>
    )
}
