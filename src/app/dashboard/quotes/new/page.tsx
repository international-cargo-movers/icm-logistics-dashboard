"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { pdf } from '@react-pdf/renderer'
import QuotePDF from '@/components/dashboard/quotes/QuotePDF'
import { Plus, Trash2, ArrowRight, Check, ChevronsUpDown, Download, Mail, Shield, Box, Container, Anchor } from "lucide-react"

// Shadcn UI Imports
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { LineItemDescriptionInput } from "@/components/dashboard/financials/LineItemDescriptionInput"
import { AddPortModal } from "@/components/dashboard/ports/AddPortModal"

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

  // Modal State
  const [isPortModalOpen, setIsPortModalOpen] = useState(false)
  const [portModalConfig, setPortModalConfig] = useState<{
    target: "origin" | "destination";
    initialName: string;
  } | null>(null)

  const [quoteData, setQuoteData] = useState({
    quoteRef: "",
    validityDays: 15,
    customerId: "",
    customerName: "",
    customerEmail: "",
    originCountry: "",
    originPort: "",
    destinationCountry: "",
    destinationPort: "",
    mode: "Sea FCL Export",
    cargoSummary: {
      commodity: "",
      items: [
        { description: "", hsnCode: "", noOfPackages: 0, grossWeight: 0, volumetricWeight: 0 }
      ],
      containerCount: 1,
      containerType: "20' GP",
      totalCBM: 0,
      equipment: ""
    },
    lineItems: [
      { chargeName: "Ocean Freight", chargeType: "Freight", currency: "USD", roe: 83.5, buyPrice: 2800, sellPrice: 3250, notes: "", gstPercent: 18 },
      { chargeName: "Customs Clearance", chargeType: "Origin", currency: "INR", roe: 1, buyPrice: 3500, sellPrice: 5500, notes: "", gstPercent: 18 }
    ]
  })

  useEffect(() => {
    setQuoteData(prev => ({
      ...prev,
      quoteRef: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`
    }))
  }, [])

  const cargoTotals = quoteData.cargoSummary.items.reduce((acc, item) => {
    acc.pkgs += Number(item.noOfPackages || 0)
    acc.gross += Number(item.grossWeight || 0)
    acc.vol += Number(item.volumetricWeight || 0)
    return acc
  }, { pkgs: 0, gross: 0, vol: 0 })

  const chargeableWeight = Math.max(cargoTotals.gross, cargoTotals.vol);

  const getMultiplier = () => {
    if (quoteData.mode.includes("Sea FCL")) return Number(quoteData.cargoSummary.containerCount) || 1;
    if (quoteData.mode.includes("Sea LCL")) return Number(quoteData.cargoSummary.totalCBM) || 1;
    if (quoteData.mode.includes("Air")) return chargeableWeight || 1;
    return 1;
  }

  const multiplier = getMultiplier();
  const unitLabel = quoteData.mode.includes("Sea FCL") ? "Containers" : (quoteData.mode.includes("Sea LCL") ? "CBM" : "KG");

  const totalBuy = quoteData.lineItems.reduce((acc, item) => {
    const qty = (item.chargeType === "Freight" || item.chargeName.toLowerCase().includes("freight")) ? multiplier : 1;
    return acc + ((Number(item.buyPrice) || 0) * (Number(item.roe) || 1) * qty);
  }, 0)

  const totalSell = quoteData.lineItems.reduce((acc, item) => {
    const qty = (item.chargeType === "Freight" || item.chargeName.toLowerCase().includes("freight")) ? multiplier : 1;
    return acc + ((Number(item.sellPrice) || 0) * (Number(item.roe) || 1) * qty);
  }, 0)

  const totalGst = quoteData.lineItems.reduce((acc, item) => {
    const qty = (item.chargeType === "Freight" || item.chargeName.toLowerCase().includes("freight")) ? multiplier : 1;
    const baseSell = (Number(item.sellPrice) || 0) * (Number(item.roe) || 1) * qty;
    return acc + (baseSell * (Number(item.gstPercent) || 0) / 100);
  }, 0)

  const netTotal = totalSell + totalGst
  const profitMargin = totalSell - totalBuy

  const addLineItem = () => setQuoteData({ ...quoteData, lineItems: [...quoteData.lineItems, { chargeName: "", chargeType: "Origin", currency: "INR", roe: 1, buyPrice: 0, sellPrice: 0, notes: "", gstPercent: 18 }] })
  const removeLineItem = (index: number) => setQuoteData({ ...quoteData, lineItems: quoteData.lineItems.filter((_, idx) => idx !== index) })
  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...quoteData.lineItems]
    newItems[index] = { ...newItems[index], [field]: value } as any
    setQuoteData({ ...quoteData, lineItems: newItems })
  }

  const addCargoItem = () => {
    setQuoteData({
      ...quoteData,
      cargoSummary: {
        ...quoteData.cargoSummary,
        items: [...quoteData.cargoSummary.items, { description: "", hsnCode: "", noOfPackages: 0, grossWeight: 0, volumetricWeight: 0 }]
      }
    })
  }

  const removeCargoItem = (index: number) => {
    const newItems = quoteData.cargoSummary.items.filter((_, idx) => idx !== index)
    setQuoteData({
      ...quoteData,
      cargoSummary: { ...quoteData.cargoSummary, items: newItems.length > 0 ? newItems : [{ description: "", hsnCode: "", noOfPackages: 0, grossWeight: 0, volumetricWeight: 0 }] }
    })
  }

  const updateCargoItem = (index: number, field: string, value: any) => {
    const newItems = [...quoteData.cargoSummary.items]
    newItems[index] = { ...newItems[index], [field]: value } as any
    setQuoteData({
      ...quoteData,
      cargoSummary: { ...quoteData.cargoSummary, items: newItems }
    })
  }

  useEffect(() => {
    async function fetchMasterData() {
      try {
        const [companyRes, portRes] = await Promise.all([fetch("/api/companies"), fetch("/api/ports")]);
        const companyJson = await companyRes.json();
        const portJson = await portRes.json();

        if (companyJson.success) setCustomers(companyJson.data.filter((c: any) => c.type.includes("Customer") || c.type.includes("Shipper") || c.type.includes("Consignee")));
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

  const handlePortSuccess = (newPort: any) => {
    setPorts(prev => [...prev, newPort])
    setCountries(prev => {
      if (!prev.find(c => c.code === newPort.countryCode)) {
        return [...prev, { name: newPort.country, code: newPort.countryCode }].sort((a, b) => a.name.localeCompare(b.name));
      }
      return prev;
    })

    if (portModalConfig?.target === "origin") {
      setQuoteData(prev => ({ 
        ...prev, 
        originCountry: newPort.countryCode,
        originPort: newPort.locode || newPort.name 
      }))
    } else {
      setQuoteData(prev => ({ 
        ...prev, 
        destinationCountry: newPort.countryCode,
        destinationPort: newPort.locode || newPort.name 
      }))
    }
    setSearchOC("")
    setSearchOP("")
    setSearchDC("")
    setSearchDP("")
  }

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
          contactEmail: quoteData.customerEmail
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
      if (customer && customer.contactEmail !== quoteData.customerEmail) {
        try {
          const res = await fetch(`/api/companies/${quoteData.customerId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactEmail: quoteData.customerEmail })
          });
          if (res.ok) {
            toast.success("Customer email updated in Master Directory!");
            setCustomers(customers.map(c => c._id === quoteData.customerId ? { ...c, contactEmail: quoteData.customerEmail } : c));
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

  const preparePayload = () => {
    if (!quoteData.customerId || !quoteData.originPort || !quoteData.destinationPort || !quoteData.mode) {
      toast.error("Please select a Customer and complete Routing details before saving.");
      return null;
    }

    let equipmentStr = "";
    if (quoteData.mode.includes("Sea FCL")) equipmentStr = `${quoteData.cargoSummary.containerCount}x ${quoteData.cargoSummary.containerType}`;
    else if (quoteData.mode.includes("Sea LCL")) equipmentStr = `${quoteData.cargoSummary.totalCBM} CBM`;
    else equipmentStr = `${chargeableWeight} KG (Air)`;

    const finalLineItems = quoteData.lineItems.map(item => {
      const qty = (item.chargeType === "Freight" || item.chargeName.toLowerCase().includes("freight")) ? multiplier : 1;
      return { ...item, quantity: qty, notes: (item.chargeType === "Freight") ? `per ${unitLabel.slice(0, -1)}` : item.notes };
    });

    return {
      ...quoteData,
      cargoSummary: {
        ...quoteData.cargoSummary,
        equipment: equipmentStr,
        totalNoOfPackages: cargoTotals.pkgs,
        totalGrossWeight: cargoTotals.gross,
        totalVolumetricWeight: cargoTotals.vol
      },
      lineItems: finalLineItems,
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
      if (result.data?._id) {
        setTimeout(() => { router.push(`/dashboard/quotes`); }, 1500);
      }
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
      if (result.data?._id) {
        setTimeout(() => { router.push(`/dashboard/quotes`); }, 1500);
      }
    } catch (error: any) {
      toast.error(`Failed to send quote: ${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  }

  // Subtle UI Abstraction: Silent redirect if not authorized
  React.useEffect(() => {
    if (status === "loading") return
    const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
    if (!userRoles.some(r => ["SuperAdmin", "Sales", "Operations"].includes(r))) {
      router.push("/dashboard")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-2xl"></div>
          <div className="h-4 w-32 bg-slate-200 rounded-full"></div>
        </div>
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

            {/* Top Row: Customer & Settings */}
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
                        <Button variant="outline" role="combobox" aria-expanded={openCustomer} className="w-full justify-between bg-surface-container-low border-none h-12 px-4">
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
                                  setQuoteData({ ...quoteData, customerId: c._id, customerName: c.name, customerEmail: c.contactEmail || "" });
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
                    <input type="email" value={quoteData.customerEmail} onChange={(e) => setQuoteData({ ...quoteData, customerEmail: e.target.value })} onBlur={handleEmailBlur} placeholder="manager@company.com" className="w-full bg-surface-container-highest border-none rounded-lg h-12 px-4 text-sm outline-none" />
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
                    <input type="text" readOnly value={quoteData.quoteRef} className="w-full bg-surface-container-highest border-none rounded-lg h-12 px-4 text-sm font-mono opacity-70" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-on-surface-variant block">Validity (Days)</label>
                    <input type="number" value={quoteData.validityDays} onChange={(e) => setQuoteData({ ...quoteData, validityDays: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-low border-none rounded-lg h-12 px-4 text-sm outline-none" />
                  </div>
                </div>
              </section>
            </div>

            {/* Middle Row: Routing */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Routing Data</h2>
                <div className="w-48">
                  <Select value={quoteData.mode} onValueChange={(val) => setQuoteData({ ...quoteData, mode: val })}>
                    <SelectTrigger className="w-full bg-primary/10 border-none h-9 text-xs font-bold text-primary">
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
                        <Button variant="outline" role="combobox" className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
                          {quoteData.originCountry ? countries.find((c) => c.code === quoteData.originCountry)?.name : "Select Country..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search Country..." value={searchOC} onValueChange={setSearchOC} />
                          <CommandList>
                            <CommandEmpty className="py-4 text-center">
                              <p className="text-xs text-muted-foreground mb-2">No country found.</p>
                              <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase" onClick={() => {
                                setPortModalConfig({ target: "origin", initialName: "" });
                                setIsPortModalOpen(true);
                                setOpenOC(false);
                              }}>+ Add Port in "{searchOC}"</Button>
                            </CommandEmpty>
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
                        <Button variant="outline" role="combobox" disabled={!quoteData.originCountry} className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
                          {quoteData.originPort ? ports.find((p) => p.locode === quoteData.originPort)?.name || quoteData.originPort : (quoteData.originCountry ? "Select Port..." : "Select Country First")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search by name or UN/LOCODE..." value={searchOP} onValueChange={setSearchOP} />
                          <CommandList>
                            <CommandEmpty className="py-4 text-center">
                              <p className="text-xs text-muted-foreground mb-2">No port found.</p>
                              <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase" onClick={() => {
                                setPortModalConfig({ target: "origin", initialName: searchOP });
                                setIsPortModalOpen(true);
                                setOpenOP(false);
                              }}>+ Add "{searchOP}"</Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {availableOriginPorts.map((p) => (
                                <CommandItem key={p._id} value={`${p.name} ${p.locode}`} onSelect={() => { setQuoteData({ ...quoteData, originPort: p.locode || p.name }); setOpenOP(false); setSearchOP(""); }}>
                                  <Check className={cn("mr-2 h-4 w-4", quoteData.originPort === (p.locode || p.name) ? "opacity-100 text-primary" : "opacity-0")} />
                                  {p.name} ({p.locode || "N/A"})
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
                        <Button variant="outline" role="combobox" className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
                          {quoteData.destinationCountry ? countries.find((c) => c.code === quoteData.destinationCountry)?.name : "Select Country..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search Country..." value={searchDC} onValueChange={setSearchDC} />
                          <CommandList>
                            <CommandEmpty className="py-4 text-center">
                              <p className="text-xs text-muted-foreground mb-2">No country found.</p>
                              <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase" onClick={() => {
                                setPortModalConfig({ target: "destination", initialName: "" });
                                setIsPortModalOpen(true);
                                setOpenDC(false);
                              }}>+ Add Port in "{searchDC}"</Button>
                            </CommandEmpty>
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
                        <Button variant="outline" role="combobox" disabled={!quoteData.destinationCountry} className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
                          {quoteData.destinationPort ? ports.find((p) => p.locode === quoteData.destinationPort)?.name || quoteData.destinationPort : (quoteData.destinationCountry ? "Select Port..." : "Select Country First")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search by name or UN/LOCODE..." value={searchDP} onValueChange={setSearchDP} />
                          <CommandList>
                            <CommandEmpty className="py-4 text-center">
                              <p className="text-xs text-muted-foreground mb-2">No port found.</p>
                              <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase" onClick={() => {
                                setPortModalConfig({ target: "destination", initialName: searchDP });
                                setIsPortModalOpen(true);
                                setOpenDP(false);
                              }}>+ Add "{searchDP}"</Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {availableDestPorts.map((p) => (
                                <CommandItem key={p._id} value={`${p.name} ${p.locode}`} onSelect={() => { setQuoteData({ ...quoteData, destinationPort: p.locode || p.name }); setOpenDP(false); setSearchDP(""); }}>
                                  <Check className={cn("mr-2 h-4 w-4", quoteData.destinationPort === (p.locode || p.name) ? "opacity-100 text-primary" : "opacity-0")} />
                                  {p.name} ({p.locode || "N/A"})
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

            {/* Cargo Summary */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Cargo Summary</h2>
                <button onClick={addCargoItem} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-primary/20 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Package Line
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Commodity Group</label>
                  <input type="text" value={quoteData.cargoSummary.commodity} onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, commodity: e.target.value } })} className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Furniture" />
                </div>

                {/* DYNAMIC FIELDS BASED ON MODE */}
                {quoteData.mode.includes("Sea FCL") && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-on-surface-variant block">No. of Containers</label>
                      <div className="flex items-center gap-2 bg-surface-container-highest rounded-lg px-3 h-11">
                        <Container className="w-4 h-4 text-primary" />
                        <input type="number" min="1" value={quoteData.cargoSummary.containerCount} onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, containerCount: parseInt(e.target.value) || 0 } })} className="w-full bg-transparent border-none text-sm outline-none focus:ring-0" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-on-surface-variant block">Container Size</label>
                      <Select value={quoteData.cargoSummary.containerType} onValueChange={(val) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, containerType: val } })}>
                        <SelectTrigger className="w-full bg-surface-container-highest border-none h-11 text-sm">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20' GP">20' GP (Standard)</SelectItem>
                          <SelectItem value="40' GP">40' GP (Standard)</SelectItem>
                          <SelectItem value="40' HC">40' HC (High Cube)</SelectItem>
                          <SelectItem value="20' RF">20' Reefer</SelectItem>
                          <SelectItem value="40' RF">40' Reefer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {quoteData.mode.includes("Sea LCL") && (
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold text-on-surface-variant block">Total Volume (CBM)</label>
                    <div className="flex items-center gap-2 bg-surface-container-highest rounded-lg px-3 h-11">
                      <Box className="w-4 h-4 text-primary" />
                      <input type="number" step="0.01" value={quoteData.cargoSummary.totalCBM} onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, totalCBM: parseFloat(e.target.value) || 0 } })} className="w-full bg-transparent border-none text-sm outline-none focus:ring-0" placeholder="0.00" />
                    </div>
                  </div>
                )}

                {quoteData.mode.includes("Air") && (
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold text-on-surface-variant block">Shipment Metric (Weight)</label>
                    <div className="flex items-center gap-3 bg-primary/5 rounded-lg px-4 h-11 border border-primary/10">
                      <span className="text-xs font-bold text-primary uppercase">Using Chargeable Weight:</span>
                      <span className="text-sm font-black">{chargeableWeight} KG</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Package Grid */}
              <div className="space-y-3">
                {quoteData.cargoSummary.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 group">
                    <div className="col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Description</label>
                      <input type="text" value={item.description} onChange={(e) => updateCargoItem(index, 'description', e.target.value)} className="w-full bg-surface-container-highest border-none rounded-lg h-10 px-3 text-sm outline-none" placeholder="e.g. Wooden Tables" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">HSN Code</label>
                      <input type="text" value={item.hsnCode} onChange={(e) => updateCargoItem(index, 'hsnCode', e.target.value)} className="w-full bg-surface-container-highest border-none rounded-lg h-10 px-3 text-sm outline-none" placeholder="HSN Code" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Pkgs</label>
                      <input type="number" value={item.noOfPackages} onChange={(e) => updateCargoItem(index, 'noOfPackages', parseInt(e.target.value) || 0)} className="w-full bg-surface-container-highest border-none rounded-lg h-10 px-3 text-sm outline-none" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Gross Wt (kg)</label>
                      <input type="number" value={item.grossWeight} onChange={(e) => updateCargoItem(index, 'grossWeight', parseFloat(e.target.value) || 0)} className="w-full bg-surface-container-highest border-none rounded-lg h-10 px-3 text-sm outline-none" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Vol Wt (kg)</label>
                      <input type="number" value={item.volumetricWeight} onChange={(e) => updateCargoItem(index, 'volumetricWeight', parseFloat(e.target.value) || 0)} className="w-full bg-surface-container-highest border-none rounded-lg h-10 px-3 text-sm outline-none" />
                    </div>
                    <div className="col-span-1 pb-1 text-right">
                      <button onClick={() => removeCargoItem(index)} className="p-2 text-on-surface-variant hover:bg-error-container hover:text-error rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-primary uppercase">Total Pkgs</span>
                  <div className="text-lg font-bold">{cargoTotals.pkgs}</div>
                </div>
                <div className="text-center border-x border-primary/10">
                  <span className="text-[10px] font-bold text-primary uppercase">Total Gross Weight</span>
                  <div className="text-lg font-bold">{cargoTotals.gross} kg</div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-primary uppercase">Total Vol. Weight</span>
                  <div className="text-lg font-bold">{cargoTotals.vol} kg</div>
                </div>
              </div>
            </section>


            {/* Financials */}
            {/* Financial Line Items (HIDDEN QTY, AUTO CALCULATED) */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Financial Builder (Base Currency: INR)</h2>
                <button onClick={addLineItem} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-primary/20 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Charge
                </button>
              </div>

              <div className="border border-outline-variant/20 rounded-xl bg-surface-container-low/20">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[25%]">Charge Name</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[10%] text-center">FX (Cur/ROE)</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[15%]">Remarks / Metric</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right w-[12%]">Rate (Buy)</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right w-[12%]">Rate (Sell)</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-center w-[8%]">GST%</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right w-[15%]">Total (₹)</th>
                      <th className="py-3 px-3 text-right w-[3%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {quoteData.lineItems.map((item, index) => {
                      const isFreight = item.chargeType === "Freight" || item.chargeName.toLowerCase().includes("freight");
                      const itemMultiplier = isFreight ? multiplier : 1;

                      const baseBuy = (Number(item.buyPrice) || 0) * (Number(item.roe) || 1) * itemMultiplier;
                      const baseSell = (Number(item.sellPrice) || 0) * (Number(item.roe) || 1) * itemMultiplier;
                      const itemGst = baseSell * (Number(item.gstPercent) || 0) / 100;

                      return (
                        <tr key={index} className="group hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3 px-3">
                            <LineItemDescriptionInput value={item.chargeName} onChange={(e: any) => updateLineItem(index, 'chargeName', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold outline-none truncate" placeholder="Charge Name" />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col items-center gap-1">
                              <input type="text" value={item.currency} onChange={(e) => updateLineItem(index, 'currency', e.target.value.toUpperCase())} className="w-full bg-transparent border-none p-0 focus:ring-0 text-[10px] font-black text-center outline-none uppercase text-primary" placeholder="USD" maxLength={3} />
                              <div className="flex items-center gap-1 text-[9px] font-bold text-on-surface-variant">
                                <span>@</span>
                                <input type="number" step="0.01" value={item.roe} onChange={(e) => updateLineItem(index, 'roe', e.target.value)} className="w-10 bg-transparent border-none p-0 focus:ring-0 text-[9px] font-bold outline-none" placeholder="1.0" />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              {isFreight ? (
                                <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded w-fit truncate">x {multiplier} {unitLabel}</span>
                              ) : (
                                <input type="text" value={item.notes} onChange={(e) => updateLineItem(index, 'notes', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-[10px] text-gray-400 font-bold outline-none italic truncate" placeholder="REMARKS" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right border-l border-outline-variant/10">
                            <input type="number" value={item.buyPrice} onChange={(e) => updateLineItem(index, 'buyPrice', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-right text-error font-bold outline-none" />
                          </td>
                          <td className="py-3 px-3 text-right border-l border-outline-variant/10">
                            <input type="number" value={item.sellPrice} onChange={(e) => updateLineItem(index, 'sellPrice', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-right font-black text-primary outline-none" />
                          </td>
                          <td className="py-3 px-3 text-center border-l border-outline-variant/10">
                            <select value={item.gstPercent} onChange={(e) => updateLineItem(index, 'gstPercent', parseInt(e.target.value))} className="bg-surface-container-highest/50 border-none rounded text-[10px] font-black focus:ring-0 px-1 py-0.5 outline-none cursor-pointer appearance-none text-center w-full">
                              <option value="18">18%</option>
                              <option value="12">12%</option>
                              <option value="5">5%</option>
                              <option value="0">0%</option>
                            </select>
                          </td>
                          <td className="py-3 px-3 text-right border-l border-outline-variant/10">
                            <span className="text-sm font-black text-on-surface tabular-nums">
                              ₹{(baseSell + itemGst).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button onClick={() => removeLineItem(index)} className="p-1 text-on-surface-variant hover:text-error transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="bg-surface-container-low p-8 flex items-center justify-between border-t border-outline-variant/20">
            <div className="flex gap-12">
              <div className="space-y-1"><span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Subtotal (Sell)</span><div className="text-lg font-bold text-on-surface tabular-nums">₹{totalSell.toLocaleString('en-IN')}</div></div>
              <div className="space-y-1 border-l border-outline-variant/30 pl-6"><span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Total GST</span><div className="text-lg font-bold text-blue-600 tabular-nums">+ ₹{totalGst.toLocaleString('en-IN')}</div></div>
              <div className="space-y-1 border-l border-outline-variant/30 pl-6"><span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Net Quote</span><div className="text-xl font-black text-primary tabular-nums">₹{netTotal.toLocaleString('en-IN')}</div></div>
              <div className="space-y-1 border-l border-outline-variant/30 pl-6"><span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Base Margin</span><div className="text-xl font-black text-emerald-600 tabular-nums">₹{profitMargin.toLocaleString('en-IN')}</div></div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleDownloadPDF} disabled={isSavingPdf || isSendingEmail} className="px-6 py-3 bg-white border border-outline-variant/30 text-on-surface-variant rounded-lg font-bold flex items-center gap-2 hover:bg-surface-container transition-colors disabled:opacity-50">
                <Download className="w-4 h-4" /> Save & PDF
              </button>
              <button onClick={handleSendEmail} disabled={isSavingPdf || isSendingEmail} className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
                <Mail className="w-4 h-4" /> Save & Email
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddPortModal
        isOpen={isPortModalOpen}
        onClose={() => setIsPortModalOpen(false)}
        onSuccess={handlePortSuccess}
        initialName={portModalConfig?.initialName}
        defaultCountry={countries.find(c => c.code === (portModalConfig?.target === "origin" ? quoteData.originCountry : quoteData.destinationCountry))}
        defaultType={isAir ? "Air" : "Sea"}
      />
    </div>
  )
}
