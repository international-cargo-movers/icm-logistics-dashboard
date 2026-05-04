"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { pdf } from '@react-pdf/renderer'
import QuotePDF from '@/components/dashboard/quotes/QuotePDF'
import { Plus, Trash2, ArrowRight, Check, ChevronsUpDown, Save, Mail, Shield, Container, Box, XCircle, Download } from "lucide-react"

// Shadcn UI Imports
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

import { LineItemDescriptionInput } from "@/components/dashboard/financials/LineItemDescriptionInput"
import { AddPortModal } from "@/components/dashboard/ports/AddPortModal"

export default function EditQuotePage() {
  const params = useParams() as { quoteId: string }
  const router = useRouter()
  const quoteId = params.quoteId

  const { data: session, status } = useSession()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  
  const [customers, setCustomers] = useState<any[]>([])
  const [ports, setPorts] = useState<any[]>([])
  const [countries, setCountries] = useState<{name: string, code: string}[]>([])

  const [openCustomer, setOpenCustomer] = useState(false)
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
    quoteRef: quoteId,
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
    lineItems: [] as any[]
  })

  // LIVE TOTALS
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

  const profitMargin = totalSell - totalBuy

  const addLineItem = () => setQuoteData({ ...quoteData, lineItems: [...quoteData.lineItems, { chargeName: "", chargeType: "Origin", currency: "INR", roe: 1, buyPrice: 0, sellPrice: 0, notes: "" }] })
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
    async function loadData() {
      try {
        const [companyRes, portRes, quoteRes] = await Promise.all([ 
          fetch("/api/companies"), 
          fetch("/api/ports"),
          fetch(`/api/quotes/${quoteId}`) 
        ]);
        
        const companyJson = await companyRes.json();
        const portJson = await portRes.json();
        const quoteJson = await quoteRes.json();

        let loadedCustomers: any[] = [];
        if (companyJson.success) {
            loadedCustomers = companyJson.data.filter((c: any) => c.type.includes("Customer")||c.type.includes("Shipper")||c.type.includes("Consignee") );
            setCustomers(loadedCustomers);
        }

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

        if (quoteJson.success) {
          const q = quoteJson.data;
          const issue = new Date(q.validity.issueDate).getTime();
          const expiry = new Date(q.validity.expiryDate).getTime();
          const diffDays = Math.ceil((expiry - issue) / (1000 * 60 * 60 * 24));
          const linkedCustomer = loadedCustomers.find(c => c._id === q.customerDetails.companyId);
          const activeEmail = linkedCustomer?.email || linkedCustomer?.contactEmail || q.customerDetails.email || "";

          let cCount = 1; let cType = "20' GP"; let cbm = 0;
          const equip = q.cargoSummary?.equipment || "";
          if (q.routingDetails.mode.includes("Sea FCL")) {
            const match = equip.match(/(\d+)\s*x\s*(.*)/i);
            if (match) { cCount = parseInt(match[1]); cType = match[2]; }
          } else if (q.routingDetails.mode.includes("Sea LCL")) {
            cbm = parseFloat(equip.split(" ")[0]) || 0;
          }

          setQuoteData({
            quoteRef: q.quoteId,
            validityDays: diffDays || 15,
            customerId: q.customerDetails.companyId,
            customerName: q.customerDetails.contactPerson || linkedCustomer?.name || "",
            customerEmail: activeEmail,
            originCountry: q.routingDetails.originCountry,
            originPort: q.routingDetails.originPort,
            destinationCountry: q.routingDetails.destinationCountry,
            destinationPort: q.routingDetails.destinationPort,
            mode: q.routingDetails.mode,
            cargoSummary: {
              commodity: q.cargoSummary?.commodity || "",
              items: q.cargoSummary?.items || [],
              equipment: q.cargoSummary?.equipment || "",
              containerCount: cCount,
              containerType: cType,
              totalCBM: cbm
            },
            lineItems: q.financials.lineItems || []
          });
        }
      } catch (error) { console.error("Load Failed", error); }
      finally { setIsLoading(false); }
    }
    loadData();
  }, [quoteId, router])

  const handlePortSuccess = (newPort: any) => {
    setPorts(prev => [...prev, newPort])
    if (portModalConfig?.target === "origin") {
      setQuoteData(prev => ({ ...prev, originPort: newPort.locode || newPort.name }))
    } else {
      setQuoteData(prev => ({ ...prev, destinationPort: newPort.locode || newPort.name }))
    }
  }

  const preparePayload = () => {
    if (!quoteData.customerId || !quoteData.originPort || !quoteData.destinationPort) {
      toast.error("Missing Fields");
      return null;
    }

    let equipmentStr = "";
    if (quoteData.mode.includes("Sea FCL")) equipmentStr = `${quoteData.cargoSummary.containerCount}x ${quoteData.cargoSummary.containerType}`;
    else if (quoteData.mode.includes("Sea LCL")) equipmentStr = `${quoteData.cargoSummary.totalCBM} CBM`;
    else equipmentStr = `${chargeableWeight} KG (Air)`;

    const finalLineItems = quoteData.lineItems.map(item => {
      const qty = (item.chargeType === "Freight" || item.chargeName.toLowerCase().includes("freight")) ? multiplier : 1;
      return { ...item, quantity: qty, notes: (item.chargeType === "Freight") ? `per ${unitLabel.slice(0,-1)}` : item.notes };
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

  const handleUpdate = async () => {
    const finalData = preparePayload();
    if (!finalData) return;
    setIsSaving(true);
    try {
      const blob = await pdf(<QuotePDF data={finalData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quotation_${finalData.quoteRef}_Revised.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteData: finalData }) 
      });
      if (response.ok) {
        toast.success("Quote Revised Successfully!");
        router.push('/dashboard/quotes');
      }
    } catch (error) { toast.error("Sync Failed"); }
    finally { setIsSaving(false); }
  }

  useEffect(() => {
    setSearchOP("")
  }, [quoteData.originCountry])

  useEffect(() => {
    setSearchDP("")
  }, [quoteData.destinationCountry])

  const isAir = quoteData.mode.includes("Air")
  const requiredType = isAir ? "Air" : "Sea"
  const availableOriginPorts = ports.filter(p => p.countryCode === quoteData.originCountry && p.type.includes(requiredType))
  const availableDestPorts = ports.filter(p => p.countryCode === quoteData.destinationCountry && p.type.includes(requiredType))

  // Subtle UI Abstraction: Silent redirect if not authorized
  React.useEffect(() => {
    if (status === "loading") return
    const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
    if (!userRoles.some(r => ["SuperAdmin", "Sales", "Operations"].includes(r))) {
      router.push("/dashboard")
    }
  }, [session, status, router])

  if (status === "loading" || isLoading) {
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
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Revise Quotation</h1>
                <p className="text-on-surface-variant text-lg">Adjust pricing, update routing, or modify cargo summary.</p>
            </div>
            <button onClick={() => router.back()} className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors rounded-lg flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Cancel Revision
            </button>
        </div>

        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/20">
          {isLoading ? (
            <div className="p-20 text-center animate-pulse font-bold text-slate-400">Synchronizing Records...</div>
          ) : (
            <div className="p-8 space-y-10">
                <div className="grid grid-cols-2 gap-10">
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-l-4 border-primary pl-4"><h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Client Details</h2></div>
                        <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-between bg-surface-container-low border-none h-12">
                                    {quoteData.customerId ? customers.find((c) => c._id === quoteData.customerId)?.name : "Search directory..."}
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
                                                <CommandItem key={c._id} onSelect={() => { setQuoteData({ ...quoteData, customerId: c._id, customerName: c.name, customerEmail: c.contactEmail || c.email || "" }); setOpenCustomer(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", quoteData.customerId === c._id ? "opacity-100 text-primary" : "opacity-0")} />
                                                    {c.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <input type="email" value={quoteData.customerEmail} onChange={(e) => setQuoteData({ ...quoteData, customerEmail: e.target.value })} className="w-full bg-surface-container-highest border-none rounded-lg h-12 px-4 text-sm outline-none" />
                    </section>
                    
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-l-4 border-primary pl-4"><h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Quote Parameters</h2></div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" readOnly value={quoteData.quoteRef} className="w-full bg-surface-container-highest border-none rounded-lg h-12 px-4 text-sm font-mono opacity-70 cursor-not-allowed outline-none" />
                            <input type="number" value={quoteData.validityDays} onChange={(e) => setQuoteData({ ...quoteData, validityDays: parseInt(e.target.value) || 0 })} className="w-full bg-surface-container-low border-none rounded-lg h-12 px-4 text-sm outline-none" />
                        </div>
                    </section>
                </div>

                <section className="space-y-6 pt-6 border-t border-outline-variant/10">
                    <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Routing Data</h2>
                        <div className="w-48">
                            <Select value={quoteData.mode} onValueChange={(val) => setQuoteData({ ...quoteData, mode: val })}>
                                <SelectTrigger className="w-full bg-primary/10 border-none h-9 text-xs font-bold text-primary focus:ring-0">
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
                              <Button variant="outline" className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
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
                              <Button variant="outline" disabled={!quoteData.originCountry} className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
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
                              <Button variant="outline" className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
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
                              <Button variant="outline" disabled={!quoteData.destinationCountry} className="w-full justify-between bg-surface-container-highest border-none h-11 px-3">
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

                <section className="space-y-6 pt-6 border-t border-outline-variant/10">
                    <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Cargo Summary</h2>
                        <button onClick={addCargoItem} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-primary/20"><Plus className="w-3.5 h-3.5" /> Add Package</button>
                    </div>
                    <div className="grid grid-cols-3 gap-6 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-on-surface-variant block">Commodity Group</label>
                            <input type="text" value={quoteData.cargoSummary.commodity} onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, commodity: e.target.value } })} className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none" />
                        </div>
                        {quoteData.mode.includes("Sea FCL") && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-on-surface-variant block">No. of Containers</label>
                                    <div className="flex items-center gap-2 bg-surface-container-highest rounded-lg px-3 h-11"><Container className="w-4 h-4 text-primary" /><input type="number" value={quoteData.cargoSummary.containerCount} onChange={(e) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, containerCount: parseInt(e.target.value) || 0 } })} className="w-full bg-transparent border-none text-sm outline-none" /></div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-on-surface-variant block">Container Size</label>
                                    <Select value={quoteData.cargoSummary.containerType} onValueChange={(val) => setQuoteData({ ...quoteData, cargoSummary: { ...quoteData.cargoSummary, containerType: val } })}>
                                        <SelectTrigger className="w-full bg-surface-container-highest border-none h-11 text-sm"><SelectValue placeholder="Size" /></SelectTrigger>
                                        <SelectContent><SelectItem value="20' GP">20' GP</SelectItem><SelectItem value="40' GP">40' GP</SelectItem><SelectItem value="40' HC">40' HC</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="space-y-3">
                        {quoteData.cargoSummary.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-end bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 group">
                                <div className="col-span-5"><input type="text" value={item.description} onChange={(e) => updateCargoItem(index, 'description', e.target.value)} className="w-full bg-surface-container-highest border-none rounded-lg h-10 px-3 text-sm outline-none" placeholder="Description" /></div>
                                <div className="col-span-2"><input type="number" value={item.noOfPackages} onChange={(e) => updateCargoItem(index, 'noOfPackages', parseInt(e.target.value) || 0)} className="w-full bg-surface-container-highest h-10 px-3 rounded outline-none text-sm" /></div>
                                <div className="col-span-2"><input type="number" value={item.grossWeight} onChange={(e) => updateCargoItem(index, 'grossWeight', parseFloat(e.target.value) || 0)} className="w-full bg-surface-container-highest h-10 px-3 rounded outline-none text-sm" /></div>
                                <div className="col-span-2"><input type="number" value={item.volumetricWeight} onChange={(e) => updateCargoItem(index, 'volumetricWeight', parseFloat(e.target.value) || 0)} className="w-full bg-surface-container-highest h-10 px-3 rounded outline-none text-sm" /></div>
                                <div className="col-span-1 text-right"><button onClick={() => removeCargoItem(index)} className="p-2 text-on-surface-variant hover:bg-error-container hover:text-error rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button></div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-outline-variant/10">
                    <div className="flex items-center justify-between border-l-4 border-primary pl-4"><h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Financial Builder (INR)</h2><button onClick={addLineItem} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-primary/20 transition-colors"><Plus className="w-3.5 h-3.5" /> Add Charge</button></div>
                    <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low">
                                    <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[30%]">Charge Name</th>
                                    <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[10%]">ROE</th>
                                    <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-[20%]">Metric</th>
                                    <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Rate (Sell)</th>
                                    <th className="py-3 px-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Total (₹)</th>
                                    <th className="py-3 px-3 text-right w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {quoteData.lineItems.map((item, index) => {
                                    const isFreight = item.chargeType === "Freight" || item.chargeName.toLowerCase().includes("freight");
                                    const itemMultiplier = isFreight ? multiplier : 1;
                                    const baseSell = (Number(item.sellPrice) || 0) * (Number(item.roe) || 1) * itemMultiplier;
                                    return (
                                        <tr key={index} className="group hover:bg-surface-container-low/30 transition-colors">
                                            <td className="py-2 px-3"><LineItemDescriptionInput value={item.chargeName} onChange={(e: any) => updateLineItem(index, 'chargeName', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none" /></td>
                                            <td className="py-2 px-3"><input type="number" step="0.01" value={item.roe} onChange={(e) => updateLineItem(index, 'roe', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm outline-none" /></td>
                                            <td className="py-2 px-3">{isFreight ? <span className="text-[10px] font-black text-primary uppercase">x {multiplier} {unitLabel}</span> : <input type="text" value={item.notes} onChange={(e) => updateLineItem(index, 'notes', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-[10px] text-gray-500 font-bold outline-none" />}</td>
                                            <td className="py-2 px-3 text-right"><input type="number" value={item.sellPrice} onChange={(e) => updateLineItem(index, 'sellPrice', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-right font-bold text-primary outline-none" /></td>
                                            <td className="py-2 px-3 text-right text-sm font-black">₹{baseSell.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right"><button onClick={() => removeLineItem(index)} className="p-1.5 text-on-surface-variant hover:bg-error-container hover:text-error rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="bg-surface-container-low p-8 flex items-center justify-between border-t border-outline-variant/20">
                    <div className="flex gap-12">
                        <div className="space-y-1"><span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Base Total Sell</span><div className="text-xl font-bold text-primary tabular-nums">₹{totalSell.toLocaleString()}</div></div>
                        <div className="space-y-1 border-l border-outline-variant/30 pl-6 pr-6"><span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Base Net Margin</span><div className="text-2xl font-black text-emerald-600 tabular-nums">₹{profitMargin.toLocaleString()}</div></div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleUpdate} disabled={isSaving} className="px-6 py-3 bg-primary text-on-primary rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-all">{isSaving ? "Syncing..." : "Update & Sync Records"}</button>
                    </div>
                </div>
            </div>
          )}
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
