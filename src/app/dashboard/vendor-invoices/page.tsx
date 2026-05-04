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
  TrendingDown,
  Scale,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  PlusCircle
} from "lucide-react"
import { pdf } from '@react-pdf/renderer'
import VendorInvoicePDF from '@/components/dashboard/vendor-invoices/VendorInvoicePDF'
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import RecordPaymentModal from "@/components/dashboard/ledger/RecordPaymentModal"
import { useSession } from "next-auth/react"

export default function VendorInvoicesDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Subtle UI Abstraction: Silent redirect if not authorized
  React.useEffect(() => {
    if (status === "loading") return
    const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
    if (!userRoles.some(r => ["SuperAdmin", "Finance", "Operations"].includes(r))) {
      router.push("/dashboard")
    }
  }, [session, status, router])

  const [vendorInvoices, setVendorInvoices] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("All")
  const [dateFilter, setDateFilter] = React.useState("All")

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null);

  const fetchVendorInvoices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/vendor-invoices')
      const json = await res.json()
      if (json.success) setVendorInvoices(json.data)
    } catch (error) {
      toast.error("Failed to fetch vendor invoices")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchVendorInvoices()
  }, [])

  const filteredVendorInvoices = React.useMemo(() => {
    return vendorInvoices.filter(inv => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        inv.vendorInvoiceNo?.toLowerCase().includes(searchLower) ||
        inv.vendorDetails?.name?.toLowerCase().includes(searchLower) ||
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
        const invDate = new Date(inv.vendorInvoiceDate || inv.createdAt)
        if (invDate < thirtyDaysAgo) return false
      }
      return true
    })
  }, [vendorInvoices, searchTerm, statusFilter, dateFilter])

  const stats = React.useMemo(() => {
    const s = filteredVendorInvoices.reduce((acc: any, inv: any) => {
      const total = Number(inv.totals?.netAmount) || 0;
      const paid = Number(inv.amountPaid) || (inv.status === "Paid" ? total : 0);
      
      acc.totalVendorCost += total;
      acc.settled += paid;
      acc.outstanding += (total - paid);

      if (inv.status?.toLowerCase() === "overdue") {
        acc.overdue += (total - paid);
      }

      return acc;
    }, { totalVendorCost: 0, outstanding: 0, overdue: 0, settled: 0 });

    const settlementRate = s.totalVendorCost > 0 ? (s.settled / s.totalVendorCost) * 100 : 0;
    return { ...s, settlementRate };
  }, [filteredVendorInvoices])

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
        invoiceNo: inv.vendorInvoiceNo,
        totalAmount: inv.totals?.netAmount || 0,
        balanceDue: inv.balanceDue ?? (inv.status === "Paid" ? 0 : inv.totals?.netAmount || 0),
        type: "Vendor"
    });
    setIsModalOpen(true);
  };

  const handleView = async (inv: any) => {
    toast.info("Opening Vendor Invoice...")
    try {
        const cleanPayload = {
            ...inv,
            vendorInvoiceNo: inv.vendorInvoiceNo,
            vendorInvoiceDate: inv.vendorInvoiceDate ? new Date(inv.vendorInvoiceDate).toISOString().split('T')[0] : "",
            jobId: inv.jobReference || inv.jobId,
            vendorName: inv.vendorDetails?.name || "Unknown",
            billingAddress: inv.vendorDetails?.billingAddress || "",
            lineItems: inv.lineItems || [],
            totals: inv.totals || {}
          };
      const blob = await pdf(<VendorInvoicePDF data={cleanPayload} />).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) { toast.error("Failed to generate PDF view") }
  }

  const handleDownload = async (inv: any) => {
    toast.info("Downloading PDF...")
    try {
        const cleanPayload = {
            ...inv,
            vendorInvoiceNo: inv.vendorInvoiceNo,
            vendorInvoiceDate: inv.vendorInvoiceDate ? new Date(inv.vendorInvoiceDate).toISOString().split('T')[0] : "",
            jobId: inv.jobReference || inv.jobId,
            vendorName: inv.vendorDetails?.name || "Unknown",
            billingAddress: inv.vendorDetails?.billingAddress || "",
            lineItems: inv.lineItems || [],
            totals: inv.totals || {}
          };
      const blob = await pdf(<VendorInvoicePDF data={cleanPayload} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${inv.vendorInvoiceNo}.pdf`
      link.click()
    } catch (error) { toast.error("Failed to download PDF") }
  }

  if (isLoading && vendorInvoices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Synchronizing Payables...</p>
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
                  Payables Control
                </span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Vendor Invoices
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Managing <span className="text-blue-600 font-bold">{formatCurrency(stats.outstanding)}</span> in outstanding vendor dues across suppliers.
              </p>
            </div>

            <Link href="/dashboard/vendor-invoices/new">
                <Button className="group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white border-none">
                    <Plus className="h-5 w-5" />
                    Record Vendor Invoice
                </Button>
            </Link>
          </div>

          {/* Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <Badge className="bg-rose-100 text-rose-700 border-none font-bold">
                    Gross Payables
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Vendor Cost</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalVendorCost)}</h3>
              <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Accumulated Costs</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">
                    {stats.settlementRate.toFixed(1)}% Rate
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Settled Amount</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.settled)}</h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>Total Settled</span>
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
                <span>Pending Outflow</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Overdue Liability</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.overdue)}</h3>
              <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Overdue Payables</span>
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
                    {filteredVendorInvoices.length} Bills Detected
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-50">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bill ID</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vendor</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Billed</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Paid</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Balance</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredVendorInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Wallet className="h-10 w-10 text-slate-200" />
                                            <p className="text-slate-400 font-bold">No payables found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredVendorInvoices.map((inv: any) => (
                                    <tr key={inv._id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <ShieldCheck className="h-4 w-4" />
                                                </div>
                                                <span className="font-black text-slate-900">{inv.vendorInvoiceNo}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                                                {new Date(inv.vendorInvoiceDate || inv.createdAt).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700 truncate max-w-[150px]">{inv.vendorDetails?.name || "Unknown"}</p>
                                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                                                {inv.jobReference || inv.jobId || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-bold text-slate-900">
                                            {formatCurrency(inv.totals?.netAmount)}
                                        </td>
                                        <td className="px-8 py-6 text-right font-bold text-rose-600">
                                            {formatCurrency(inv.amountPaid || (inv.status === "Paid" ? inv.totals?.netAmount : 0))}
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-rose-600">
                                            {formatCurrency(inv.balanceDue ?? (inv.status === "Paid" ? 0 : inv.totals?.netAmount))}
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge className={`font-black text-[10px] uppercase px-3 py-1 border-none ${
                                                inv.status === 'Paid' 
                                                    ? "bg-emerald-50 text-emerald-700" 
                                                    : inv.status === 'Partially Paid'
                                                    ? "bg-indigo-50 text-indigo-700"
                                                    : inv.status === 'Overdue'
                                                    ? "bg-rose-50 text-rose-700"
                                                    : "bg-amber-50 text-amber-700"
                                            }`}>
                                                {inv.status || "Pending"}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {inv.status !== "Paid" && (
                                                    <Button onClick={() => handleRecordPayment(inv)} variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-rose-600 hover:bg-rose-50 font-black text-[9px] uppercase">
                                                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Settle
                                                    </Button>
                                                )}
                                                <Button onClick={() => handleView(inv)} variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button onClick={() => handleDownload(inv)} variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Link href={`/dashboard/vendor-invoices/edit/${inv._id}`}>
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </Link>
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
        onSuccess={fetchVendorInvoices}
        invoiceData={selectedInvoice}
      />
    </div>
  )
}
