"use client"

import React, { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { 
    Scale,
    ArrowRight,
    Search
} from "lucide-react"
import Link from "next/link"

interface ReconciliationData {
    id: string;
    jobId: string;
    customer: string;
    incomingTaxable: number;
    incomingGst: number;
    outgoingTaxable: number;
    outgoingGst: number;
    marginTaxable: number;
    marginGst: number;
    status: string;
}

interface ReconciliationClientProps {
    initialData: ReconciliationData[];
}

export default function ReconciliationClient({ initialData }: ReconciliationClientProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = useMemo(() => {
        if (!searchTerm) return initialData;
        const lowerSearch = searchTerm.toLowerCase();
        return initialData.filter(item => 
            item.jobId.toLowerCase().includes(lowerSearch) ||
            item.customer.toLowerCase().includes(lowerSearch) ||
            item.status.toLowerCase().includes(lowerSearch)
        );
    }, [searchTerm, initialData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search by Job ID or Customer..." 
                            className="pl-10 bg-white border-slate-200 rounded-xl focus-visible:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-4 whitespace-nowrap">
                        {filteredData.length} Records
                    </Badge>
                </div>
            </div>

            {/* Table 1: Operational (Excl. GST) */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Scale className="h-5 w-5 text-emerald-600" /> Operational Reconciliation (Excl. GST)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[150px] font-bold text-slate-400 uppercase text-[10px] tracking-widest pl-8">Job ID</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Client / Entity</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Job Status</TableHead>
                                <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest">Receivables (Ex. GST)</TableHead>
                                <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest">Payables (Ex. GST)</TableHead>
                                <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest pr-8">Net Margin</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                                        No operational records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((data) => (
                                    <TableRow key={`op-${data.id}`} className="group hover:bg-slate-50/80 transition-colors border-slate-50">
                                        <TableCell className="pl-8">
                                            <Link href={`/dashboard/jobs/${data.id}/reconciliation`} className="group/link flex items-center gap-2">
                                                <span className="font-black text-slate-900 group-hover/link:text-blue-600 transition-colors">{data.jobId}</span>
                                                <ArrowRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 -translate-x-2 group-hover/link:translate-x-0 transition-all text-blue-600" />
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-bold text-slate-700 truncate max-w-[200px]">{data.customer}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold text-[10px] px-3 py-0.5 border-none shadow-none uppercase">
                                                {data.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-bold text-slate-900">{formatCurrency(data.incomingTaxable)}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-bold text-slate-900">{formatCurrency(data.outgoingTaxable)}</span>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className={`inline-flex items-center gap-2 font-black text-sm px-4 py-1.5 rounded-full ${
                                                data.marginTaxable >= 0 
                                                ? 'bg-emerald-50 text-emerald-700' 
                                                : 'bg-rose-50 text-rose-700'
                                            }`}>
                                                {formatCurrency(data.marginTaxable)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Table 2: GST Only */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Scale className="h-5 w-5 text-orange-600" /> Tax Reconciliation (GST Only)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[150px] font-bold text-slate-400 uppercase text-[10px] tracking-widest pl-8">Job ID</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Client / Entity</TableHead>
                                <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest">Receivable GST</TableHead>
                                <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest">Payable GST</TableHead>
                                <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest pr-8">Net GST Margin</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                                        No tax records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((data) => (
                                    <TableRow key={`gst-${data.id}`} className="group hover:bg-slate-50/80 transition-colors border-slate-50">
                                        <TableCell className="pl-8">
                                            <span className="font-black text-slate-900">{data.jobId}</span>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-bold text-slate-700 truncate max-w-[200px]">{data.customer}</p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-bold text-orange-600">{formatCurrency(data.incomingGst)}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-bold text-orange-600">{formatCurrency(data.outgoingGst)}</span>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className={`inline-flex items-center gap-2 font-black text-sm px-4 py-1.5 rounded-full ${
                                                data.marginGst >= 0 
                                                ? 'bg-orange-50 text-orange-700' 
                                                : 'bg-rose-50 text-rose-700'
                                            }`}>
                                                {formatCurrency(data.marginGst)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
