"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
    Building2, 
    TrendingUp, 
    DollarSign, 
    Briefcase,
    Search,
    ChevronRight,
    ArrowUpRight,
    Scale
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface CompanyMetric {
    name: string;
    revenue: number;
    margin: number;
    jobs: number;
    outstanding: number;
}

interface CompanyPerformanceProps {
    allCompanies: CompanyMetric[];
}

export default function CompanyPerformance({ allCompanies }: CompanyPerformanceProps) {
    const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCompanies = allCompanies.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedCompany = allCompanies.find(c => c.name === selectedCompanyName) || null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-blue-600" /> Company Analytics
                </h3>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Filter companies..." 
                        className="pl-10 bg-white border-slate-200 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Company List */}
                <Card className="lg:col-span-1 border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden rounded-3xl">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Select Entity</p>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {filteredCompanies.map((company) => (
                            <button
                                key={company.name}
                                onClick={() => setSelectedCompanyName(company.name)}
                                className={`w-full text-left p-6 hover:bg-slate-50 transition-all flex items-center justify-between group ${
                                    selectedCompanyName === company.name ? 'bg-blue-50/50 border-r-4 border-r-blue-600' : ''
                                }`}
                            >
                                <div>
                                    <p className={`font-bold transition-colors ${
                                        selectedCompanyName === company.name ? 'text-blue-700' : 'text-slate-700'
                                    }`}>
                                        {company.name}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">{company.jobs} Jobs Total</p>
                                </div>
                                <ChevronRight className={`h-4 w-4 transition-all ${
                                    selectedCompanyName === company.name ? 'text-blue-600 translate-x-1' : 'text-slate-300'
                                }`} />
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Company Detailed Metrics */}
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-blue-500/5 bg-white rounded-3xl p-8">
                    {selectedCompany ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3 mb-2">
                                        Active Account
                                    </Badge>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedCompany.name}</h2>
                                    <p className="text-slate-500 mt-2 font-medium">Business Performance Overview</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Total Volume</p>
                                    <p className="text-3xl font-black text-blue-600">{selectedCompany.jobs} <span className="text-sm font-bold text-slate-400">Jobs</span></p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Revenue</p>
                                    </div>
                                    <p className="text-3xl font-black text-slate-900">{formatCurrency(selectedCompany.revenue)}</p>
                                    <div className="flex items-center gap-2 mt-2 text-emerald-600 text-xs font-bold">
                                        <ArrowUpRight className="h-3 w-3" />
                                        <span>Gross Lifetime Value</span>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <DollarSign className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Net Profit Margin</p>
                                    </div>
                                    <p className="text-3xl font-black text-slate-900">{formatCurrency(selectedCompany.margin)}</p>
                                    <div className="flex items-center gap-2 mt-2 text-blue-600 text-xs font-bold">
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold border-none text-[10px]">
                                            {selectedCompany.revenue > 0 ? ((selectedCompany.margin / selectedCompany.revenue) * 100).toFixed(1) : 0}% Margin
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-amber-200 hover:bg-amber-50/30 transition-all md:col-span-2">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                            <Scale className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Outstanding Receivables</p>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <p className="text-3xl font-black text-slate-900">{formatCurrency(selectedCompany.outstanding)}</p>
                                        <Badge className={`px-4 py-1.5 rounded-full font-bold text-xs ${
                                            selectedCompany.outstanding > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {selectedCompany.outstanding > 0 ? 'Payment Pending' : 'Clear Balance'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-slate-400">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter">
                                    <Briefcase className="h-4 w-4" />
                                    <span>Client performance is calculated in real-time</span>
                                </div>
                                <button className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1">
                                    View Statement <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12">
                            <div className="p-6 bg-slate-50 rounded-full mb-6">
                                <Building2 className="h-12 w-12 text-slate-300" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 mb-2">Select a company to view performance</h4>
                            <p className="text-slate-400 max-w-sm">
                                Choose a business entity from the list to see their detailed financial metrics, margins, and outstanding balances.
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
