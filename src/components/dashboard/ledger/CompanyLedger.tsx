"use client"

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";

export default function CompanyLedger({ companyId }: { companyId: string }) {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/companies/${companyId}/ledger`);
            const json = await res.json();
            if (json.success) {
                setInvoices(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch invoices", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, [companyId]);

    // Triggers the PATCH route we made earlier to flip the status
    const handleMarkAsPaid = async (invoiceId: string) => {
        try {
            const res = await fetch(`/api/invoices/${invoiceId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Paid" })
            });
            const json = await res.json();
            if (json.success) {
                fetchLedger(); // Refresh table to show green badge & timestamp
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    // Formatting Helpers
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const formatTime = (dateString: string) => {
         return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }

    if (loading) {
        return <div className="p-12 text-center text-slate-500 animate-pulse">Loading invoices...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Invoice Tracker</h2>
            </div>

            <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold">Invoice Date</TableHead>
                            <TableHead className="font-bold">Invoice #</TableHead>
                            <TableHead className="font-bold text-right">Amount (₹)</TableHead>
                            <TableHead className="font-bold text-center">Status</TableHead>
                            <TableHead className="font-bold">Timeline Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                    No invoices found for this customer.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((inv) => (
                                <TableRow key={inv.id} className="hover:bg-slate-50">
                                    <TableCell className="font-medium text-slate-900">
                                        {formatDate(inv.date)}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-semibold text-slate-900">{inv.reference}</p>
                                        <p className="text-xs text-slate-500">{inv.notes}</p>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900">
                                        {formatCurrency(inv.amount)}
                                    </TableCell>
                                    
                                    {/* STATUS COLUMN WITH TOGGLE */}
                                    <TableCell className="text-center">
                                        {inv.status === "Paid" ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px]">Paid</Badge>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px]">Unpaid</Badge>
                                                <button 
                                                    onClick={() => handleMarkAsPaid(inv.id)}
                                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline uppercase"
                                                >
                                                    Mark as Paid
                                                </button>
                                            </div>
                                        )}
                                    </TableCell>

                                    {/* DYNAMIC TIMELINE COLUMN */}
                                    <TableCell>
                                        {inv.status === "Paid" ? (
                                            <div className="text-xs text-slate-600 flex flex-col">
                                                <span className="font-bold text-emerald-700 flex items-center gap-1 mb-1">
                                                    <CheckCircle2 className="w-3 h-3"/> Cleared On:
                                                </span>
                                                <span>{formatDate(inv.paidAt)}</span>
                                                <span className="text-[10px] text-slate-400">{formatTime(inv.paidAt)}</span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-600 flex flex-col">
                                                <span className="font-bold text-amber-700 flex items-center gap-1 mb-1">
                                                    <Calendar className="w-3 h-3"/> Due By:
                                                </span>
                                                <span>{formatDate(inv.dueDate)}</span>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}