"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { 
    Search, 
    Building2, 
    Wallet, 
    ChevronRight, 
    Activity, 
    ShieldCheck, 
    Scale,
    TrendingUp,
    Clock
} from "lucide-react"
import CompanyLedger from "@/components/dashboard/ledger/CompanyLedger"
import Sidebar from "@/components/dashboard/Sidebar"
import TopNav from "@/components/dashboard/TopNav"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LedgerPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [companies, setCompanies] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // Subtle UI Abstraction: Silent redirect if not authorized
    useEffect(() => {
        if (status === "loading") return
        const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
        if (!userRoles.some(r => ["SuperAdmin", "Finance"].includes(r))) {
            router.push("/dashboard")
        }
    }, [session, status, router])

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await fetch("/api/companies");
                const json = await res.json();
                if (json.success) {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="h-12 w-12 text-blue-600 animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Syncing Financial Ledgers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#F8FAFC] text-slate-900 antialiased font-body min-h-screen">
            <Sidebar />

            <main className="min-h-screen flex flex-col">
                <TopNav searchTerm={searchTerm} onSearchChange={setSearchTerm} />

                <div className="pt-24 h-[calc(100vh)] flex overflow-hidden">
                    
                    {/* Account Selection Sidebar */}
                    <div className="w-96 border-r border-slate-100 bg-white flex flex-col h-full">
                        <div className="p-8 border-b border-slate-50">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="h-1 w-6 bg-blue-600 rounded-full"></span>
                                <span className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase">
                                    Accounts
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-6">Receivables</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Filter by customer..." 
                                    className="pl-10 bg-slate-50 border-none rounded-xl focus-visible:ring-blue-600 font-bold"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {filteredCompanies.map((company) => (
                                <button
                                    key={company._id}
                                    onClick={() => setSelectedCompanyId(company._id)}
                                    className={`w-full text-left p-5 rounded-2xl transition-all group flex items-center justify-between ${
                                        selectedCompanyId === company._id 
                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" 
                                        : "hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <p className={`font-black truncate ${selectedCompanyId === company._id ? "text-white" : "text-slate-700"}`}>
                                            {company.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className={`border-none text-[8px] font-black uppercase px-2 py-0 ${
                                                selectedCompanyId === company._id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                                            }`}>
                                                Customer
                                            </Badge>
                                            <p className={`text-[10px] font-bold truncate ${selectedCompanyId === company._id ? "text-white/60" : "text-slate-400"}`}>
                                                {company.city || "Global"}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 transition-all ${
                                        selectedCompanyId === company._id ? "text-white translate-x-1" : "text-slate-300 opacity-0 group-hover:opacity-100"
                                    }`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ledger Viewport */}
                    <div className="flex-1 bg-[#F8FAFC] overflow-y-auto custom-scrollbar">
                        {selectedCompanyId ? (
                            <div className="p-12 space-y-12 max-w-6xl mx-auto">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                                                <Scale className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Financial Statement</p>
                                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Account Ledger</h1>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 font-medium ml-1">
                                            Live audit of all transactions and settlements for <span className="text-slate-900 font-black">{companies.find(c => c._id === selectedCompanyId)?.name}</span>.
                                        </p>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-700 border-none font-black uppercase text-[10px] px-4 py-1.5">
                                        Active Audit Active
                                    </Badge>
                                </div>

                                <CompanyLedger companyId={selectedCompanyId} />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                <div className="p-10 bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 mb-8 border border-slate-50">
                                    <Wallet className="h-16 w-16 text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-3">Initialize Financial Audit</h3>
                                <p className="text-slate-400 font-medium max-w-sm">
                                    Choose an entity from the account directory to view their complete transaction history and current balance.
                                </p>
                            </div>
                        )}
                    </div>
                    
                </div>
            </main>
        </div>
    )
}
