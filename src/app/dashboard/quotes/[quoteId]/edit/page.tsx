"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { pdf } from '@react-pdf/renderer'
import QuotePDF from '@/components/dashboard/quotes/QuotePDF'
import { Plus, Trash2, ArrowRight, Check, ChevronsUpDown, Save, Mail, Download } from "lucide-react"

// Shadcn UI Imports
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function EditQuotePage() {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.quoteId as string

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
      equipment: "",
      estimatedWeight: ""
    },
    lineItems: [] as any[]
  })

  // 1. Fetch Master Data AND Existing Quote Data
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
            loadedCustomers = companyJson.data.filter((c: any) => c.type.includes("Customer"));
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

        // Map DB data back to the UI State
        if (quoteJson.success) {
          const q = quoteJson.data;
          
          const issue = new Date(q.validity.issueDate).getTime();
          const expiry = new Date(q.validity.expiryDate).getTime();
          const diffDays = Math.ceil((expiry - issue) / (1000 * 60 * 60 * 24));

          // Cross-reference with Master Directory to get the most up-to-date email
          const linkedCustomer = loadedCustomers.find(c => c._id === q.customerDetails.companyId);
          const activeEmail = linkedCustomer?.email || linkedCustomer?.contactEmail || q.customerDetails.email || "";

          setQuoteData({
            quoteRef: q.quoteId,
            validityDays: diffDays || 15,
            customerId: q.customerDetails.companyId,
            customerName: q.customerDetails.contactPerson || linkedCustomer?.name || "",
            customerEmail: activeEmail, 
            originCountry: q.routingDetails.originCountry || (q.routingDetails.originPort ? q.routingDetails.originPort.substring(0, 2) : ""),
            originPort: q.routingDetails.originPort,
            destinationCountry: q.routingDetails.destinationCountry || (q.routingDetails.destinationPort ? q.routingDetails.destinationPort.substring(0, 2) : ""),
            destinationPort: q.routingDetails.destinationPort,
            mode: q.routingDetails.mode,
            cargoSummary: {
              commodity: q.cargoSummary?.commodity || "",
              equipment: q.cargoSummary?.equipment || "",
              estimatedWeight: q.cargoSummary?.estimatedWeight || ""
            },
            lineItems: q.financials.lineItems || []
          });
        } else {
            toast.error("Quote not found!");
            router.push('/dashboard/quotes');
        }
      } catch (error) { 
        console.error("Failed to load data", error); 
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [quoteId, router])

  // --- AUTO-SYNC EMAIL ON BLUR ---
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

  // Cascading Logic: Clear port if country changes
  useEffect(() => {
    if (!isLoading) {
      setQuoteData(prev => ({ ...prev, originPort: "" }))
      setSearchOP("")
    }
  }, [quoteData.originCountry, isLoading])

  useEffect(() => {
    if (!isLoading) {
      setQuoteData(prev => ({ ...prev, destinationPort: "" }))
      setSearchDP("")
    }
  }, [quoteData.destinationCountry, isLoading])

  const isAir = quoteData.mode.includes("Air")
  const requiredType = isAir ? "Air" : "Sea"
  const availableOriginPorts = ports.filter(p => p.countryCode === quoteData.originCountry && p.type.includes(requiredType))
  const availableDestPorts = ports.filter(p => p.countryCode === quoteData.destinationCountry && p.type.includes(requiredType))

  const totalBuy = quoteData.lineItems.reduce((acc, item) => acc + (Number(item.buyPrice) || 0), 0)
  const totalSell = quoteData.lineItems.reduce((acc, item) => acc + (Number(item.sellPrice) || 0), 0)
  const profitMargin = totalSell - totalBuy

  const addLineItem = () => setQuoteData({ ...quoteData, lineItems: [...quoteData.lineItems, { chargeName: "", chargeType: "Freight", buyPrice: 0, sellPrice: 0, currency: "USD" }] })
  const removeLineItem = (index: number) => setQuoteData({ ...quoteData, lineItems: quoteData.lineItems.filter((_, idx) => idx !== index) })
  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...quoteData.lineItems]
    newItems[index] = { ...newItems[index], [field]: value } as any
    setQuoteData({ ...quoteData, lineItems: newItems })
  }

  const preparePayload = () => {
    if (!quoteData.customerId || !quoteData.originPort || !quoteData.destinationPort) {
      toast.error("Missing Fields", { description: "Please select a Customer and Routing details before saving." });
      return null;
    }
    if (!quoteData.cargoSummary.equipment || quoteData.cargoSummary.equipment.trim() === "") {
      toast.error("Missing Cargo Specs", { description: "Please specify the Equipment / Volume in the Cargo Summary." });
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteData: finalData }) 
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Update failed.");
      
      toast.success("Quote Revised Successfully!");
      router.push('/dashboard/quotes');
      
    } catch (error: any) {
      toast.error("Update Failed", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  const handleSendEmail = async () => {
    const finalData = preparePayload();
    if (!finalData) return;
    if (!quoteData.customerEmail) return toast.error("Please provide a valid Customer Email.");

    setIsSendingEmail(true);
    try {
      // 1. Generate the PDF payload
      const blob = await pdf(<QuotePDF data={finalData} />).toBlob();
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
      });

      // 2. Save the revision first
      const updateResponse = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteData: finalData }) 
      });
      if (!updateResponse.ok) throw new Error("Failed to save revision before emailing.");

      // 3. Dispatch the email via your API
      const emailResponse = await fetch('/api/quotes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Passing isRevision flag in case your backend needs to know it's not a brand new creation
        body: JSON.stringify({ quoteData: finalData, pdfBase64: base64String, isRevision: true }) 
      });

      const result = await emailResponse.json();
      if (!emailResponse.ok) throw new Error(result.error || "Email pipeline failed.");

      toast.success("Quote Revised and Emailed Successfully!");
      router.push('/dashboard/quotes');
    } catch (error: any) {
      toast.error(`Failed to send email: ${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  }

  if (isLoading) return <div className="p-12 text-center font-bold">Loading Quote Data...</div>

  return (
    <div className="flex-1 overflow-y-auto px-16 py-12 bg-surface text-on-surface font-sans min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Edit Quote: {quoteId}</h1>
          <p className="text-on-surface-variant text-lg">Revise pricing and routing for this active negotiation.</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/20">
          <div className="p-8 space-y-10">
            
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
                          <CommandInput placeholder="Search customers..." />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((c) => (
                                <CommandItem key={c._id} value={c.name} onSelect={() => {
                                    setQuoteData({ ...quoteData, customerId: c._id, customerName: c.name, customerEmail: c.email || c.contactEmail || "" });
                                    setOpenCustomer(false);
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
                  
                  {/* EMAL SYNC BOX */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-on-surface-variant block">Customer Email (Editable)</label>
                    <input 
                      type="email" 
                      value={quoteData.customerEmail} 
                      onChange={(e) => setQuoteData({ ...quoteData, customerEmail: e.target.value })} 
                      onBlur={handleEmailBlur}
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
                    <input type="number" value={quoteData.validityDays} onChange={(e) => setQuoteData({...quoteData, validityDays: parseInt(e.target.value) || 0})} className="w-full bg-surface-container-low border-none rounded-lg h-12 px-4 focus:ring-2 focus:ring-primary/20 text-sm outline-none" />
                  </div>
                </div>
              </section>
            </div>

            {/* Middle Row: Routing */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Routing Data</h2>
                <div className="w-48">
                  <Select value={quoteData.mode} onValueChange={(val) => setQuoteData({...quoteData, mode: val})}>
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
                
                {/* ORIGIN STACK */}
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
                
                {/* DESTINATION STACK */}
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

            {/* Cargo Summary */}
            <section className="space-y-6 pt-6 border-t border-outline-variant/10">
              <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Cargo Summary</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-surface-container-low p-5 rounded-xl border border-outline-variant/10">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Commodity</label>
                  <input type="text" value={quoteData.cargoSummary.commodity} onChange={(e) => setQuoteData({...quoteData, cargoSummary: {...quoteData.cargoSummary, commodity: e.target.value}})} className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Equipment / Volume</label>
                  <input type="text" placeholder="e.g. 1x 40' HC or 15 CBM" value={quoteData.cargoSummary.equipment} onChange={(e) => setQuoteData({...quoteData, cargoSummary: {...quoteData.cargoSummary, equipment: e.target.value}})} className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant block">Est. Gross Weight</label>
                  <input type="text" placeholder="e.g. 12,500 kg" value={quoteData.cargoSummary.estimatedWeight} onChange={(e) => setQuoteData({...quoteData, cargoSummary: {...quoteData.cargoSummary, estimatedWeight: e.target.value}})} className="w-full bg-surface-container-highest border-none rounded-lg h-11 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
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
                            <input type="text" value={item.chargeName} onChange={(e) => updateLineItem(index, 'chargeName', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none" placeholder="e.g. Origin Handling" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <input type="number" value={item.buyPrice} onChange={(e) => updateLineItem(index, 'buyPrice', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-right text-error font-medium outline-none" />
                          </td>
                          <td className="py-3 px-4 text-right border-l border-outline-variant/10">
                            <input type="number" value={item.sellPrice} onChange={(e) => updateLineItem(index, 'sellPrice', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-right font-bold text-primary outline-none" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`text-sm font-bold ${itemMargin >= 0 ? 'text-emerald-600' : 'text-error'}`}>${itemMargin.toFixed(2)}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
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
            
            <div className="flex gap-4">
              <button 
                onClick={handleUpdate}
                disabled={isSaving || isSendingEmail}
                className="px-6 py-3 bg-white border border-outline-variant/30 text-on-surface-variant rounded-lg font-bold flex items-center gap-2 hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Revision & Download"}
              </button>

              <button
                onClick={handleSendEmail}
                disabled={isSaving || isSendingEmail}
                className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {isSendingEmail ? "Sending..." : "Save Revision & Email"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}