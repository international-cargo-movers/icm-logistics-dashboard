"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search, 
  Wallet, 
  Clock, 
  AlertTriangle,
  Calendar, 
  Filter, 
  Eye, 
  Download, 
  Plus, 
  Edit, 
  CheckCircle,
  Activity,
  TrendingUp,
  Scale,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  FileText
} from "lucide-react"
import { pdf } from '@react-pdf/renderer'
import InvoicePDF from '@/components/dashboard/invoices/InvoicePDF'
import { getCompanyDetails } from "@/lib/constants"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import RecordPaymentModal from "@/components/dashboard/ledger/RecordPaymentModal"
import { useSession } from "next-auth/react"

export default function InvoicesDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Subtle UI Abstraction: Silent redirect if not authorized
  React.useEffect(() => {
    if (status === "loading") return
    const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
    if (!userRoles.some(r => ["SuperAdmin", "Finance"].includes(r))) {
      router.push("/dashboard")
    }
  }, [session, status, router])

  const [invoices, setInvoices] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("All")
  const [dateFilter, setDateFilter] = React.useState("All")

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null);

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/invoices')
      const json = await res.json()
      if (json.success) setInvoices(json.data)
    } catch (error) {
      toast.error("Failed to fetch invoices")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchInvoices()
  }, [])

  const filteredInvoices = React.useMemo(() => {
    return invoices.filter(inv => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        inv.invoiceNo?.toLowerCase().includes(searchLower) ||
        inv.customerDetails?.name?.toLowerCase().includes(searchLower) ||
        inv.jobId?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false

      if (statusFilter !== "All") {
        const stat = inv.status?.toLowerCase() || "pending"
        if (statusFilter === "Paid" && stat !== "paid") return false
        if (statusFilter === "Pending" && (stat === "paid" || stat === "overdue")) return false
        if (statusFilter === "Overdue" && stat !== "overdue") return false
      }

      if (dateFilter === "30Days") {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const invDate = new Date(inv.invoiceDate || inv.createdAt)
        if (invDate < thirtyDaysAgo) return false
      }
      return true
    })
  }, [invoices, searchTerm, statusFilter, dateFilter])

  const stats = React.useMemo(() => {
    const s = filteredInvoices.reduce((acc: any, inv: any) => {
      const total = Number(inv.totals?.netAmount) || 0;
      const paid = Number(inv.amountPaid) || (inv.status === "Paid" ? total : 0);
      
      acc.totalRevenue += total;
      acc.received += paid;
      acc.outstanding += (total - paid);

      if (inv.status?.toLowerCase() === "overdue") {
        acc.overdue += (total - paid);
      }

      return acc;
    }, { totalRevenue: 0, outstanding: 0, overdue: 0, received: 0 });

    const clearanceRate = s.totalRevenue > 0 ? (s.received / s.totalRevenue) * 100 : 0;
    return { ...s, clearanceRate };
  }, [filteredInvoices])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
  };

  const handleRecordPayment = (inv: any) => {
    setSelectedInvoice({
        id: inv._id,
        invoiceNo: inv.invoiceNo,
        totalAmount: inv.totals?.netAmount || 0,
        balanceDue: inv.balanceDue ?? (inv.status === "Paid" ? 0 : inv.totals?.netAmount || 0),
        type: "Customer"
    });
    setIsModalOpen(true);
  };

  const handleView = async (inv: any) => {
    toast.info("Opening Invoice...")
    try {
      const tenantId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("tenant-id="))
        ?.split("=")[1];
      const companyDetails = getCompanyDetails(tenantId);

      const cleanPayload = {
        ...inv,
        invoiceNo: inv.invoiceNo,
        issueDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : "",
        jobId: inv.jobReference || inv.jobId,
        customerName: inv.customerDetails?.name || "Unknown",
        billingAddress: inv.customerDetails?.billingAddress || "",
        lineItems: inv.lineItems || [],
        totals: inv.totals || {},
        companyDetails
      };
      const blob = await pdf(<InvoicePDF data={cleanPayload} />).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) { toast.error("Failed to generate PDF view") }
  }

  const handleDownload = async (inv: any) => {
    toast.info("Downloading PDF...")
    try {
        const tenantId = document.cookie
            .split("; ")
            .find((row) => row.startsWith("tenant-id="))
            ?.split("=")[1];
        const companyDetails = getCompanyDetails(tenantId);

        const cleanPayload = {
            ...inv,
            invoiceNo: inv.invoiceNo,
            issueDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : "",
            jobId: inv.jobReference || inv.jobId,
            customerName: inv.customerDetails?.name || "Unknown",
            billingAddress: inv.customerDetails?.billingAddress || "",
            lineItems: inv.lineItems || [],
            totals: inv.totals || {},
            companyDetails
          };
      const blob = await pdf(<InvoicePDF data={cleanPayload} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${inv.invoiceNo}.pdf`
      link.click()
    } catch (error) { toast.error("Failed to download PDF") }
  }

  if (isLoading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Synchronizing Receivables...</p>
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
                  Receivables Management
                </span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Customer Invoices
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Tracking <span className="text-blue-600 font-bold">{formatCurrency(stats.outstanding)}</span> in outstanding revenue across global accounts.
              </p>
            </div>

            <Link href="/dashboard/invoices/new">
                <Button className="group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white border-none">
                    <Plus className="h-5 w-5" />
                    Create New Invoice
                </Button>
            </Link>
          </div>

          {/* Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-none font-bold">
                    Total Billed
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Invoiced Revenue</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalRevenue)}</h3>
              <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Gross Billings</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">
                    {stats.clearanceRate.toFixed(1)}% Rate
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Clearance Rate</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.received)}</h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>Total Received</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.outstanding)}</h3>
              <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-xs">
                <Scale className="h-4 w-4" />
                <span>Pending Liquidity</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Overdue Portfolio</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.overdue)}</h3>
              <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Overdue Receivables</span>
              </div>
            </Card>
          </div>

          {/* Table Section */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        {["All", "Paid", "Pending", "Overdue"].map(status => (
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDateFilter(prev => prev === "All" ? "30Days" : "All")}
                        className={`h-9 px-4 rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-tighter ${dateFilter === "30Days" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                    >
                        <Calendar className="w-3.5 h-3.5 mr-2" /> {dateFilter === "30Days" ? "Last 30 Days" : "All Time"}
                    </Button>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {filteredInvoices.length} Invoices Found
                </div>
            </div>

          <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[1000px] lg:min-w-full">
                <thead className="bg-slate-50/50 border-b border-slate-50">
                  <tr>
                    <th className="w-[18%] px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Invoice Info</th>
                    <th className="w-[20%] px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Customer & Job</th>
                    <th className="w-[12%] px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
                    <th className="w-[15%] px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Total Billed</th>
                    <th className="w-[15%] px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Payment History</th>
                    <th className="w-[20%] px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Wallet className="h-10 w-10 text-slate-200" />
                          <p className="text-slate-400 font-bold">No receivables found matching your criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv: any) => (
                      <tr key={inv._id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-sm tracking-tight">{inv.invoiceNo}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <p className="font-bold text-slate-700 text-sm truncate">{inv.customerDetails?.name || "Unknown"}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {inv.jobReference || inv.jobId || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <Badge className={`font-black text-[9px] uppercase px-2.5 py-1 border-none rounded-full shadow-sm ${
                            inv.status === 'Paid' 
                              ? "bg-emerald-500 text-white" 
                              : inv.status === 'Partially Paid'
                              ? "bg-indigo-500 text-white"
                              : inv.status === 'Overdue'
                              ? "bg-rose-500 text-white"
                              : "bg-amber-500 text-white"
                          }`}>
                            {inv.status || "Pending"}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <p className="font-black text-slate-900 text-sm">{formatCurrency(inv.totals?.netAmount)}</p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-emerald-600">
                              Paid: {formatCurrency(inv.amountPaid || (inv.status === "Paid" ? inv.totals?.netAmount : 0))}
                            </span>
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">
                              Due: {formatCurrency(inv.balanceDue ?? (inv.status === "Paid" ? 0 : inv.totals?.netAmount))}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {inv.status !== "Paid" && (
                              <Button onClick={() => handleRecordPayment(inv)} size="sm" className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider shadow-lg shadow-emerald-500/20">
                                <PlusCircle className="w-3 h-3 mr-1" /> Settle
                              </Button>
                            )}
                            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                              <Button onClick={() => handleView(inv)} variant="ghost" className="h-7 w-7 p-0 rounded-md text-slate-500 hover:text-blue-600 hover:bg-white transition-all shadow-none">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button onClick={() => handleDownload(inv)} variant="ghost" className="h-7 w-7 p-0 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white transition-all shadow-none">
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                              <Button onClick={() => router.push(`/dashboard/invoices/edit/${inv._id}`)} variant="ghost" className="h-7 w-7 p-0 rounded-md text-slate-500 hover:text-amber-600 hover:bg-white transition-all shadow-none">
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          </div>

        </div>
      </main>

      <RecordPaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchInvoices}
        invoiceData={selectedInvoice}
      />
    </div>
  )
}
