import dbConnect from "@/lib/mongodb"
import JobModel from "@/model/JobModel"
import InvoiceModel from "@/model/InvoiceModel"
import { Card } from "@/components/ui/card"
import { IndianRupee, Ship, AlertCircle, FileCheck } from "lucide-react"
import { RevenueChart, JobStatusChart } from "@/components/dashboard/AnalyticsCharts"

export default async function DashboardPage() {
  await dbConnect();

  // --- 1. CRUNCHING THE KPIs ---
  const totalJobs = await JobModel.countDocuments();
  const activeJobs = await JobModel.countDocuments({ "cargoDetails.jobStatus": { $ne: "Completed" } });
  
  // Aggregate revenue data
  const invoiceStats = await InvoiceModel.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totals.netAmount" },
        // If status is 'Unpaid', add it to outstanding
        outstanding: {
          $sum: { $cond: [{ $eq: ["$status", "Unpaid"] }, "$totals.netAmount", 0] }
        }
      }
    }
  ]);

  const stats = invoiceStats[0] || { totalRevenue: 0, outstanding: 0 };

  // --- 2. CRUNCHING CHART DATA ---
  // Count jobs by status for the Pie Chart
  const statusCounts = await JobModel.aggregate([
    { $group: { _id: "$cargoDetails.jobStatus", count: { $sum: 1 } } }
  ]);
  
  const pieData = statusCounts.map(item => ({
    name: item._id || "Processing",
    value: item.count
  }));

  // For the bar chart, we'll map the invoices we have. 
  // (In a production app, you'd aggregate this by month)
  const recentInvoices = await InvoiceModel.find().sort({ createdAt: -1 }).limit(6).lean();
  const barData = recentInvoices.map((inv: any) => ({
    name: inv.invoiceNo.split('-')[1] || inv.invoiceNo, // Shorten name for x-axis
    total: inv.totals.netAmount
  })).reverse(); // Reverse so chronological is left-to-right

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen p-8 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Command Center</h1>
          <p className="text-slate-500 mt-2">Welcome back. Here is the pulse of your logistics operations.</p>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><IndianRupee className="w-5 h-5" /></div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Outstanding Payments</p>
                <h3 className="text-2xl font-bold text-red-600">₹{stats.outstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
              </div>
              <div className="p-3 bg-red-100 rounded-lg text-red-600"><AlertCircle className="w-5 h-5" /></div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Active Freight Jobs</p>
                <h3 className="text-2xl font-bold text-slate-900">{activeJobs}</h3>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><Ship className="w-5 h-5" /></div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Shipments Handled</p>
                <h3 className="text-2xl font-bold text-slate-900">{totalJobs}</h3>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600"><FileCheck className="w-5 h-5" /></div>
            </div>
          </Card>
        </div>

        {/* --- CHARTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2 border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Trajectory</h3>
              <p className="text-sm text-slate-500">Recent invoice totals</p>
            </div>
            <RevenueChart data={barData} />
          </Card>

          <Card className="p-6 border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Job Status Distribution</h3>
              <p className="text-sm text-slate-500">Current active pipeline</p>
            </div>
            <JobStatusChart data={pieData} />
          </Card>
        </div>

      </div>
    </div>
  )
}
// "use client"
// import Sidebar from "@/components/dashboard/Sidebar"
// import TopNav from "@/components/dashboard/TopNav"
// import JobTable from "@/components/dashboard/JobTable"
// import StatsCard from "@/components/dashboard/StatsCard"
// import InsightCard from "@/components/dashboard/InsightCard"
// import { Button } from "@/components/ui/button" // Imported Shadcn Button
// import {useRouter} from "next/navigation"

// export default function DashboardPage() {
//   const router = useRouter();
//   return (
//     <div className="bg-surface text-on-background antialiased font-body min-h-screen">
//       <Sidebar />

//       <main className="min-h-screen">
//         <TopNav />

//         <div className="pt-24 px-12 pb-12">
//           {/* Hero */}
//           <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
//             <div className="max-w-2xl">
//               <span className="text-[10px] font-bold tracking-[0.2em] text-on-primary-container uppercase mb-2 block">
//                 Global Logistics Interface
//               </span>
//               <h2 className="text-5xl font-headline font-extrabold text-primary tracking-tighter mb-4">
//                 Active Freight Jobs
//               </h2>
//               <p className="text-on-surface-variant text-lg leading-relaxed">
//                 Managing 1,248 active container units across 42 global trade lanes.
//               </p>
//             </div>

//             {/* Replaced standard HTML button with Shadcn Button */}
//             <Button onClick={()=>{router.push("/dashboard/new-job")}} className="flex items-center gap-3 px-6 py-6 rounded-lg font-semibold shadow-xl hover:opacity-90 active:scale-95 bg-gradient-to-br from-primary to-primary-container text-on-primary">
//               Create New Job
//             </Button>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-4 gap-6 mb-12">
//             <StatsCard title="In Transit" value="842" subtitle="+12% from last week" />
//             <StatsCard title="Pending Booking" value="156" subtitle="Avg. wait: 4.2 hrs" />
//             <StatsCard title="Arrivals Today" value="42" subtitle="8 cleared customs" />
//             <StatsCard title="Exception Alerts" value="04" subtitle="Action required" danger />
//           </div>

//           <JobTable />

//           {/* Insights */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
//             <InsightCard />
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }