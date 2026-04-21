"use client"
import * as React from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import JobTable from "@/components/dashboard/JobTable"
import StatsCard from "@/components/dashboard/StatsCard"
import { Button } from "@/components/ui/button" 
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter();
  
  // 1. Lifted state: This holds whatever the user types in the TopNav
  const [searchTerm, setSearchTerm] = React.useState("");

  // 2. State to hold our dynamic KPIs
  const [stats, setStats] = React.useState({
    active: 0,
    completed: 0,
    air: 0,
    ocean: 0,
    totalWeight: 0
  });
  const [loadingStats, setLoadingStats] = React.useState(true);

  // 3. Fetch jobs and calculate KPIs
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/jobs");
        const json = await res.json();
        
        if (json.success && json.data) {
          const jobs = json.data;
          
          // Calculate metrics based on your schema
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
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="bg-surface text-on-background antialiased font-body min-h-screen">
      <Sidebar />

      <main className="min-h-screen">
        <TopNav searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        <div className="pt-24 px-12 pb-12">
          {/* Hero */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
            <div className="max-w-2xl">
              <span className="text-[10px] font-bold tracking-[0.2em] text-on-primary-container uppercase mb-2 block">
                Global Logistics Interface
              </span>
              <h2 className="text-5xl font-headline font-extrabold text-primary tracking-tighter mb-4">
                Active Freight Jobs
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Managing {loadingStats ? "..." : stats.active} active shipments across global trade lanes.
              </p>
            </div>

            <Button onClick={()=>{router.push("/dashboard/new-job")}} className="flex items-center gap-3 px-6 py-6 rounded-lg font-semibold shadow-xl hover:opacity-90 active:scale-95 bg-gradient-to-br from-primary to-primary-container text-on-primary">
              Create New Job
            </Button>
          </div>

          {/* Dynamic Stats */}
          <div className="grid grid-cols-4 gap-6 mb-12">
            <StatsCard 
              title="Active Shipments" 
              value={loadingStats ? "..." : stats.active.toString()} 
              subtitle="Pending or in transit" 
            />
            <StatsCard 
              title="Completed Jobs" 
              value={loadingStats ? "..." : stats.completed.toString()} 
              subtitle="Successfully delivered" 
            />
            <StatsCard 
              title="Air Freight" 
              value={loadingStats ? "..." : stats.air.toString()} 
              subtitle="Total air shipments" 
            />
            <StatsCard 
              title="Total Cargo Wt." 
              value={loadingStats ? "..." : `${(stats.totalWeight / 1000).toFixed(1)} MT`} 
              subtitle="Processed to date" 
            />
          </div>

          <JobTable searchTerm={searchTerm} />

        </div>
      </main>
    </div>
  )
}