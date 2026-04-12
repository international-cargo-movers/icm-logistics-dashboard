"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { pdf } from '@react-pdf/renderer'
import QuotePDF from '@/components/dashboard/quotes/QuotePDF'
import { Plus, Trash2, ArrowRight, Check, ChevronsUpDown } from "lucide-react"

// Shadcn UI Imports
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NewQuotePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Master Data States
  const [customers, setCustomers] = useState<any[]>([])
  const [ports, setPorts] = useState<any[]>([])

  // Combobox Open States
  const [openCustomer, setOpenCustomer] = useState(false)
  const [openOrigin, setOpenOrigin] = useState(false)
  const [openDest, setOpenDest] = useState(false)

  // 1. Quote State
  const [quoteData, setQuoteData] = useState({
    quoteRef: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    validityDays: 15,
    customerId: "",
    customerName: "",
    customerEmail: "",
    originPort: "",
    destinationPort: "",
    mode: "",
    // NEW: Cargo State
    cargoSummary: {
      commodity: "",
      equipment: "",
      estimatedWeight: ""
    },
    lineItems: [
      { chargeName: "Ocean Freight - 40' HC", chargeType: "Freight", buyPrice: 2800, sellPrice: 3250, currency: "USD" },
      { chargeName: "Terminal Handling", chargeType: "Origin", buyPrice: 120, sellPrice: 150, currency: "USD" }
    ]
  })

  // 2. Fetch Master Data
  useEffect(() => {
    async function fetchMasterData() {
      try {
        const [companyRes, portRes] = await Promise.all([
          fetch("/api/companies"),
          fetch("/api/ports")
        ]);
        const companyJson = await companyRes.json();
        const portJson = await portRes.json();

        if (companyJson.success) {
          setCustomers(companyJson.data.filter((c: any) => c.type.includes("Customer")));
        }
        if (portJson.success) setPorts(portJson.data);
      } catch (error) {
        console.error("Failed to load master data", error);
      }
    }
    fetchMasterData();
  }, [])

  // 3. Financial Calculations
  const totalBuy = quoteData.lineItems.reduce((acc, item) => acc + (Number(item.buyPrice) || 0), 0)
  const totalSell = quoteData.lineItems.reduce((acc, item) => acc + (Number(item.sellPrice) || 0), 0)
  const profitMargin = totalSell - totalBuy

  // 4. Dynamic Form Handlers
  const addLineItem = () => {
    setQuoteData({
      ...quoteData,
      lineItems: [...quoteData.lineItems, { chargeName: "", chargeType: "Freight", buyPrice: 0, sellPrice: 0, currency: "USD" }]
    })
  }

  const removeLineItem = (indexToRemove: number) => {
    setQuoteData({
      ...quoteData,
      lineItems: quoteData.lineItems.filter((_, idx) => idx !== indexToRemove)
    })
  }

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...quoteData.lineItems]
    newItems[index] = { ...newItems[index], [field]: value } as any
    setQuoteData({ ...quoteData, lineItems: newItems })
  }

  // 5. Backend Submission Pipeline
  const handleSaveAndSend = async () => {
    if (!quoteData.customerId || !quoteData.originPort || !quoteData.destinationPort) {
      return alert("Please select a Customer and Routing details before saving.");
    }

    setIsSubmitting(true)
    try {
      const finalData = {
        ...quoteData,
        totalBuy,
        totalSell,
        profitMargin,
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + quoteData.validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }

      // Generate PDF & Base64
      const blob = await pdf(<QuotePDF data={finalData} />).toBlob()
      const reader = new FileReader()
      reader.readAsDataURL(blob)

      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1]

        const response = await fetch('/api/quotes/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteData: finalData,
            pdfBase64: base64String
          })
        })

        if (!response.ok) throw new Error("API Route failed.")

        alert("Quote Successfully Saved & Sent to Customer!")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Failed to send quote:", error)
      alert("Something went wrong.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-16 py-12 bg-surface text-on-surface font-sans min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Generate Quote</h1>
          <p className="text-on-surface-variant text-lg">Build financials, select routing, and lock in margins.</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/20">
          <div className="p-8 space-y-10">

            {/* Top Row: Customer & Settings */}
            <div className="grid grid-cols-2 gap-10">
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Client Details</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-on-surface-variant block">Select Customer</label>

                    {/* SHADCN CUSTOMER COMBOBOX */}
                    <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCustomer}
                          className="w-full justify-between bg-surface-container-low border-none h-12 px-4 hover:bg-surface-container transition-colors"
                        >
                          {quoteData.customerId
                            ? customers.find((c) => c._id === quoteData.customerId)?.name
                            : "Search directory..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search customers..." />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((c) => (
                                <CommandItem
                                  key={c._id}
                                  value={c.name}
                                  onSelect={() => {
                                    setQuoteData({
                                      ...quoteData,
                                      customerId: c._id,
                                      customerName: c.name,
                                      customerEmail: c.contactEmail || ""
                                    });
                                    setOpenCustomer(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      quoteData.customerId === c._id ? "opacity-100 text-primary" : "opacity-0"
                                    )}
                                  />
                                  {c.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-on-surface-variant block">Customer Email (Editable)</label>
                    <input
                      type="email"
                      value={quoteData.customerEmail}
                      onChange={(e) => setQuoteData({ ...quoteData, customerEmail: e.target.value })}
                      placeholder="manager@company.com"
                      className="w-full bg-surface-container-highest border-none rounded-lg h-12 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Quote Parameters</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-on-surface-variant block">Quote Reference</label>
                    <input type="text" readOnly value={quoteData.quoteRef} className="w-full bg-surface-container-highest border-none rounded-lg h-12 px-4 text-sm font-mono cursor-not-allowed outline-none opacity-70" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-on-surface-variant block">Validity (Days)</label>
                    <input
                      type="number" value={quoteData.validityDays} onChange={(e) => setQuoteData({ ...quoteData, validityDays: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface-container-low border-none rounded-lg h-12 px-4 focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Middle Row: Routing */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Routing Data</h2>
              </div>
              <div className="flex items-center gap-4 bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">

                {/* SHADCN ORIGIN PORT COMBOBOX */}
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Origin Port (POL)</label>
                  <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openOrigin} className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
                        {quoteData.originPort ? ports.find((p) => p.locode === quoteData.originPort)?.name : "Search port..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search by name or UN/LOCODE..." />
                        <CommandList>
                          <CommandEmpty>No port found.</CommandEmpty>
                          <CommandGroup>
                            {ports.map((p) => (
                              <CommandItem key={p._id} value={`${p.name} ${p.locode}`} onSelect={() => {
                                setQuoteData({ ...quoteData, originPort: p.locode });
                                setOpenOrigin(false);
                              }}>
                                <Check className={cn("mr-2 h-4 w-4", quoteData.originPort === p.locode ? "opacity-100 text-primary" : "opacity-0")} />
                                {p.name} ({p.locode})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="mt-6 text-on-surface-variant"><ArrowRight className="w-5 h-5" /></div>

                {/* SHADCN DESTINATION PORT COMBOBOX */}
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Destination Port (POD)</label>
                  <Popover open={openDest} onOpenChange={setOpenDest}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openDest} className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
                        {quoteData.destinationPort ? ports.find((p) => p.locode === quoteData.destinationPort)?.name : "Search port..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search by name or UN/LOCODE..." />
                        <CommandList>
                          <CommandEmpty>No port found.</CommandEmpty>
                          <CommandGroup>
                            {ports.map((p) => (
                              <CommandItem key={p._id} value={`${p.name} ${p.locode}`} onSelect={() => {
                                setQuoteData({ ...quoteData, destinationPort: p.locode });
                                setOpenDest(false);
                              }}>
                                <Check className={cn("mr-2 h-4 w-4", quoteData.destinationPort === p.locode ? "opacity-100 text-primary" : "opacity-0")} />
                                {p.name} ({p.locode})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="w-[1px] h-12 bg-outline-variant/20 mx-2 mt-6"></div>

                {/* SHADCN TRANSPORT MODE SELECT */}
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Transport Mode</label>
                  <Select value={quoteData.mode} onValueChange={(val) => setQuoteData({ ...quoteData, mode: val })}>
                    <SelectTrigger className="w-full bg-surface-container-highest border-none h-11 font-bold text-primary focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sea FCL Export">Sea FCL Export</SelectItem>
                      <SelectItem value="Sea FCL Import">Sea FCL Import</SelectItem>
                      <SelectItem value="Air Export">Air Export</SelectItem>
                      <SelectItem value="Air Import">Air Import</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>
            </section>
            {/* Cargo Summary */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Cargo Summary</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Commodity</label>
                  <input
                    type="text" value={quoteData.cargoSummary.commodity}
                    onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, commodity: e.target.value } })}
                    className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Equipment / Volume</label>
                  <input
                    type="text" placeholder="e.g. 1x 40' HC or 15 CBM" value={quoteData.cargoSummary.equipment}
                    onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, equipment: e.target.value } })}
                    className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Est. Gross Weight</label>
                  <input
                    type="text" placeholder="e.g. 12,500 kg" value={quoteData.cargoSummary.estimatedWeight}
                    onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, estimatedWeight: e.target.value } })}
                    className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </section>
            {/* Bottom Row: Financial Line Items */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Financial Builder</h2>
                <button onClick={addLineItem} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-primary/20 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Charge
                </button>
              </div>

              <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[40%]">Charge Name</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Buy Rate</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Sell Rate</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Margin</th>
                      <th className="py-3 px-4 text-right w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {quoteData.lineItems.map((item, index) => {
                      const itemMargin = (Number(item.sellPrice) || 0) - (Number(item.buyPrice) || 0);
                      return (
                        <tr key={index} className="group hover:bg-surface-container-low/30 transition-colors">
                          <td className="py-3 px-4">
                            <input
                              type="text" value={item.chargeName} onChange={(e) => updateLineItem(index, 'chargeName', e.target.value)}
                              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none" placeholder="e.g. Origin Handling"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number" value={item.buyPrice} onChange={(e) => updateLineItem(index, 'buyPrice', e.target.value)}
                              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-right text-error font-medium outline-none"
                            />
                          </td>
                          <td className="py-3 px-4 text-right border-l border-outline-variant/10">
                            <input
                              type="number" value={item.sellPrice} onChange={(e) => updateLineItem(index, 'sellPrice', e.target.value)}
                              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-right font-bold text-primary outline-none"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-sm font-bold ${itemMargin >= 0 ? 'text-emerald-600' : 'text-error'}`}>
                              ${itemMargin.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => removeLineItem(index)} className="p-1.5 text-on-surface-variant hover:bg-error-container hover:text-error rounded-md transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Footer Metrics & Actions */}
          <div className="bg-surface-container-low p-8 flex items-center justify-between border-t border-outline-variant/20">
            <div className="flex gap-12">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total Buy Cost</span>
                <div className="text-xl font-bold text-error tabular-nums">${totalBuy.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total Sell To Client</span>
                <div className="text-xl font-bold text-primary tabular-nums">${totalSell.toLocaleString()}</div>
              </div>
              <div className="space-y-1 border-l border-outline-variant/30 pl-12">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Net Profit Margin</span>
                <div className="text-2xl font-black text-emerald-600 tabular-nums">${profitMargin.toLocaleString()}</div>
              </div>
            </div>

            <button
              onClick={handleSaveAndSend}
              disabled={isSubmitting}
              className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Save Quote & Generate PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}