import React from "react"
import dbConnect from "@/lib/mongodb"
import { getTenantModels } from "@/model/tenantModels"
import { Card } from "@/components/ui/card"
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Scale,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from "lucide-react"
import ReconciliationClient from "@/components/dashboard/reconciliation/ReconciliationClient"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function GlobalReconciliationPage() {
    const session = await getServerSession(authOptions);
    const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
    
    if (!session || !userRoles.some(r => ["SuperAdmin", "Finance"].includes(r))) {
        redirect("/dashboard");
    }

    await dbConnect();
    const { Job, Invoice, VendorInvoice, VendorBill } = await getTenantModels();

    // Fetch all jobs with populated customer details
    const jobs = await Job.find({})
        .populate("customerDetails.companyId", "name")
        .sort({ createdAt: -1 })
        .lean();
    
    // Fetch all invoices & bills
    const [customerInvoices, vendorInvoices, vendorBills] = await Promise.all([
        Invoice.find({}).lean(),
        VendorInvoice.find({}).lean(),
        VendorBill.find({}).lean()
    ]);

    // Map data for easy access
    const receivablesMap: Record<string, { taxable: number, gst: number }> = {};
    customerInvoices.forEach(inv => {
        const jId = inv.jobId?.toString();
        if (jId) {
            if (!receivablesMap[jId]) receivablesMap[jId] = { taxable: 0, gst: 0 };
            receivablesMap[jId].taxable += (inv.totals?.totalTaxable || 0);
            receivablesMap[jId].gst += (inv.totals?.totalGst || 0);
        }
    });

    const payablesMap: Record<string, { taxable: number, gst: number }> = {};
    vendorInvoices.forEach(inv => {
        const jId = inv.jobId?.toString();
        if (jId) {
            if (!payablesMap[jId]) payablesMap[jId] = { taxable: 0, gst: 0 };
            payablesMap[jId].taxable += (inv.totals?.totalTaxable || 0);
            payablesMap[jId].gst += (inv.totals?.totalGst || 0);
        }
    });
    vendorBills.forEach(bill => {
        const jId = bill.jobId?.toString();
        if (jId) {
            if (!payablesMap[jId]) payablesMap[jId] = { taxable: 0, gst: 0 };
            payablesMap[jId].taxable += (bill.totals?.totalTaxableValue || 0);
            payablesMap[jId].gst += (bill.totals?.totalTaxAmount || 0);
        }
    });

    const reconciliationData = jobs.map((job: any) => {
        const jId = job._id.toString();
        const incoming = receivablesMap[jId] || { taxable: 0, gst: 0 };
        const outgoing = payablesMap[jId] || { taxable: 0, gst: 0 };
        
        return {
            id: job._id.toString(),
            jobId: job.jobId,
            customer: job.customerDetails?.companyId?.name || job.customerDetails?.name || "N/A",
            incomingTaxable: incoming.taxable,
            incomingGst: incoming.gst,
            outgoingTaxable: outgoing.taxable,
            outgoingGst: outgoing.gst,
            marginTaxable: incoming.taxable - outgoing.taxable,
            marginGst: incoming.gst - outgoing.gst,
            status: job.cargoDetails?.jobStatus || "N/A"
        };
    });

    const totalTaxableReceivables = customerInvoices.reduce((sum, inv) => sum + (inv.totals?.totalTaxable || 0), 0);
    const totalTaxablePayables = vendorInvoices.reduce((sum, inv) => sum + (inv.totals?.totalTaxable || 0), 0) + 
                                vendorBills.reduce((sum, bill) => sum + (bill.totals?.totalTaxableValue || 0), 0);
    const totalOperationalMargin = totalTaxableReceivables - totalTaxablePayables;

    const totalGstReceivable = customerInvoices.reduce((sum, inv) => sum + (inv.totals?.totalGst || 0), 0);
    const totalGstPayable = vendorInvoices.reduce((sum, inv) => sum + (inv.totals?.totalGst || 0), 0) + 
                           vendorBills.reduce((sum, bill) => sum + (bill.totals?.totalTaxAmount || 0), 0);
    const netGstMargin = totalGstReceivable - totalGstPayable;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="bg-surface text-on-background min-h-screen p-10 lg:p-16">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-primary tracking-tight flex items-center gap-3">
                            <Scale className="h-10 w-10 text-blue-600" /> Financial Audit
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Real-time reconciliation across all active and completed jobs.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                        <div className="px-4 py-2 text-center">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Total Active Jobs</p>
                            <p className="text-xl font-bold text-slate-900">{jobs.length}</p>
                        </div>
                        <div className="w-[1px] h-8 bg-slate-100"></div>
                        <div className="px-4 py-2 text-center">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Reporting Cycle</p>
                            <p className="text-xl font-bold text-blue-600">FY 2026</p>
                        </div>
                    </div>
                </div>

                {/* KPI Summary Cards: Operational */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="p-8 border-none shadow-xl shadow-emerald-500/5 bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp className="h-24 w-24 text-emerald-600" />
                        </div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">Receivables (Excl. GST)</p>
                        <h2 className="text-4xl font-black text-slate-900 mb-2">{formatCurrency(totalTaxableReceivables)}</h2>
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                            <ArrowUpRight className="h-4 w-4" /> 
                            <span>Net Inflow</span>
                        </div>
                    </Card>

                    <Card className="p-8 border-none shadow-xl shadow-rose-500/5 bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingDown className="h-24 w-24 text-rose-600" />
                        </div>
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-4">Payables (Excl. GST)</p>
                        <h2 className="text-4xl font-black text-slate-900 mb-2">{formatCurrency(totalTaxablePayables)}</h2>
                        <div className="flex items-center gap-2 text-rose-600 text-sm font-bold">
                            <ArrowDownRight className="h-4 w-4" /> 
                            <span>Net Outflow</span>
                        </div>
                    </Card>

                    <Card className="p-8 border-none shadow-xl shadow-blue-500/10 bg-primary-container text-on-primary relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity className="h-24 w-24 text-white" />
                        </div>
                        <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-4">Net Operational Margin</p>
                        <h2 className="text-4xl font-black text-white mb-2">{formatCurrency(totalOperationalMargin)}</h2>
                        <div className="flex items-center gap-2 text-blue-300 text-sm font-bold">
                            <DollarSign className="h-4 w-4" /> 
                            <span>Core Profit</span>
                        </div>
                    </Card>
                </div>

                {/* KPI Summary Cards: GST Section (Optional but helpful for visibility) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex items-center gap-3 p-6 bg-orange-50 rounded-3xl border border-orange-100 shadow-sm">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Total GST Collected</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalGstReceivable)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-6 bg-rose-50 rounded-3xl border border-rose-100 shadow-sm">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-600">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total GST Paid</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalGstPayable)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-6 bg-blue-50 rounded-3xl border border-blue-100 shadow-sm">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                            <Scale className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Net GST Liability</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(netGstMargin)}</p>
                        </div>
                    </div>
                </div>

                {/* Detailed Job Audit Table */}
                <ReconciliationClient initialData={reconciliationData} />

                {/* Footer negative space / info */}
                <div className="text-center py-10 opacity-30">
                    <p className="text-xs font-bold uppercase tracking-[0.3em]">End of Financial Statement</p>
                </div>
            </div>
        </div>
    )
}
