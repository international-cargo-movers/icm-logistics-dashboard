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
import { Card } from "@/components/ui/card"
import { 
    ChevronLeft, 
    ChevronRight, 
    Filter, 
    Edit3, 
    ArrowRight,
    Ship,
    Plane,
    Package,
    Activity
} from "lucide-react"

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

const ITEMS_PER_PAGE = 8; 

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
      <div className="bg-white rounded-3xl border-none shadow-xl p-20 text-center">
        <Activity className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-bold">Synchronizing Global Freight Records...</p>
      </div>
    )
  }

  const getModeIcon = (mode: string) => {
    if (mode?.toLowerCase().includes('air')) return <Plane className="h-3 w-3" />;
    if (mode?.toLowerCase().includes('ocean') || mode?.toLowerCase().includes('sea')) return <Ship className="h-3 w-3" />;
    return <Package className="h-3 w-3" />;
  }

  return (
    <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
      
      <div className="px-8 py-5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
            {availableStatuses.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${
                  statusFilter === status 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {filteredJobs.length} Records Detected
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
            <TableHeader className="bg-white">
            <TableRow className="hover:bg-transparent border-slate-50">
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reference</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Customer Entity</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Route Logic</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mode</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {paginatedJobs.length === 0 ? (
                <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                        <Package className="h-10 w-10 text-slate-200" />
                        <p className="text-slate-400 font-bold">No operational records match your query.</p>
                    </div>
                </TableCell>
                </TableRow>
            ) : (
                paginatedJobs.map((job) => (
                <TableRow
                    key={job._id}
                    className="group cursor-pointer hover:bg-slate-50/50 transition-all border-slate-50"
                    onClick={() => router.push(`/dashboard/jobs/${job.jobId}`)}
                >
                    <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Activity className="h-4 w-4" />
                            </div>
                            <span className="font-black text-slate-900">{job.jobId}</span>
                        </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                        <p className="font-bold text-slate-700">{job.customerDetails?.companyId?.name || "Unknown Customer"}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Direct Entity</p>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">{job.shipmentDetails?.portOfLoading || "TBD"}</span>
                            <ArrowRight className="h-3 w-3 text-slate-300" />
                            <span className="text-xs font-bold text-slate-600">{job.shipmentDetails?.portOfDischarge || "TBD"}</span>
                        </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none text-[9px] font-bold uppercase px-3 py-1 flex items-center gap-2 w-fit">
                            {getModeIcon(job.shipmentDetails?.mode || "")}
                            {job.shipmentDetails?.mode || "N/A"}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                        <Badge 
                            variant={job.cargoDetails?.jobStatus === "Processing" ? "secondary" : "default"}
                            className={`font-black text-[10px] uppercase px-3 py-1 border-none ${
                                job.cargoDetails?.jobStatus === "Processing" 
                                    ? "bg-blue-50 text-blue-700" 
                                    : job.cargoDetails?.jobStatus === "Completed"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                            }`}
                        >
                            {job.cargoDetails?.jobStatus || "Processing"}
                        </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/jobs/edit/${job._id}`);
                        }}
                    >
                        <Edit3 className="h-4 w-4" />
                    </Button>
                    </TableCell>
                </TableRow>
                ))
            )}
            </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Terminal Page {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-9 px-4 rounded-xl border-slate-200 font-bold text-xs hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-9 px-4 rounded-xl border-slate-200 font-bold text-xs hover:bg-white"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
