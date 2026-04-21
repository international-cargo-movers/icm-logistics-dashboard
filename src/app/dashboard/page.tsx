"use client"
import * as React from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import JobTable from "@/components/dashboard/JobTable"
import { Card } from "@/components/ui/card"
import { IndianRupee, Ship, AlertCircle, FileCheck } from "lucide-react"
import { RevenueChart, JobModeChart } from "@/components/dashboard/AnalyticsCharts"

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState({
    totalJobs: 0,
    activeJobs: 0,
    totalBilled: 0,
    outstanding: 0,
    revenueData: [],
    modeData: []
  });

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="bg-surface text-on-background antialiased font-body min-h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <TopNav searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        {/* Global Padding for the main content */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 mt-16">
          
          {/* PAGE HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
              <p className="text-sm text-slate-500 mt-1">Real-time metrics for your freight operations and financial health.</p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <p className="text-sm font-medium text-slate-900">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileCheck className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Active Shipments</p>
                  <h3 className="text-2xl font-bold text-slate-900">{loading ? "..." : data.activeJobs}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><IndianRupee className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Billed</p>
                  <h3 className="text-2xl font-bold text-slate-900">{loading ? "..." : formatINR(data.totalBilled)}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-500">A/R Outstanding</p>
                  <h3 className="text-2xl font-bold text-slate-900">{loading ? "..." : formatINR(data.outstanding)}</h3>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Ship className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Lifetime Jobs</p>
                  <h3 className="text-2xl font-bold text-slate-900">{loading ? "..." : data.totalJobs}</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 col-span-2 shadow-sm border-slate-200">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900">Cash Flow (Invoiced vs Received)</h3>
                <p className="text-sm text-slate-500">Monthly breakdown of billed amounts versus cleared payments.</p>
              </div>
              {!loading && <RevenueChart data={data.revenueData} />}
            </Card>

            <Card className="p-6 shadow-sm border-slate-200">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900">Volume by Mode</h3>
                <p className="text-sm text-slate-500">Active and historical distribution.</p>
              </div>
              {!loading && <JobModeChart data={data.modeData} />}
            </Card>
          </div>


        </div>
      </main>
    </div>
  )
}