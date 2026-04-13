"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Edit2 } from "lucide-react"
import {
    Plus,
    Search,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    MoreHorizontal
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

    useEffect(() => {
        fetchQuotes()
    }, [])

    const fetchQuotes = async () => {
        try {
            const res = await fetch("/api/quotes")
            const json = await res.json()
            if (json.success) setQuotes(json.data)
        } catch (error) {
            console.error("Failed to fetch quotes:", error)
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
                // Optimistically update the UI to instantly reflect the new lock
                setQuotes(quotes.map(q => q.quoteId === quoteId ? { ...q, status: newStatus } : q))
            }
        } catch (error) {
            console.error("Failed to update status:", error)
        }
    }

    const filteredQuotes = quotes.filter(quote => {
        const query = searchQuery.toLowerCase()
        return quote.quoteId.toLowerCase().includes(query) ||
            (quote.customerDetails?.companyId?.name || "").toLowerCase().includes(query) ||
            quote.routingDetails?.destinationPort.toLowerCase().includes(query)
    })

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
                            placeholder="Search by Quote ID, Client, or Destination..."
                            type="text"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
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
                                {!isLoading && filteredQuotes.length === 0 && (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">No quotes found.</td></tr>
                                )}

                                {filteredQuotes.map((quote) => (
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
                                                ${quote.financials?.totalSell?.toLocaleString()}
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
                                                    <DropdownMenuLabel>Pipeline Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {quote.status !== "Approved" && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/quotes/${quote.quoteId}/edit`} className="cursor-pointer font-medium mb-1">
                                                                <Edit2 className="w-4 h-4 mr-2" /> Revise Quote
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {quote.status !== "Approved" && (
                                                        <DropdownMenuItem
                                                            onClick={() => updateStatus(quote.quoteId, "Approved")}
                                                            className="text-emerald-600 font-bold focus:text-emerald-700 cursor-pointer"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Approved
                                                        </DropdownMenuItem>
                                                    )}
                                                    {quote.status !== "Approved" && quote.status !== "Rejected" && (
                                                        <DropdownMenuItem
                                                            onClick={() => updateStatus(quote.quoteId, "Rejected")}
                                                            className="text-error font-bold focus:text-error cursor-pointer"
                                                        >
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
                </div>
            </div>
        </div>
    )
}