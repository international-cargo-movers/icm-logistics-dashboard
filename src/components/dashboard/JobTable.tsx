// const MOCK_JOBS = [
//   {
//     id: "FR-902341",
//     customer: "Global Logistics",
//     route: "Shanghai → Rotterdam",
//     status: "In Transit",
//     eta: "2024-11-14",
//     statusColor: "bg-green-100 text-green-700",
//   },
//   {
//     id: "FR-881203",
//     customer: "TechMove Systems",
//     route: "Singapore → Los Angeles",
//     status: "Booking",
//     eta: "2024-11-09",
//     statusColor: "bg-blue-100 text-blue-700",
//   },
//   {
//     id: "FR-776452",
//     customer: "Apex Ventures",
//     route: "Hamburg → New York",
//     status: "Delivered",
//     eta: "2024-11-05",
//     statusColor: "bg-gray-100 text-gray-700",
//   },
//   {
//     id: "FR-651239",
//     customer: "Blue Mountain Co.",
//     route: "Busan → Felixstowe",
//     status: "Delayed",
//     eta: "2024-11-20",
//     statusColor: "bg-red-100 text-red-700",
//   },
// ];

// export default function JobTable() {
//   return (
//     <div className="rounded-2xl border bg-background overflow-hidden">
//       <div className="px-8 py-6 border-b flex justify-between">
//         <span className="text-sm font-medium">All Jobs</span>
//         <span className="text-xs text-muted-foreground">
//           Showing 1-{MOCK_JOBS.length} of 1,248
//         </span>
//       </div>

//       <table className="w-full text-left">
//         <thead className="bg-muted/50 text-xs uppercase">
//           <tr>
//             <th className="px-8 py-4">Job ID</th>
//             <th className="px-8 py-4">Customer</th>
//             <th className="px-8 py-4">Route</th>
//             <th className="px-8 py-4">Status</th>
//             <th className="px-8 py-4 text-right">ETA</th>
//           </tr>
//         </thead>

//         <tbody>
//           {MOCK_JOBS.map((job) => (
//             <tr key={job.id} className="border-t hover:bg-muted/40 transition-colors">
//               <td className="px-8 py-6 font-mono text-primary">#{job.id}</td>
//               <td className="px-8 py-6 font-medium">{job.customer}</td>
//               <td className="px-8 py-6 text-muted-foreground">{job.route}</td>
//               <td className="px-8 py-6">
//                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${job.statusColor}`}>
//                   {job.status}
//                 </span>
//               </td>
//               <td className="px-8 py-6 text-right font-mono text-sm">
//                 {job.eta}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Define a rough type for the incoming data
type Job = {
  _id: string;
  jobId: string;
  customerDetails?: {
    companyId?: { name: string };
  };
  shipmentDetails?: {
    mode: string;
    portOfLoading: string;
    portOfDischarge: string;
  };
  cargoDetails?: {
    jobStatus: string;
  };
}

export default function JobTable() {
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()

  React.useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/jobs")
        const json = await res.json()
        if (json.success) {
          setJobs(json.data)
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border shadow-sm p-12 text-center animate-pulse text-muted-foreground">
        Loading active freight data...
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border shadow-sm overflow-hidden mb-12">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-bold">Job ID</TableHead>
            <TableHead className="font-bold">Customer</TableHead>
            <TableHead className="font-bold">Routing</TableHead>
            <TableHead className="font-bold">Mode</TableHead>
            <TableHead className="font-bold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                No active jobs found. Click "Create New Job" to get started!
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => (
              <TableRow
                key={job._id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                // This prepares us for the next phase: clicking a job opens its specific page!
                onClick={() => router.push(`/dashboard/jobs/${job.jobId}`)}
              >
                <TableCell className="font-medium text-primary">{job.jobId}</TableCell>
                <TableCell>
                  {/* Notice how we pull the populated name! */}
                  {job.customerDetails?.companyId?.name || "Unknown Customer"}
                </TableCell>
                <TableCell>
                  {job.shipmentDetails?.portOfLoading || "TBD"} → {job.shipmentDetails?.portOfDischarge || "TBD"}
                </TableCell>
                <TableCell>{job.shipmentDetails?.mode}</TableCell>
                <TableCell>
                  <Badge 
                    variant={job.cargoDetails?.jobStatus === "Processing" ? "secondary" : "default"}
                    className={job.cargoDetails?.jobStatus === "Processing" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : ""}
                  >
                    {job.cargoDetails?.jobStatus || "Processing"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}