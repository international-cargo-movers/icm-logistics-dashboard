"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Search, Building2, Wallet } from "lucide-react"
import CompanyLedger from "@/components/dashboard/ledger/CompanyLedger"

export default function LedgerPage() {
    const [companies, setCompanies] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // Fetch only the customers to populate the list
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await fetch("/api/companies");
                const json = await res.json();
                if (json.success) {
                    // Filter to only show Customers (or you can show all)
                    const customersOnly = json.data.filter((c: any) => c.type.includes("Customer"));
                    setCompanies(customersOnly);
                }
            } catch (error) {
                console.error("Failed to fetch companies:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const filteredCompanies = companies.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-1 h-full overflow-hidden">
            
            {/* LEFT COLUMN: Customer Selection List */}
            <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col h-full">
                <div className="p-6 border-b border-slate-200 bg-white">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-emerald-600" /> Accounts
                    </h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search customers..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <p className="text-center text-sm text-slate-500 mt-10 animate-pulse">Loading accounts...</p>
                    ) : filteredCompanies.map((company) => (
                        <button
                            key={company._id}
                            onClick={() => setSelectedCompanyId(company._id)}
                            className={`w-full text-left p-4 rounded-xl transition-all border ${
                                selectedCompanyId === company._id 
                                ? "bg-emerald-50 border-emerald-200 shadow-sm" 
                                : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm"
                            }`}
                        >
                            <h3 className={`font-bold text-sm ${selectedCompanyId === company._id ? "text-emerald-900" : "text-slate-900"}`}>
                                {company.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> {company.city || "No City"}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: The Ledger Details */}
            <div className="w-2/3 bg-white flex flex-col h-full overflow-y-auto">
                <div className="p-8">
                    {selectedCompanyId ? (
                        <CompanyLedger companyId={selectedCompanyId} />
                    ) : (
                        <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400">
                            <Wallet className="w-16 h-16 mb-4 opacity-20" />
                            <h2 className="text-xl font-semibold text-slate-600">No Account Selected</h2>
                            <p className="text-sm mt-2">Select a customer from the sidebar to view their financial ledger.</p>
                        </div>
                    )}
                </div>
            </div>
            
        </div>
    )
}