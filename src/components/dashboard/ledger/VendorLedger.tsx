"use client"

import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Calendar, 
    Clock, 
    CheckCircle2, 
    TrendingDown, 
    Scale, 
    AlertTriangle, 
    Activity,
    Download,
    ShieldCheck,
    ArrowDownRight,
    PlusCircle
} from "lucide-react";
import { toast } from "sonner";

export default function VendorLedger({ companyId }: { companyId: string }) {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/companies/${companyId}/vendor-ledger`);
            const json = await res.json();
            if (json.success) {
                setInvoices(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch vendor invoices", error);
            toast.error("Failed to sync vendor ledger data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, [companyId]);

    const stats = useMemo(() => {
        // Standard Accounting Calculation:
        // Lifetime Payables = Sum of all Vendor Invoices and Bills
        // Settled Balance = Sum of all actual Payments (Receipts)
        const total = invoices
            .filter(inv => inv.type === "Invoice" || inv.type === "Bill")
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);
            
        const settled = invoices
            .filter(inv => inv.type === "Receipt")
            .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
            
        const outstanding = total - settled;
        const rate = total > 0 ? (settled / total) * 100 : 0;
        return { total, settled, outstanding, rate };
    }, [invoices]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Activity className="h-10 w-10 text-rose-600 animate-spin" />
                <p className="text-slate-400 font-bold animate-pulse uppercase text-[10px] tracking-widest">Compiling Liability Statement...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Ledger KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Payables</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.total)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-xs">
                        <TrendingDown className="h-4 w-4" />
                        <span>Gross Liability</span>
                    </div>
                </Card>

                <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Settled Balance</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.settled)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                        <ShieldCheck className="h-4 w-4" />
                        <span>{stats.rate.toFixed(1)}% Settlement Rate</span>
                    </div>
                </Card>

                <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-rose-600 group hover:translate-y-[-4px] transition-all">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Account Balance</p>
                    <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(stats.outstanding)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-white/80 font-bold text-xs">
                        <Scale className="h-4 w-4" />
                        <span>Outstanding Dues</span>
                    </div>
                </Card>
            </div>

            {/* Transaction Records */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Supply Partner Trail</h3>
                        <p className="text-slate-400 text-sm font-medium">Detailed billings and disbursement logs</p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-slate-200 font-bold text-xs h-11 px-6 hover:bg-white shadow-sm">
                        <Download className="w-4 h-4 mr-2 text-rose-600" /> Export Statement
                    </Button>
                </div>

                <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-[32px]">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 border-b border-slate-50">
                                <TableRow className="hover:bg-transparent border-slate-50">
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bill Ref</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Billed</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Paid</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Balance</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Settlement</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <Scale className="h-10 w-10 text-slate-200" />
                                                <p className="text-slate-400 font-bold">No financial records detected for this supply partner.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-none">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg transition-colors ${
                                                        (inv.type === 'Invoice' || inv.type === 'Bill') 
                                                            ? 'bg-slate-100 group-hover:bg-rose-600 group-hover:text-white' 
                                                            : 'bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white text-emerald-600'
                                                    }`}>
                                                        {(inv.type === 'Invoice' || inv.type === 'Bill') ? <Calendar className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                    </div>
                                                    <span className="font-bold text-slate-900">{formatDate(inv.date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 group-hover:text-rose-600 transition-colors">{inv.reference}</span>
                                                        <Badge variant="outline" className={`text-[8px] font-black uppercase px-2 py-0 border-none ${
                                                            inv.type === 'Invoice' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                                        }`}>
                                                            {inv.type}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{inv.notes || "Standard Supply Bill"}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className={`font-bold ${(inv.type === 'Invoice' || inv.type === 'Bill') ? 'text-slate-900' : 'text-slate-300'}`}>
                                                    {inv.amount > 0 ? formatCurrency(inv.amount) : "—"}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className={`font-bold ${inv.type === 'Receipt' ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                    {inv.amountPaid > 0 ? formatCurrency(inv.amountPaid) : "—"}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className={`font-black ${inv.balanceDue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                    {(inv.type === 'Invoice' || inv.type === 'Bill') ? formatCurrency(inv.balanceDue) : "—"}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <Badge className={`font-black uppercase text-[9px] px-3 py-1 border-none ${
                                                    inv.status === "Paid" || inv.status === "Cleared"
                                                        ? "bg-emerald-50 text-emerald-700" 
                                                        : inv.status === "Partially Paid"
                                                        ? "bg-indigo-50 text-indigo-700"
                                                        : "bg-amber-50 text-amber-700"
                                                }`}>
                                                    {inv.status}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {(inv.status === "Paid" || inv.status === "Cleared") && (
                                                    <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-tighter">
                                                        <ShieldCheck className="h-3.5 w-3.5" /> {(inv.type === 'Invoice' || inv.type === 'Bill') ? 'Fully Settled' : 'Payment Verified'}
                                                    </div>
                                                )}
                                                {(inv.type === 'Invoice' || inv.type === 'Bill') && inv.status !== "Paid" && (
                                                     <div className="flex items-center justify-end gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-tighter">
                                                        <Clock className="h-3.5 w-3.5" /> Awaiting Payment
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
