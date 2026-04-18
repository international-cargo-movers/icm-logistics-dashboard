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
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Filter, MoreHorizontal, Eye, FileText, Archive, Edit3 } from "lucide-react"

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

const ITEMS_PER_PAGE = 7; 

export default function JobTable({ searchTerm = "" }: { searchTerm?: string }) {
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()

  const [currentPage, setCurrentPage] = React.useState(1)
  const [statusFilter, setStatusFilter] = React.useState("All")

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

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const availableStatuses = React.useMemo(() => {
    const statuses = new Set(jobs.map(j => j.cargoDetails?.jobStatus || "Processing"))
    return ["All", ...Array.from(statuses)]
  }, [jobs])

  const filteredJobs = React.useMemo(() => {
    return jobs.filter(job => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        job.jobId?.toLowerCase().includes(searchLower) ||
        job.customerDetails?.companyId?.name?.toLowerCase().includes(searchLower) ||
        job.shipmentDetails?.portOfLoading?.toLowerCase().includes(searchLower) ||
        job.shipmentDetails?.portOfDischarge?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false

      if (statusFilter !== "All") {
        const jobStatus = job.cargoDetails?.jobStatus || "Processing"
        if (jobStatus !== statusFilter) return false
      }

      return true
    })
  }, [jobs, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / ITEMS_PER_PAGE))
  const paginatedJobs = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredJobs, currentPage])

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border shadow-sm p-12 text-center animate-pulse text-muted-foreground">
        Loading active freight data...
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border shadow-sm overflow-hidden mb-12 flex flex-col">
      
      <div className="px-6 py-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground mr-2" />
          <div className="flex bg-muted/50 p-1 rounded-lg">
            {availableStatuses.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  statusFilter === status 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs font-medium text-muted-foreground">
          Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'}
        </div>
      </div>

      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="font-bold px-6 py-4">Job ID</TableHead>
            <TableHead className="font-bold">Customer</TableHead>
            <TableHead className="font-bold">Routing</TableHead>
            <TableHead className="font-bold">Mode</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            {/* NEW: Actions Header */}
            <TableHead className="font-bold text-right px-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedJobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                {searchTerm || statusFilter !== "All" 
                  ? "No jobs match your search filters." 
                  : "No active jobs found. Click 'Create New Job' to get started!"}
              </TableCell>
            </TableRow>
          ) : (
            paginatedJobs.map((job) => (
              <TableRow
                key={job._id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/dashboard/jobs/${job.jobId}`)}
              >
                <TableCell className="font-medium text-primary px-6 py-4">{job.jobId}</TableCell>
                <TableCell className="font-semibold">
                  {job.customerDetails?.companyId?.name || "Unknown Customer"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {job.shipmentDetails?.portOfLoading || "TBD"} → {job.shipmentDetails?.portOfDischarge || "TBD"}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md border">
                    {job.shipmentDetails?.mode || "N/A"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={job.cargoDetails?.jobStatus === "Processing" ? "secondary" : "default"}
                    className={job.cargoDetails?.jobStatus === "Processing" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : ""}
                  >
                    {job.cargoDetails?.jobStatus || "Processing"}
                  </Badge>
                </TableCell>
                {/* NEW: Actions Cell with Edit Button */}
                <TableCell className="text-right px-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents the row's onClick from triggering
                      router.push(`/dashboard/jobs/edit/${job._id}`);
                    }}
                  >
                    <span className="sr-only">Edit job</span>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2 text-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2 text-xs"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
// "use client"

// import * as React from "react"
// import { useRouter } from "next/navigation"
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { ChevronLeft, ChevronRight, Filter, MoreHorizontal, Eye, FileText, Archive, Edit3 } from "lucide-react"

// type Job = {
//   _id: string;
//   jobId: string;
//   customerDetails?: {
//     companyId?: { name: string };
//   };
//   shipmentDetails?: {
//     mode: string;
//     portOfLoading: string;
//     portOfDischarge: string;
//   };
//   cargoDetails?: {
//     jobStatus: string;
//   };
// }

// const ITEMS_PER_PAGE = 7; // Adjust this number to fit your layout perfectly

// export default function JobTable({ searchTerm = "" }: { searchTerm?: string }) {
//   const [jobs, setJobs] = React.useState<Job[]>([])
//   const [loading, setLoading] = React.useState(true)
//   const router = useRouter()

//   // Pagination & Filter States
//   const [currentPage, setCurrentPage] = React.useState(1)
//   const [statusFilter, setStatusFilter] = React.useState("All")

//   React.useEffect(() => {
//     async function fetchJobs() {
//       try {
//         const res = await fetch("/api/jobs")
//         const json = await res.json()
//         if (json.success) {
//           setJobs(json.data)
//         }
//       } catch (error) {
//         console.error("Failed to fetch jobs:", error)
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchJobs()
//   }, [])

//   // Reset to page 1 whenever a filter or search term changes
//   React.useEffect(() => {
//     setCurrentPage(1)
//   }, [searchTerm, statusFilter])

//   // Dynamically extract all unique statuses from the database for the filter buttons
//   const availableStatuses = React.useMemo(() => {
//     const statuses = new Set(jobs.map(j => j.cargoDetails?.jobStatus || "Processing"))
//     return ["All", ...Array.from(statuses)]
//   }, [jobs])

//   // --- ENGINE: Filter & Search ---
//   const filteredJobs = React.useMemo(() => {
//     return jobs.filter(job => {
//       // 1. Search Logic
//       const searchLower = searchTerm.toLowerCase()
//       const matchesSearch = 
//         job.jobId?.toLowerCase().includes(searchLower) ||
//         job.customerDetails?.companyId?.name?.toLowerCase().includes(searchLower) ||
//         job.shipmentDetails?.portOfLoading?.toLowerCase().includes(searchLower) ||
//         job.shipmentDetails?.portOfDischarge?.toLowerCase().includes(searchLower)
      
//       if (!matchesSearch) return false

//       // 2. Status Filter Logic
//       if (statusFilter !== "All") {
//         const jobStatus = job.cargoDetails?.jobStatus || "Processing"
//         if (jobStatus !== statusFilter) return false
//       }

//       return true
//     })
//   }, [jobs, searchTerm, statusFilter])

//   // --- ENGINE: Pagination ---
//   const totalPages = Math.max(1, Math.ceil(filteredJobs.length / ITEMS_PER_PAGE))
//   const paginatedJobs = React.useMemo(() => {
//     const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
//     return filteredJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE)
//   }, [filteredJobs, currentPage])

//   if (loading) {
//     return (
//       <div className="bg-surface rounded-xl border shadow-sm p-12 text-center animate-pulse text-muted-foreground">
//         Loading active freight data...
//       </div>
//     )
//   }

//   return (
//     <div className="bg-surface rounded-xl border shadow-sm overflow-hidden mb-12 flex flex-col">
      
//       {/* TOOLBAR: Filters & Job Count */}
//       <div className="px-6 py-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-4">
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-muted-foreground mr-2" />
//           <div className="flex bg-muted/50 p-1 rounded-lg">
//             {availableStatuses.map(status => (
//               <button
//                 key={status}
//                 onClick={() => setStatusFilter(status)}
//                 className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
//                   statusFilter === status 
//                     ? "bg-background text-foreground shadow-sm" 
//                     : "text-muted-foreground hover:text-foreground"
//                 }`}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//         </div>
//         <div className="text-xs font-medium text-muted-foreground">
//           Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'}
//         </div>
//       </div>

//       {/* TABLE */}
//       <Table>
//         <TableHeader className="bg-muted/30">
//           <TableRow>
//             <TableHead className="font-bold px-6 py-4">Job ID</TableHead>
//             <TableHead className="font-bold">Customer</TableHead>
//             <TableHead className="font-bold">Routing</TableHead>
//             <TableHead className="font-bold">Mode</TableHead>
//             <TableHead className="font-bold">Status</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {paginatedJobs.length === 0 ? (
//             <TableRow>
//               <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
//                 {searchTerm || statusFilter !== "All" 
//                   ? "No jobs match your search filters." 
//                   : "No active jobs found. Click 'Create New Job' to get started!"}
//               </TableCell>
//             </TableRow>
//           ) : (
//             paginatedJobs.map((job) => (
//               <TableRow
//                 key={job._id}
//                 className="cursor-pointer hover:bg-muted/50 transition-colors"
//                 onClick={() => router.push(`/dashboard/jobs/${job.jobId}`)}
//               >
//                 <TableCell className="font-medium text-primary px-6 py-4">{job.jobId}</TableCell>
//                 <TableCell className="font-semibold">
//                   {job.customerDetails?.companyId?.name || "Unknown Customer"}
//                 </TableCell>
//                 <TableCell className="text-muted-foreground">
//                   {job.shipmentDetails?.portOfLoading || "TBD"} → {job.shipmentDetails?.portOfDischarge || "TBD"}
//                 </TableCell>
//                 <TableCell>
//                   <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md border">
//                     {job.shipmentDetails?.mode || "N/A"}
//                   </span>
//                 </TableCell>
//                 <TableCell>
//                   <Badge 
//                     variant={job.cargoDetails?.jobStatus === "Processing" ? "secondary" : "default"}
//                     className={job.cargoDetails?.jobStatus === "Processing" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : ""}
//                   >
//                     {job.cargoDetails?.jobStatus || "Processing"}
//                   </Badge>
//                 </TableCell>
//               </TableRow>
//             ))
//           )}
//         </TableBody>
//       </Table>

//       {/* PAGINATION FOOTER */}
//       {totalPages > 1 && (
//         <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
//           <span className="text-xs text-muted-foreground font-medium">
//             Page {currentPage} of {totalPages}
//           </span>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//               disabled={currentPage === 1}
//               className="h-8 px-2 text-xs"
//             >
//               <ChevronLeft className="w-4 h-4 mr-1" /> Previous
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
//               disabled={currentPage === totalPages}
//               className="h-8 px-2 text-xs"
//             >
//               Next <ChevronRight className="w-4 h-4 ml-1" />
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }