"use client"

import * as React from "react"
import { useState, useEffect } from "react"
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
    ChevronRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function QuotesDashboard() {
    const [quotes, setQuotes] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 4

    useEffect(() => {
        fetchQuotes()
    }, [])

    // Reset to page 1 whenever the user types in the search box
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

    // --- SEARCH & PAGINATION LOGIC ---
    const filteredQuotes = quotes.filter(quote => {
        const query = searchQuery.toLowerCase()
        return quote.quoteId.toLowerCase().includes(query) ||
            (quote.customerDetails?.companyId?.name || "").toLowerCase().includes(query) ||
            (quote.routingDetails?.destinationPort || "").toLowerCase().includes(query) ||
            (quote.routingDetails?.originPort || "").toLowerCase().includes(query)
    })

    const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage)
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem)

    // Helper to style badges based on the strict Enum status
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Approved": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>
            case "Sent": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none"><Clock className="w-3 h-3 mr-1" /> Sent (Pending)</Badge>
            case "Rejected": return <Badge className="bg-error-container text-on-error-container hover:bg-error-container/80 border-none"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>
            default: return <Badge variant="outline" className="text-on-surface-variant"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>
        }
    }

    return (
        <div className="bg-surface text-on-surface antialiased min-h-screen px-10 py-12">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Quotations</h1>
                        <p className="text-on-surface-variant text-lg">Manage financial estimates and lock in approved deals.</p>
                    </div>
                    <Link href="/dashboard/quotes/new">
                        <Button className="bg-primary text-on-primary font-bold px-6 py-6 h-12 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                            <Plus className="w-5 h-5 mr-2" /> Generate New Quote
                        </Button>
                    </Link>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col gap-6 mb-8">
                    <div className="w-[40%] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                        <input
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all"
                            placeholder="Search by Quote ID, Client, or Port..."
                            type="text"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant/10">
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Reference ID</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Client</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Routing</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Mode</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Value (Sell)</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {isLoading && <tr><td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">Loading pipeline...</td></tr>}
                                {!isLoading && currentItems.length === 0 && (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">No quotes found.</td></tr>
                                )}

                                {currentItems.map((quote) => (
                                    <tr key={quote._id} className="group hover:bg-surface-container-low/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className="font-mono font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-md text-sm">
                                                {quote.quoteId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-semibold text-on-surface">
                                                {quote.customerDetails?.companyId?.name || "Unknown"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
                                                <span className="truncate max-w-[80px]">{quote.routingDetails?.originPort}</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-outline" />
                                                <span className="truncate max-w-[80px]">{quote.routingDetails?.destinationPort}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-medium">{quote.routingDetails?.mode}</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="font-black text-on-surface">
                                                ₹{quote.financials?.totalSell?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {getStatusBadge(quote.status)}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4 text-on-surface-variant" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Document Options</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleViewPDF(quote)} className="cursor-pointer font-medium">
                                                        <Eye className="w-4 h-4 mr-2 text-blue-600" /> View PDF
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDownloadPDF(quote)} className="cursor-pointer font-medium">
                                                        <Download className="w-4 h-4 mr-2 text-blue-600" /> Download PDF
                                                    </DropdownMenuItem>
                                                    
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>Pipeline Actions</DropdownMenuLabel>
                                                    {quote.status !== "Approved" && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/quotes/${quote.quoteId}/edit`} className="cursor-pointer font-medium mb-1">
                                                                <Edit2 className="w-4 h-4 mr-2" /> Revise Quote
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {quote.status !== "Approved" && (
                                                        <DropdownMenuItem onClick={() => updateStatus(quote.quoteId, "Approved")} className="text-emerald-600 font-bold focus:text-emerald-700 cursor-pointer">
                                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Approved
                                                        </DropdownMenuItem>
                                                    )}
                                                    {quote.status !== "Approved" && quote.status !== "Rejected" && (
                                                        <DropdownMenuItem onClick={() => updateStatus(quote.quoteId, "Rejected")} className="text-error font-bold focus:text-error cursor-pointer">
                                                            <XCircle className="w-4 h-4 mr-2" /> Mark as Rejected
                                                        </DropdownMenuItem>
                                                    )}
                                                    {quote.status === "Approved" && (
                                                        <DropdownMenuLabel className="text-xs text-muted-foreground italic">
                                                            Locked for Operations
                                                        </DropdownMenuLabel>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {!isLoading && filteredQuotes.length > itemsPerPage && (
                        <div className="bg-surface-container-low border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between">
                            <span className="text-sm text-on-surface-variant font-medium">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredQuotes.length)} of {filteredQuotes.length} quotes
                            </span>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="h-8"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="h-8"
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}