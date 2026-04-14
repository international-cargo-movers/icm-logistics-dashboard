"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { pdf } from '@react-pdf/renderer'
import QuotePDF from '@/components/dashboard/quotes/QuotePDF'
import { Plus, Trash2, ArrowRight, Check, ChevronsUpDown, Download, Mail, Shield } from "lucide-react"

// Shadcn UI Imports
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function NewQuotePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingPdf, setIsSavingPdf] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const [customers, setCustomers] = useState<any[]>([])
  const [ports, setPorts] = useState<any[]>([])
  const [countries, setCountries] = useState<{ name: string, code: string }[]>([])

  const [openCustomer, setOpenCustomer] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("") 

  // Combobox States for Routing
  const [openOC, setOpenOC] = useState(false); const [searchOC, setSearchOC] = useState("")
  const [openOP, setOpenOP] = useState(false); const [searchOP, setSearchOP] = useState("")
  const [openDC, setOpenDC] = useState(false); const [searchDC, setSearchDC] = useState("")
  const [openDP, setOpenDP] = useState(false); const [searchDP, setSearchDP] = useState("")

  const [quoteData, setQuoteData] = useState({
    quoteRef: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    validityDays: 15,
    customerId: "",
    customerName: "",
    customerEmail: "",
    originCountry: "",
    originPort: "",
    destinationCountry: "",
    destinationPort: "",
    mode: "",
    cargoSummary: {
      commodity: "",
      equipment: "",
      estimatedWeight: ""
    },
    // NEW: Updated default items to include 'roe' and 'notes'
    lineItems: [
      { chargeName: "Ocean Freight", chargeType: "Freight", currency: "USD", roe: 83.5, buyPrice: 2800, sellPrice: 3250, notes: "PER CONTAINER" },
      { chargeName: "Customs Clearance", chargeType: "Origin", currency: "INR", roe: 1, buyPrice: 3500, sellPrice: 5500, notes: "PER INVOICE" }
    ]
  })

  useEffect(() => {
    async function fetchMasterData() {
      try {
        const [companyRes, portRes] = await Promise.all([fetch("/api/companies"), fetch("/api/ports")]);
        const companyJson = await companyRes.json();
        const portJson = await portRes.json();

        if (companyJson.success) setCustomers(companyJson.data.filter((c: any) => c.type.includes("Customer")));
        if (portJson.success) {
          setPorts(portJson.data);
          const uniqueCountriesMap = new Map();
          portJson.data.forEach((p: any) => {
            if (!uniqueCountriesMap.has(p.countryCode)) {
              uniqueCountriesMap.set(p.countryCode, { name: p.country, code: p.countryCode });
            }
          });
          setCountries(Array.from(uniqueCountriesMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (error) { console.error("Failed to load master data", error); }
    }
    fetchMasterData();
  }, [])

  const handleQuickAddCustomer = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!customerSearch.trim()) return;
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customerSearch.trim(),
          type: ["Customer"],
          email: quoteData.customerEmail 
        })
      });
      const json = await res.json();
      if (json.success) {
        const newCustomer = json.data;
        setCustomers([...customers, newCustomer]);
        setQuoteData({ ...quoteData, customerId: newCustomer._id, customerName: newCustomer.name, customerEmail: newCustomer.email || "" });
        setOpenCustomer(false);
        setCustomerSearch("");
        toast.success(`"${newCustomer.name}" added to Master Directory!`);
      } else {
        toast.error(json.error || "Failed to create customer");
      }
    } catch (e) {
      toast.error("Failed to add customer");
    }
  }

  const handleEmailBlur = async () => {
    if (quoteData.customerId && quoteData.customerEmail) {
      const customer = customers.find(c => c._id === quoteData.customerId);
      if (customer && customer.email !== quoteData.customerEmail) {
        try {
          const res = await fetch(`/api/companies/${quoteData.customerId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: quoteData.customerEmail })
          });
          if (res.ok) {
            toast.success("Customer email updated in Master Directory!");
            setCustomers(customers.map(c => c._id === quoteData.customerId ? { ...c, email: quoteData.customerEmail } : c));
          }
        } catch (e) {
          console.error("Failed to sync email", e);
        }
      }
    }
  }

  useEffect(() => {
    setQuoteData(prev => ({ ...prev, originPort: "" }))
    setSearchOP("")
  }, [quoteData.originCountry])

  useEffect(() => {
    setQuoteData(prev => ({ ...prev, destinationPort: "" }))
    setSearchDP("")
  }, [quoteData.destinationCountry])

  const isAir = quoteData.mode.includes("Air")
  const requiredType = isAir ? "Air" : "Sea"
  const availableOriginPorts = ports.filter(p => p.countryCode === quoteData.originCountry && p.type.includes(requiredType))
  const availableDestPorts = ports.filter(p => p.countryCode === quoteData.destinationCountry && p.type.includes(requiredType))

  // --- NEW: LIVE MATH ENGINE (WITH ROE) ---
  const totalBuy = quoteData.lineItems.reduce((acc, item) => acc + ((Number(item.buyPrice) || 0) * (Number(item.roe) || 1)), 0)
  const totalSell = quoteData.lineItems.reduce((acc, item) => acc + ((Number(item.sellPrice) || 0) * (Number(item.roe) || 1)), 0)
  const profitMargin = totalSell - totalBuy

  // NEW: Updated Add Line Item template
  const addLineItem = () => setQuoteData({ ...quoteData, lineItems: [...quoteData.lineItems, { chargeName: "", chargeType: "Freight", currency: "INR", roe: 1, buyPrice: 0, sellPrice: 0, notes: "" }] })
  const removeLineItem = (index: number) => setQuoteData({ ...quoteData, lineItems: quoteData.lineItems.filter((_, idx) => idx !== index) })
  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...quoteData.lineItems]
    newItems[index] = { ...newItems[index], [field]: value } as any
    setQuoteData({ ...quoteData, lineItems: newItems })
  }

  const preparePayload = () => {
    if (!quoteData.customerId || !quoteData.originPort || !quoteData.destinationPort || !quoteData.mode) {
      toast.error("Please select a Customer and complete Routing details before saving.");
      return null;
    }
    if (!quoteData.cargoSummary.equipment || quoteData.cargoSummary.equipment.trim() === "") {
      toast.error("Please specify the Equipment / Volume in the Cargo Summary (e.g., 1x 40' HC).");
      return null;
    }
    return {
      ...quoteData,
      totalBuy,
      totalSell,
      profitMargin,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + quoteData.validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  const handleDownloadPDF = async () => {
    const finalData = preparePayload();
    if (!finalData) return;

    setIsSavingPdf(true);
    try {
      const blob = await pdf(<QuotePDF data={finalData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quotation_${finalData.quoteRef}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const response = await fetch('/api/quotes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteData: finalData })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Database rejection.");

      toast.success("Quote Saved and PDF Downloaded!");
    } catch (error: any) {
      toast.error(`Failed to save quote: ${error.message}`);
    } finally {
      setIsSavingPdf(false);
    }
  }

  const handleSendEmail = async () => {
    const finalData = preparePayload();
    if (!finalData) return;
    if (!finalData.customerEmail) return toast.error("Please provide a valid Customer Email.");

    setIsSendingEmail(true);
    try {
      const blob = await pdf(<QuotePDF data={finalData} />).toBlob();
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
      });

      const response = await fetch('/api/quotes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteData: finalData, pdfBase64: base64String })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Email pipeline failed.");

      toast.success("Quote Saved and Emailed Successfully!");
    } catch (error: any) {
      toast.error(`Failed to send quote: ${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  }

  if (session && !["SuperAdmin", "Sales"].includes(session?.user?.role || "")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <Shield className="w-16 h-16 text-red-500 mb-4 opacity-20" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Restricted Area</h1>
        <p className="text-slate-500 max-w-md">Your current role ({session.user.role}) does not have clearance to modify sales quotes.</p>
        <button onClick={() => router.back()} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
          Go Back
        </button>
      </div>
    )
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

            {/* Top Row: Customer & Settings (Unchanged) */}
            <div className="grid grid-cols-2 gap-10">
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Client Details</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-on-surface-variant block">Select Customer</label>
                    <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={openCustomer} className="w-full justify-between bg-surface-container-low border-none h-12 px-4 hover:bg-surface-container transition-colors">
                          {quoteData.customerId ? customers.find((c) => c._id === quoteData.customerId)?.name : "Search directory..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search customers..." value={customerSearch} onValueChange={setCustomerSearch} />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-sm">
                              <p className="text-muted-foreground mb-3">No customer found.</p>
                              <Button type="button" size="sm" onClick={handleQuickAddCustomer} className="bg-primary text-on-primary">
                                + Quick Add "{customerSearch}"
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {customers.map((c) => (
                                <CommandItem key={c._id} value={c.name} onSelect={() => {
                                  setQuoteData({ ...quoteData, customerId: c._id, customerName: c.name, customerEmail: c.email || c.contactEmail || "" });
                                  setOpenCustomer(false);
                                  setCustomerSearch("");
                                }}>
                                  <Check className={cn("mr-2 h-4 w-4", quoteData.customerId === c._id ? "opacity-100 text-primary" : "opacity-0")} />
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
                    <input type="email" value={quoteData.customerEmail} onChange={(e) => setQuoteData({ ...quoteData, customerEmail: e.target.value })} onBlur={handleEmailBlur} placeholder="manager@company.com" className="w-full bg-surface-container-highest border-none rounded-lg h-12 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
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
                    <input type="number" value={quoteData.validityDays} onChange={(e) => setQuoteData({ ...quoteData, validityDays: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-low border-none rounded-lg h-12 px-4 focus:ring-2 focus:ring-primary/20 text-sm outline-none" />
                  </div>
                </div>
              </section>
            </div>

            {/* Middle Row: Routing (Unchanged) */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Routing Data</h2>
                <div className="w-48">
                  <Select value={quoteData.mode} onValueChange={(val) => setQuoteData({ ...quoteData, mode: val })}>
                    <SelectTrigger className="w-full bg-primary/10 border-none h-9 text-xs font-bold text-primary focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sea FCL Export">Sea FCL Export</SelectItem>
                      <SelectItem value="Sea FCL Import">Sea FCL Import</SelectItem>
                      <SelectItem value="Sea LCL Export">Sea LCL Export</SelectItem>
                      <SelectItem value="Sea LCL Import">Sea LCL Import</SelectItem>
                      <SelectItem value="Air Export">Air Export</SelectItem>
                      <SelectItem value="Air Import">Air Import</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start gap-6 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                <div className="flex-1 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block">POL Country</label>
                    <Popover open={openOC} onOpenChange={setOpenOC}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={openOC} className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
                          {quoteData.originCountry ? countries.find((c) => c.code === quoteData.originCountry)?.name : "Select Country..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search Country..." />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((c) => (
                                <CommandItem key={c.code} value={c.name} onSelect={() => { setQuoteData({ ...quoteData, originCountry: c.code }); setOpenOC(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", quoteData.originCountry === c.code ? "opacity-100 text-primary" : "opacity-0")} />
                                  {c.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block">Port of Loading</label>
                    <Popover open={openOP} onOpenChange={setOpenOP}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={openOP} disabled={!quoteData.originCountry} className="w-full justify-between bg-surface-container-highest border-none h-11 px-3 disabled:opacity-50">
                          {quoteData.originPort ? ports.find((p) => p.locode === quoteData.originPort)?.name : (quoteData.originCountry ? "Select Port..." : "Select Country First")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search by name or UN/LOCODE..." />
                          <CommandList>
                            <CommandEmpty>No port found.</CommandEmpty>
                            <CommandGroup>
                              {availableOriginPorts.map((p) => (
                                <CommandItem key={p._id} value={`${p.name} ${p.locode}`} onSelect={() => { setQuoteData({ ...quoteData, originPort: p.locode }); setOpenOP(false); }}>
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
                </div>
                <div className="mt-12 text-on-surface-variant"><ArrowRight className="w-6 h-6" /></div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block">POD Country</label>
                    <Popover open={openDC} onOpenChange={setOpenDC}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={openDC} className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
                          {quoteData.destinationCountry ? countries.find((c) => c.code === quoteData.destinationCountry)?.name : "Select Country..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search Country..." />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((c) => (
                                <CommandItem key={c.code} value={c.name} onSelect={() => { setQuoteData({ ...quoteData, destinationCountry: c.code }); setOpenDC(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", quoteData.destinationCountry === c.code ? "opacity-100 text-primary" : "opacity-0")} />
                                  {c.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block">Port of Discharge</label>
                    <Popover open={openDP} onOpenChange={setOpenDP}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={openDP} disabled={!quoteData.destinationCountry} className="w-full justify-between bg-surface-container-highest border-none h-11 px-3 disabled:opacity-50">
                          {quoteData.destinationPort ? ports.find((p) => p.locode === quoteData.destinationPort)?.name : (quoteData.destinationCountry ? "Select Port..." : "Select Country First")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search by name or UN/LOCODE..." />
                          <CommandList>
                            <CommandEmpty>No port found.</CommandEmpty>
                            <CommandGroup>
                              {availableDestPorts.map((p) => (
                                <CommandItem key={p._id} value={`${p.name} ${p.locode}`} onSelect={() => { setQuoteData({ ...quoteData, destinationPort: p.locode }); setOpenDP(false); }}>
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
                </div>
              </div>
            </section>

            {/* Cargo Summary (Unchanged) */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Cargo Summary</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Commodity</label>
                  <input type="text" value={quoteData.cargoSummary.commodity} onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, commodity: e.target.value } })} className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Equipment / Volume</label>
                  <input type="text" placeholder="e.g. 1x 40' HC or 15 CBM" value={quoteData.cargoSummary.equipment} onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, equipment: e.target.value } })} className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Est. Gross Weight</label>
                  <input type="text" placeholder="e.g. 12,500 kg" value={quoteData.cargoSummary.estimatedWeight} onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, estimatedWeight: e.target.value } })} className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </section>

            {/* NEW: Financial Line Items (WITH CURRENCY & ROE & REMARKS) */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Financial Builder (Multi-Currency)</h2>
                <button onClick={addLineItem} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-primary/20 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Charge
                </button>
              </div>

              <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[20%]">Charge Name</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[10%]">Curr</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[10%]">ROE</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[20%]">Remarks</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Buy Rate</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Sell Rate</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Base Margin</th>
                      <th className="py-3 px-3 text-right w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {quoteData.lineItems.map((item, index) => {
                      // Calculate Base amounts instantly using ROE
                      const baseBuy = (Number(item.buyPrice) || 0) * (Number(item.roe) || 1);
                      const baseSell = (Number(item.sellPrice) || 0) * (Number(item.roe) || 1);
                      const itemMargin = baseSell - baseBuy;

                      return (
                        <tr key={index} className="group hover:bg-surface-container-low/30 transition-colors">
                          <td className="py-2 px-3">
                            <input type="text" value={item.chargeName} onChange={(e) => updateLineItem(index, 'chargeName', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none" placeholder="e.g. Origin Handling" />
                          </td>
                          <td className="py-2 px-3">
                            <input type="text" value={item.currency} onChange={(e) => updateLineItem(index, 'currency', e.target.value.toUpperCase())} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none uppercase placeholder:text-gray-400" placeholder="USD" maxLength={3} />
                          </td>
                          <td className="py-2 px-3">
                            <input type="number" step="0.01" value={item.roe} onChange={(e) => updateLineItem(index, 'roe', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none" placeholder="1.00" />
                          </td>
                          <td className="py-2 px-3">
                            <input type="text" value={item.notes} onChange={(e) => updateLineItem(index, 'notes', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-gray-500 font-medium outline-none" placeholder="e.g. PER SET" />
                          </td>
                          <td className="py-2 px-3 text-right border-l border-outline-variant/10">
                            <input type="number" value={item.buyPrice} onChange={(e) => updateLineItem(index, 'buyPrice', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-right text-error font-medium outline-none" />
                          </td>
                          <td className="py-2 px-3 text-right border-l border-outline-variant/10">
                            <input type="number" value={item.sellPrice} onChange={(e) => updateLineItem(index, 'sellPrice', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-right font-bold text-primary outline-none" />
                          </td>
                          <td className="py-2 px-3 text-right border-l border-outline-variant/10">
                            <span className={`text-sm font-bold ${itemMargin >= 0 ? 'text-emerald-600' : 'text-error'}`}>
                              ₹{itemMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button onClick={() => removeLineItem(index)} className="p-1.5 text-on-surface-variant hover:bg-error-container hover:text-error rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Footer Metrics (UPDATED TO REFLECT BASE CURRENCY/ROE MATH) */}
          <div className="bg-surface-container-low p-8 flex items-center justify-between border-t border-outline-variant/20">
            <div className="flex gap-12">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Base Total Buy Cost</span>
                <div className="text-xl font-bold text-error tabular-nums">₹{totalBuy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Base Total Sell</span>
                <div className="text-xl font-bold text-primary tabular-nums">₹{totalSell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="space-y-1 border-l border-outline-variant/30 pl-6 pr-6">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Base Net Margin</span>
                <div className="text-2xl font-black text-emerald-600 tabular-nums">₹{profitMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleDownloadPDF} disabled={isSavingPdf || isSendingEmail} className="px-6 py-3 bg-white border border-outline-variant/30 text-on-surface-variant rounded-lg font-bold flex items-center gap-2 hover:bg-surface-container transition-colors disabled:opacity-50">
                <Download className="w-4 h-4" />
                {isSavingPdf ? "Processing..." : "Save & Download PDF"}
              </button>

              <button onClick={handleSendEmail} disabled={isSavingPdf || isSendingEmail} className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
                <Mail className="w-4 h-4" />
                {isSendingEmail ? "Sending..." : "Save & Email Client"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}