"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, Filter, Search, X } from "lucide-react"
import { useState } from "react"

export default function InvoiceFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get("status") || "all"
  const currentDays = searchParams.get("days") || "all"
  const currentSearch = searchParams.get("search") || ""

  const [showAdvanced, setShowAdvanced] = useState(!!currentSearch)
  const [searchInput, setSearchInput] = useState(currentSearch)

  // Helper to safely update URL params
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter("search", searchInput)
  }

  const clearSearch = () => {
    setSearchInput("")
    updateFilter("search", "")
    setShowAdvanced(false)
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          {/* STATUS TABS */}
          <div className="flex bg-slate-200/50 rounded-lg p-1">
            {["all", "paid", "pending", "overdue"].map((status) => (
              <button
                key={status}
                onClick={() => updateFilter("status", status)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                  currentStatus === status 
                    ? "bg-white shadow-sm text-slate-900 font-bold" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {status === "all" ? "All Invoices" : status}
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-slate-300"></div>

          {/* DATE CALENDAR DROPDOWN */}
          <select 
            value={currentDays}
            onChange={(e) => updateFilter("days", e.target.value)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-slate-400 outline-none cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </select>
        </div>

        {/* ADVANCED FILTERS TOGGLE */}
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 text-xs font-bold transition-colors ${showAdvanced ? "text-blue-600" : "text-slate-500 hover:text-slate-900"}`}
        >
          <Filter className="w-4 h-4" /> 
          {showAdvanced ? "Hide Advanced" : "Advanced Filters"}
        </button>
      </div>

      {/* ADVANCED SEARCH EXPANSION */}
      {showAdvanced && (
        <form onSubmit={handleSearch} className="flex items-center gap-3 p-4 bg-slate-100 border border-slate-200/60 rounded-xl animate-in fade-in slide-in-from-top-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Customer Name, Job ID, or Invoice No..." 
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800">
            Apply Search
          </button>
          {currentSearch && (
            <button type="button" onClick={clearSearch} className="px-3 py-2 text-slate-500 hover:text-slate-900 flex items-center gap-1 text-sm">
              <X className="w-4 h-4"/> Clear
            </button>
          )}
        </form>
      )}
    </div>
  )
}