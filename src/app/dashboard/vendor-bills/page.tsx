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
  PlusCircle,
  Receipt
} from "lucide-react"
import { pdf } from '@react-pdf/renderer'
import VendorBillPDF from '@/components/dashboard/vendor-bills/VendorBillPDF'
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import RecordPaymentModal from "@/components/dashboard/ledger/RecordPaymentModal"

export default function VendorBillsDashboardPage() {
  const router = useRouter()
  const [vendorBills, setVendorBills] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("All")
  const [dateFilter, setDateFilter] = React.useState("All")

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedBill, setSelectedBill] = React.useState<any>(null);

  const fetchVendorBills = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/vendor-bills')
      const json = await res.json()
      if (json.success) setVendorBills(json.data)
    } catch (error) {
      toast.error("Failed to fetch vendor bills")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchVendorBills()
  }, [])

  const filteredVendorBills = React.useMemo(() => {
    return vendorBills.filter(bill => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        bill.billNo?.toLowerCase().includes(searchLower) ||
        bill.sellerDetails?.name?.toLowerCase().includes(searchLower) ||
        bill.jobId?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false

      if (statusFilter !== "All") {
        const stat = bill.status?.toLowerCase() || "unpaid"
        if (statusFilter === "Paid" && stat !== "paid") return false
        if (statusFilter === "Pending" && (stat === "paid" || stat === "overdue")) return false
        if (statusFilter === "Overdue" && stat !== "overdue") return false
      }

      if (dateFilter === "30Days") {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const billDate = new Date(bill.billDate || bill.createdAt)
        if (billDate < thirtyDaysAgo) return false
      }
      return true
    })
  }, [vendorBills, searchTerm, statusFilter, dateFilter])

  const stats = React.useMemo(() => {
    const s = filteredVendorBills.reduce((acc: any, bill: any) => {
      const total = Number(bill.totals?.netAmount) || 0;
      const paid = Number(bill.amountPaid) || (bill.status === "Paid" ? total : 0);
      
      acc.totalCost += total;
      acc.settled += paid;
      acc.outstanding += (total - paid);

      if (bill.status?.toLowerCase() === "overdue") {
        acc.overdue += (total - paid);
      }

      return acc;
    }, { totalCost: 0, outstanding: 0, overdue: 0, settled: 0 });

    const settlementRate = s.totalCost > 0 ? (s.settled / s.totalCost) * 100 : 0;
    return { ...s, settlementRate };
  }, [filteredVendorBills])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
  };

  const handleRecordPayment = (bill: any) => {
    setSelectedBill({
        id: bill._id,
        invoiceNo: bill.billNo,
        totalAmount: bill.totals?.netAmount || 0,
        balanceDue: bill.balanceDue ?? (bill.status === "Paid" ? 0 : bill.totals?.netAmount || 0),
        type: "VendorBill"
    });
    setIsModalOpen(true);
  };

  const handleView = async (bill: any) => {
    toast.info("Generating Bill Preview...")
    try {
      const blob = await pdf(<VendorBillPDF data={bill} />).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) { 
        console.error(error);
        toast.error("Failed to generate PDF view") 
    }
  }

  const handleDownload = async (bill: any) => {
    toast.info("Downloading PDF...")
    try {
      const blob = await pdf(<VendorBillPDF data={bill} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `BILL-${bill.billNo}.pdf`
      link.click()
    } catch (error) { toast.error("Failed to download PDF") }
  }

  if (isLoading && vendorBills.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Loading Goods Bills...</p>
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
                  Goods Procurement
                </span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Vendor Bills
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Tracking <span className="text-blue-600 font-bold">{formatCurrency(stats.outstanding)}</span> in outstanding goods procurement dues.
              </p>
            </div>

            <Link href="/dashboard/vendor-bills/new">
                <Button className="group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white border-none">
                    <Plus className="h-5 w-5" />
                    Record Goods Bill
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
                    Goods Value
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Procurement</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalCost)}</h3>
              <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Total Bills Value</span>
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
                <span>Bills Settled</span>
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
                <span>Unpaid Bills</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Overdue Bills</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.overdue)}</h3>
              <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-xs">
                <Activity className="h-4 w-4" />
                <span>Critical Dues</span>
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
                    {filteredVendorBills.length} Goods Bills Detected
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-50">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bill No</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Seller</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Amount</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Settled</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Dues</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredVendorBills.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Receipt className="h-10 w-10 text-slate-200" />
                                            <p className="text-slate-400 font-bold">No Goods Bills found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredVendorBills.map((bill: any) => (
                                    <tr key={bill._id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <Receipt className="h-4 w-4" />
                                                </div>
                                                <span className="font-black text-slate-900">{bill.billNo}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                                                {new Date(bill.billDate || bill.createdAt).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700 truncate max-w-[150px]">{bill.sellerDetails?.name || "Unknown"}</p>
                                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                                                {bill.jobReference || bill.jobId || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-bold text-slate-900">
                                            {formatCurrency(bill.totals?.netAmount)}
                                        </td>
                                        <td className="px-8 py-6 text-right font-bold text-rose-600">
                                            {formatCurrency(bill.amountPaid || (bill.status === "Paid" ? bill.totals?.netAmount : 0))}
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-rose-600">
                                            {formatCurrency(bill.balanceDue ?? (bill.status === "Paid" ? 0 : bill.totals?.netAmount))}
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge className={`font-black text-[10px] uppercase px-3 py-1 border-none ${
                                                bill.status === 'Paid' 
                                                    ? "bg-emerald-50 text-emerald-700" 
                                                    : bill.status === 'Partially Paid'
                                                    ? "bg-indigo-50 text-indigo-700"
                                                    : bill.status === 'Overdue'
                                                    ? "bg-rose-50 text-rose-700"
                                                    : "bg-amber-50 text-amber-700"
                                            }`}>
                                                {bill.status || "Pending"}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {bill.status !== "Paid" && (
                                                    <Button onClick={() => handleRecordPayment(bill)} variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-rose-600 hover:bg-rose-50 font-black text-[9px] uppercase">
                                                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Settle
                                                    </Button>
                                                )}
                                                <Button onClick={() => handleView(bill)} variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button onClick={() => handleDownload(bill)} variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Link href={`/dashboard/vendor-bills/edit/${bill.billNo}`}>
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
        onSuccess={fetchVendorBills}
        invoiceData={selectedBill}
      />
    </div>
  )
}
