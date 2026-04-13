"use client"
import * as React from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import JobTable from "@/components/dashboard/JobTable"
import StatsCard from "@/components/dashboard/StatsCard"
import InsightCard from "@/components/dashboard/InsightCard"
import { Button } from "@/components/ui/button" 
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter();
  
  // 1. Lifted state: This holds whatever the user types in the TopNav
  const [searchTerm, setSearchTerm] = React.useState("");

  return (
    <div className="bg-surface text-on-background antialiased font-body min-h-screen">
      <Sidebar />

      <main className="min-h-screen">
        {/* 2. Pass the state and the updater function into the TopNav */}
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
                Managing 1,248 active container units across 42 global trade lanes.
              </p>
            </div>

            <Button onClick={()=>{router.push("/dashboard/new-job")}} className="flex items-center gap-3 px-6 py-6 rounded-lg font-semibold shadow-xl hover:opacity-90 active:scale-95 bg-gradient-to-br from-primary to-primary-container text-on-primary">
              Create New Job
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-12">
            <StatsCard title="In Transit" value="842" subtitle="+12% from last week" />
            <StatsCard title="Pending Booking" value="156" subtitle="Avg. wait: 4.2 hrs" />
            <StatsCard title="Arrivals Today" value="42" subtitle="8 cleared customs" />
            <StatsCard title="Exception Alerts" value="04" subtitle="Action required" danger />
          </div>

          {/* 3. Pass the exact same search term down into the JobTable */}
          <JobTable searchTerm={searchTerm} />

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <InsightCard />
          </div>
        </div>
      </main>
    </div>
  )
}