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
  Receipt,
  FileText
} from "lucide-react"
import { pdf } from '@react-pdf/renderer'
import CommercialInvoicePDF from '@/components/dashboard/customer-bills/CommercialInvoicePDF'
import TaxInvoicePDF from '@/components/dashboard/customer-bills/TaxInvoicePDF'
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import RecordPaymentModal from "@/components/dashboard/ledger/RecordPaymentModal"
import { useSession } from "next-auth/react"
import { getCompanyDetails } from "@/lib/constants"

export default function CustomerBillsDashboardPage() {
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

  const [customerBills, setCustomerBills] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("All")

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedBill, setSelectedBill] = React.useState<any>(null);

  const fetchCustomerBills = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/customer-bills')
      const json = await res.json()
      if (json.success) setCustomerBills(json.data)
    } catch (error) {
      toast.error("Failed to fetch customer bills")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchCustomerBills()
  }, [])

  const filteredCustomerBills = React.useMemo(() => {
    return customerBills.filter(bill => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        bill.billNo?.toLowerCase().includes(searchLower) ||
        bill.consigneeDetails?.name?.toLowerCase().includes(searchLower) ||
        bill.jobId?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false

      if (statusFilter !== "All") {
        const stat = bill.status?.toLowerCase() || "unpaid"
        if (statusFilter === "Paid" && stat !== "paid") return false
        if (statusFilter === "Pending" && (stat === "paid" || stat === "overdue")) return false
        if (statusFilter === "Overdue" && stat !== "overdue") return false
      }

      return true
    })
  }, [customerBills, searchTerm, statusFilter])

  const stats = React.useMemo(() => {
    const s = filteredCustomerBills.reduce((acc: any, bill: any) => {
      const total = Number(bill.financials?.totalAmountINR) || 0;
      const paid = Number(bill.amountPaid) || (bill.status === "Paid" ? total : 0);
      
      acc.totalReceivable += total;
      acc.collected += paid;
      acc.outstanding += (total - paid);

      return acc;
    }, { totalReceivable: 0, outstanding: 0, collected: 0 });

    const collectionRate = s.totalReceivable > 0 ? (s.collected / s.totalReceivable) * 100 : 0;
    return { ...s, collectionRate };
  }, [filteredCustomerBills])

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
        totalAmount: bill.financials?.totalAmountINR || 0,
        balanceDue: bill.balanceDue ?? (bill.status === "Paid" ? 0 : bill.financials?.totalAmountINR || 0),
        type: "Customer"
    });
    setIsModalOpen(true);
  };

  const handleViewPDF = async (bill: any, type: 'Commercial' | 'Tax') => {
    toast.info(`Generating ${type} Invoice Preview...`)
    try {
      const tenantId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("tenant-id="))
        ?.split("=")[1];
      const companyDetails = getCompanyDetails(tenantId);
      const dataWithCompany = { ...bill, companyDetails };

      const PDFComponent = type === 'Commercial' ? CommercialInvoicePDF : TaxInvoicePDF;
      const blob = await pdf(<PDFComponent data={dataWithCompany} />).toBlob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) { 
        console.error(error);
        toast.error(`Failed to generate ${type} PDF view`) 
    }
  }

  if (isLoading && customerBills.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Loading Customer Goods Bills...</p>
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
          
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1 w-8 bg-blue-600 rounded-full"></span>
                <span className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase">
                  Goods Export/Sales
                </span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Customer Bills
              </h2>
              <p className="text-slate-500 text-lg font-medium">
                Managing <span className="text-blue-600 font-bold">{formatCurrency(stats.outstanding)}</span> in outstanding goods sales receivables.
              </p>
            </div>

            <Link href="/dashboard/customer-bills/new">
                <Button className="group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white border-none">
                    <Plus className="h-5 w-5" />
                    New Customer Bill
                </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalReceivable)}</h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <TrendingUp className="h-4 w-4" />
                <span>Gross Revenue (Goods)</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Collected</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.collected)}</h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>{stats.collectionRate.toFixed(1)}% Collection Rate</span>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-blue-600 group hover:translate-y-[-4px] transition-all">
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Outstanding</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(stats.outstanding)}</h3>
              <div className="mt-4 flex items-center gap-2 text-white/80 font-bold text-xs">
                <Scale className="h-4 w-4" />
                <span>Pending Collections</span>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
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
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-50">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bill No</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Customer</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Amount (INR)</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Collected</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCustomerBills.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-16 text-center text-slate-400 font-bold">No Customer Bills found.</td>
                                </tr>
                            ) : (
                                filteredCustomerBills.map((bill: any) => (
                                    <tr key={bill._id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <Receipt className="h-4 w-4" />
                                                </div>
                                                <span className="font-black text-slate-900">{bill.billNo}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                {new Date(bill.billDate).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700 truncate max-w-[180px]">{bill.consigneeDetails?.name}</p>
                                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                                                {bill.jobReference}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-bold text-slate-900">
                                            {formatCurrency(bill.financials?.totalAmountINR)}
                                        </td>
                                        <td className="px-8 py-6 text-right font-bold text-emerald-600">
                                            {formatCurrency(bill.amountPaid)}
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge className={`font-black text-[10px] uppercase px-3 py-1 border-none ${
                                                bill.status === 'Paid' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                            }`}>
                                                {bill.status}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {bill.status !== "Paid" && (
                                                    <Button onClick={() => handleRecordPayment(bill)} variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-blue-600 hover:bg-blue-50 font-black text-[9px] uppercase">
                                                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Collect
                                                    </Button>
                                                )}
                                                <Button onClick={() => handleViewPDF(bill, 'Commercial')} variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-bold text-[9px] uppercase">
                                                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Commercial
                                                </Button>
                                                <Button onClick={() => handleViewPDF(bill, 'Tax')} variant="ghost" size="sm" className="h-9 px-3 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 font-bold text-[9px] uppercase">
                                                    <Receipt className="w-3.5 h-3.5 mr-1.5" /> Tax
                                                </Button>
                                                <Link href={`/dashboard/customer-bills/edit/${bill.billNo}`}>
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
        onSuccess={fetchCustomerBills}
        invoiceData={selectedBill}
      />
    </div>
  )
}
