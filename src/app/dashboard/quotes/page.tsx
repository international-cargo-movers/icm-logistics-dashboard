"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { pdf } from '@react-pdf/renderer'
import QuotePDF from '@/components/dashboard/quotes/QuotePDF'
import { toast } from "sonner"
import { 
    Plus, 
    Search, 
    FileText, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    ArrowRight, 
    MoreHorizontal,
    Edit2,
    Eye,
    Download,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Briefcase,
    Activity,
    Scale,
    ShieldCheck
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export default function QuotesDashboard() {
    const [quotes, setQuotes] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

    useEffect(() => {
        fetchQuotes()
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const fetchQuotes = async () => {
        try {
            const res = await fetch("/api/quotes")
            const json = await res.json()
            if (json.success) setQuotes(json.data)
        } catch (error) {
            console.error("Failed to fetch quotes:", error)
            toast.error("Failed to load quotes.")
        } finally {
            setIsLoading(false)
        }
    }

    const updateStatus = async (quoteId: string, newStatus: string) => {
        try {
            const res = await fetch("/api/quotes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quoteId, status: newStatus })
            })
            const json = await res.json()

            if (json.success) {
                setQuotes(quotes.map(q => q.quoteId === quoteId ? { ...q, status: newStatus } : q))
                toast.success(`Quote ${quoteId} marked as ${newStatus}`)
            }
        } catch (error) {
            console.error("Failed to update status:", error)
            toast.error("Failed to update status.")
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // --- KPI CALCULATIONS ---
    const stats = useMemo(() => {
        const total = quotes.length;
        const approved = quotes.filter(q => q.status === "Approved");
        const approvedValue = approved.reduce((sum, q) => sum + (q.financials?.totalSell || 0), 0);
        const winRate = total > 0 ? (approved.length / total) * 100 : 0;
        const pending = quotes.filter(q => q.status === "Sent" || q.status === "Draft").length;

        return { total, approvedValue, winRate, pending };
    }, [quotes]);

    // --- PDF GENERATION HELPERS ---
    const formatQuoteForPDF = (q: any) => {
        return {
            quoteRef: q.quoteId,
            date: new Date(q.validity?.issueDate).toLocaleDateString(),
            validUntil: new Date(q.validity?.expiryDate).toLocaleDateString(),
            customerName: q.customerDetails?.contactPerson || q.customerDetails?.companyId?.name,
            customerEmail: q.customerDetails?.companyId?.email || "",
            mode: q.routingDetails?.mode,
            originPort: q.routingDetails?.originPort,
            originCountry: q.routingDetails?.originCountry,
            destinationPort: q.routingDetails?.destinationPort,
            destinationCountry: q.routingDetails?.destinationCountry,
            cargoSummary: q.cargoSummary || {},
            lineItems: q.financials?.lineItems || [],
            totalSell: q.financials?.totalSell || 0
        }
    }

    const handleViewPDF = async (quote: any) => {
        toast.info("Generating PDF preview...")
        const data = formatQuoteForPDF(quote)
        const blob = await pdf(<QuotePDF data={data} />).toBlob()
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
    }

    const handleDownloadPDF = async (quote: any) => {
        toast.info("Generating PDF for download...")
        const data = formatQuoteForPDF(quote)
        const blob = await pdf(<QuotePDF data={data} />).toBlob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Quotation_${data.quoteRef}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const filteredQuotes = useMemo(() => {
        return quotes.filter(quote => {
            const query = searchQuery.toLowerCase()
            return quote.quoteId.toLowerCase().includes(query) ||
                (quote.customerDetails?.companyId?.name || "").toLowerCase().includes(query) ||
                (quote.routingDetails?.destinationPort || "").toLowerCase().includes(query) ||
                (quote.routingDetails?.originPort || "").toLowerCase().includes(query)
        })
    }, [quotes, searchQuery]);

    const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage)
    const currentItems = filteredQuotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Approved": return <Badge className="bg-emerald-50 text-emerald-700 border-none px-3 font-bold uppercase text-[10px]">Approved</Badge>
            case "Sent": return <Badge className="bg-blue-50 text-blue-700 border-none px-3 font-bold uppercase text-[10px]">Sent</Badge>
            case "Rejected": return <Badge className="bg-rose-50 text-rose-700 border-none px-3 font-bold uppercase text-[10px]">Rejected</Badge>
            default: return <Badge variant="outline" className="text-slate-500 border-slate-200 px-3 font-bold uppercase text-[10px]">Draft</Badge>
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="h-12 w-12 text-blue-600 animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Synchronizing Estimates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#F8FAFC] text-slate-900 antialiased font-body min-h-screen p-8 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="h-1 w-8 bg-blue-600 rounded-full"></span>
                            <span className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase">
                                Commercial Control
                            </span>
                        </div>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                            Quotations
                        </h2>
                        <p className="text-slate-500 text-lg font-medium">
                            Managing <span className="text-blue-600 font-bold">{stats.pending}</span> pending estimates and commercial lock-ins.
                        </p>
                    </div>

                    <Link href="/dashboard/quotes/new">
                        <Button className="group flex items-center gap-3 px-8 py-7 rounded-2xl font-bold shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white border-none">
                            <Plus className="h-5 w-5" />
                            Create New Quote
                        </Button>
                    </Link>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <Badge className="bg-blue-100 text-blue-700 border-none font-bold">
                                Live Pipeline
                            </Badge>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Approved Value</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.approvedValue)}</h3>
                        <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Locked for Execution</span>
                        </div>
                    </Card>

                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Scale className="h-6 w-6" />
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold">
                                {stats.winRate.toFixed(1)}% Rate
                            </Badge>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Commercial Win Rate</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.total} <span className="text-sm text-slate-400">Quotes</span></h3>
                        <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs">
                            <Activity className="h-4 w-4" />
                            <span>Conversion Performance</span>
                        </div>
                    </Card>

                    <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white group hover:translate-y-[-4px] transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <Clock className="h-6 w-6" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Action</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.pending} <span className="text-sm text-slate-400">Pending</span></h3>
                        <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-xs">
                            <Briefcase className="h-4 w-4" />
                            <span>In Communication</span>
                        </div>
                    </Card>
                </div>

                {/* Table Section */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search quote ID, client or port..." 
                                className="pl-12 py-6 bg-white border-none shadow-xl shadow-slate-200/50 rounded-2xl focus-visible:ring-blue-600"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-50 text-xs font-bold text-slate-500">
                            Showing {filteredQuotes.length} Total Quotes
                        </div>
                    </div>

                    <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reference</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Customer Entity</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Route Logic</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Value (Sell)</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-16 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-4 bg-slate-50 rounded-full">
                                                        <FileText className="h-8 w-8 text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-500 font-bold">No quotations found</p>
                                                    <p className="text-slate-400 text-sm">Adjust your filters or initialize a new quote.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((quote) => (
                                            <tr key={quote._id} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                            <ShieldCheck className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-black text-slate-900">{quote.quoteId}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-slate-700">{quote.customerDetails?.companyId?.name || "Unknown"}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Direct Client</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-600">{quote.routingDetails?.originPort}</span>
                                                        <ArrowRight className="h-3 w-3 text-slate-300" />
                                                        <span className="text-xs font-bold text-slate-600">{quote.routingDetails?.destinationPort}</span>
                                                    </div>
                                                    <Badge variant="secondary" className="mt-2 bg-slate-100 text-slate-500 border-none text-[9px] font-bold">
                                                        {quote.routingDetails?.mode}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-slate-900">{formatCurrency(quote.financials?.totalSell)}</p>
                                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter mt-1">Gross Sell</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {getStatusBadge(quote.status)}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100">
                                                                <MoreHorizontal className="h-5 w-5 text-slate-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl">
                                                            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">Document Ops</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleViewPDF(quote)} className="rounded-xl cursor-pointer font-bold text-xs p-3 focus:bg-blue-50 focus:text-blue-600">
                                                                <Eye className="w-4 h-4 mr-3" /> View Estimate PDF
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDownloadPDF(quote)} className="rounded-xl cursor-pointer font-bold text-xs p-3 focus:bg-blue-50 focus:text-blue-600">
                                                                <Download className="w-4 h-4 mr-3" /> Download Records
                                                            </DropdownMenuItem>
                                                            
                                                            <DropdownMenuSeparator className="my-2 bg-slate-50" />
                                                            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">Pipeline Control</DropdownMenuLabel>
                                                            {quote.status !== "Approved" && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/dashboard/quotes/${quote.quoteId}/edit`} className="rounded-xl cursor-pointer font-bold text-xs p-3 focus:bg-slate-50">
                                                                        <Edit2 className="w-4 h-4 mr-3" /> Revise Logistics
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {quote.status !== "Approved" && (
                                                                <DropdownMenuItem onClick={() => updateStatus(quote.quoteId, "Approved")} className="rounded-xl font-bold text-xs p-3 text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer">
                                                                    <CheckCircle2 className="w-4 h-4 mr-3" /> Authorize & Lock
                                                                </DropdownMenuItem>
                                                            )}
                                                            {quote.status !== "Approved" && quote.status !== "Rejected" && (
                                                                <DropdownMenuItem onClick={() => updateStatus(quote.quoteId, "Rejected")} className="rounded-xl font-bold text-xs p-3 text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer">
                                                                    <XCircle className="w-4 h-4 mr-3" /> Reject Proposal
                                                                </DropdownMenuItem>
                                                            )}
                                                            {quote.status === "Approved" && (
                                                                <div className="px-3 py-2 bg-slate-50 rounded-xl">
                                                                    <p className="text-[10px] text-slate-500 font-bold italic leading-tight">
                                                                        Commercial lock active. Locked for operational execution.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {!isLoading && filteredQuotes.length > itemsPerPage && (
                            <div className="bg-slate-50/50 border-t border-slate-50 px-8 py-5 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-bold">
                                    Terminal Entry {Math.min((currentPage - 1) * itemsPerPage + 1, filteredQuotes.length)} - {Math.min(currentPage * itemsPerPage, filteredQuotes.length)} of {filteredQuotes.length}
                                </span>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="h-9 px-4 rounded-xl border-slate-200 font-bold text-xs hover:bg-white"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="h-9 px-4 rounded-xl border-slate-200 font-bold text-xs hover:bg-white"
                                    >
                                        Next <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

            </div>
        </div>
    )
}
