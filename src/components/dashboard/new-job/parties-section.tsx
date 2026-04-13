"use client"

import * as React from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Combobox, ComboboxEmpty, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "@/components/ui/combobox"
import { FileEdit, X, Building2 } from "lucide-react"

export default function PartiesSection() {
  const { control, setValue, getValues } = useFormContext()
  
  const customerId = useWatch({ control, name: "customerDetails.companyId" })

  const [companies, setCompanies] = React.useState<any[]>([])
  
  const [openShipper, setOpenShipper] = React.useState(false)
  const [searchShipper, setSearchShipper] = React.useState("")
  
  const [openConsignee, setOpenConsignee] = React.useState(false)
  const [searchConsignee, setSearchConsignee] = React.useState("")

  // NEW: Notify Party & Overseas Agent
  const [openNotify, setOpenNotify] = React.useState(false)
  const [searchNotify, setSearchNotify] = React.useState("")
  const [openAgent, setOpenAgent] = React.useState(false)
  const [searchAgent, setSearchAgent] = React.useState("")

  // --- PEEK MODAL STATE ---
  const [activeModal, setActiveModal] = React.useState<"shipper" | "consignee" | "notify" | "agent" | null>(null)
  const [modalData, setModalData] = React.useState({
    name: "", taxId: "", streetAddress: "", city: "", state: "", zipCode: "", country: ""
  })

  React.useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/companies")
        const json = await res.json()
        if (json.success) setCompanies(json.data)
      } catch (error) {
        console.error("Failed to fetch companies:", error)
      }
    }
    fetchCompanies()
  }, [])

  const shippers = companies.filter(c => c.type?.includes("Shipper") || c.type?.includes("Customer"))
  const consignees = companies.filter(c => c.type?.includes("Consignee") || c.type?.includes("Customer"))
  const notifyParties = companies.filter(c => c.type?.includes("Notify Party") || c.type?.includes("Customer") || c.type?.includes("Consignee"))
  const agents = companies.filter(c => c.type?.includes("Overseas Agent") || c.type?.includes("Vendor"))

  const handleCopyCustomer = (field: "shipperId" | "consigneeId" | "notifyPartyId") => {
    if (customerId) {
      setValue(`partyDetails.${field}`, customerId, { shouldValidate: true })
      const cust = companies.find(c => c._id === customerId)
      if (cust) {
        if (field === "shipperId") setSearchShipper(cust.name)
        if (field === "consigneeId") setSearchConsignee(cust.name)
        if (field === "notifyPartyId") setSearchNotify(cust.name)
      }
    } else {
      alert("Please select a Customer first!")
    }
  }

  // --- MODAL HANDLERS ---
  const openPeekModal = (type: "shipper" | "consignee" | "notify" | "agent") => {
    const fieldMap: Record<string, string> = {
      shipper: "shipperId",
      consignee: "consigneeId",
      notify: "notifyPartyId",
      agent: "overseasAgentId"
    };
    const searchMap: Record<string, string> = {
      shipper: searchShipper,
      consignee: searchConsignee,
      notify: searchNotify,
      agent: searchAgent
    };

    const currentValue = getValues(`partyDetails.${fieldMap[type]}`)
    const companyName = searchMap[type]
    
    const existingCompany = companies.find(c => c._id === currentValue || c.name === currentValue)

    if (existingCompany) {
      setModalData({
        name: existingCompany.name || "",
        taxId: existingCompany.taxId || "",
        streetAddress: existingCompany.streetAddress || "",
        city: existingCompany.city || "",
        state: existingCompany.state || "",
        zipCode: existingCompany.zipCode || "",
        country: existingCompany.country || ""
      })
    } else {
      setModalData({ name: companyName || currentValue || "", taxId: "", streetAddress: "", city: "", state: "", zipCode: "", country: "" })
    }
    setActiveModal(type)
  }

  const handleModalSave = async () => {
    console.log(`Saving rich data for ${activeModal}:`, modalData)
    
    if (activeModal === "shipper") {
        setSearchShipper(modalData.name)
        setValue("partyDetails.shipperId", modalData.name) 
    } else if (activeModal === "consignee") {
        setSearchConsignee(modalData.name)
        setValue("partyDetails.consigneeId", modalData.name)
    } else if (activeModal === "notify") {
        setSearchNotify(modalData.name)
        setValue("partyDetails.notifyPartyId", modalData.name)
    } else if (activeModal === "agent") {
        setSearchAgent(modalData.name)
        setValue("partyDetails.overseasAgentId", modalData.name)
    }
    
    setActiveModal(null)
  }

  return (
    <section className="relative">
      <h2 className="text-xl font-bold mb-4 text-on-surface">Shipment Parties</h2>

      <Card className="p-8 grid md:grid-cols-2 gap-8 bg-surface-container-lowest border-none shadow-[0_4px_20px_rgba(25,28,30,0.03)]">
        
        {/* SHIPPER */}
        <div className="relative">
          <div className="flex justify-between items-end mb-2">
            <FormLabel className="text-on-surface-variant font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              Shipper (Origin)
              {(getValues("partyDetails.shipperId") || searchShipper) && (
                <button type="button" onClick={() => openPeekModal("shipper")} className="text-primary hover:text-blue-600 transition-colors">
                    <FileEdit className="w-3.5 h-3.5" />
                </button>
              )}
            </FormLabel>
            <button type="button" onClick={() => handleCopyCustomer("shipperId")} className="text-[10px] text-blue-600 font-bold hover:underline">
              Copy Customer ↑
            </button>
          </div>
          <FormField
            control={control}
            name="partyDetails.shipperId"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormControl>
                  <Combobox
                    open={openShipper} onOpenChange={setOpenShipper}
                    value={companies.find(c => c._id === field.value)?.name || field.value || ""} 
                    inputValue={searchShipper}
                    onValueChange={(val: string | null) => {
                      const safeVal = val || ""
                      const selected = shippers.find(c => c.name.toLowerCase() === safeVal.toLowerCase())
                      if (selected) {
                        field.onChange(selected._id)
                        setSearchShipper(selected.name)
                      } else {
                        field.onChange(safeVal)
                      }
                    }}
                    onInputValueChange={(val: string) => setSearchShipper(val)}
                  >
                    <ComboboxInput 
                      showTrigger 
                      placeholder="Search or add Shipper..." 
                      className="bg-surface-container-low border-none" 
                      onBlur={() => { if (searchShipper) field.onChange(searchShipper) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); e.stopPropagation(); 
                          if (searchShipper) { field.onChange(searchShipper); setOpenShipper(false); }
                        }
                      }}
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {shippers.map((c) => (<ComboboxItem key={c._id} value={c.name}>{c.name}</ComboboxItem>))}
                        <ComboboxEmpty>
                           <div onClick={() => field.onChange(searchShipper)} className="p-2 text-sm text-blue-600 cursor-pointer text-center">
                             Create "{searchShipper}" as Shipper
                           </div>
                        </ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* CONSIGNEE */}
        <div className="relative">
          <div className="flex justify-between items-end mb-2">
            <FormLabel className="text-on-surface-variant font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              Consignee (Destination)
               {(getValues("partyDetails.consigneeId") || searchConsignee) && (
                <button type="button" onClick={() => openPeekModal("consignee")} className="text-primary hover:text-blue-600 transition-colors">
                    <FileEdit className="w-3.5 h-3.5" />
                </button>
              )}
            </FormLabel>
            <button type="button" onClick={() => handleCopyCustomer("consigneeId")} className="text-[10px] text-blue-600 font-bold hover:underline">
              Copy Customer ↑
            </button>
          </div>
          <FormField
            control={control}
            name="partyDetails.consigneeId"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormControl>
                  <Combobox
                    open={openConsignee} onOpenChange={setOpenConsignee}
                    value={companies.find(c => c._id === field.value)?.name || field.value || ""} 
                    inputValue={searchConsignee}
                    onValueChange={(val: string | null) => {
                      const safeVal = val || ""
                      const selected = consignees.find(c => c.name.toLowerCase() === safeVal.toLowerCase())
                      if (selected) {
                        field.onChange(selected._id)
                        setSearchConsignee(selected.name)
                      } else {
                        field.onChange(safeVal)
                      }
                    }}
                    onInputValueChange={(val: string) => setSearchConsignee(val)}
                  >
                    <ComboboxInput 
                      showTrigger 
                      placeholder="Search or add Consignee..." 
                      className="bg-surface-container-low border-none" 
                      onBlur={() => { if (searchConsignee) field.onChange(searchConsignee) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); e.stopPropagation(); 
                          if (searchConsignee) { field.onChange(searchConsignee); setOpenConsignee(false); }
                        }
                      }}
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {consignees.map((c) => (<ComboboxItem key={c._id} value={c.name}>{c.name}</ComboboxItem>))}
                        <ComboboxEmpty>
                           <div onClick={() => field.onChange(searchConsignee)} className="p-2 text-sm text-blue-600 cursor-pointer text-center">
                             Create "{searchConsignee}" as Consignee
                           </div>
                        </ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* NOTIFY PARTY */}
        <div className="relative border-t border-outline-variant/10 pt-6">
          <div className="flex justify-between items-end mb-2">
            <FormLabel className="text-on-surface-variant font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              Notify Party
              {(getValues("partyDetails.notifyPartyId") || searchNotify) && (
                <button type="button" onClick={() => openPeekModal("notify")} className="text-primary hover:text-blue-600 transition-colors">
                    <FileEdit className="w-3.5 h-3.5" />
                </button>
              )}
            </FormLabel>
            <button type="button" onClick={() => handleCopyCustomer("notifyPartyId")} className="text-[10px] text-blue-600 font-bold hover:underline">
              Copy Customer ↑
            </button>
          </div>
          <FormField
            control={control}
            name="partyDetails.notifyPartyId"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormControl>
                  <Combobox
                    open={openNotify} onOpenChange={setOpenNotify}
                    value={companies.find(c => c._id === field.value)?.name || field.value || ""} 
                    inputValue={searchNotify}
                    onValueChange={(val: string | null) => {
                      const safeVal = val || ""
                      const selected = notifyParties.find(c => c.name.toLowerCase() === safeVal.toLowerCase())
                      if (selected) {
                        field.onChange(selected._id)
                        setSearchNotify(selected.name)
                      } else {
                        field.onChange(safeVal)
                      }
                    }}
                    onInputValueChange={(val: string) => setSearchNotify(val)}
                  >
                    <ComboboxInput 
                      showTrigger 
                      placeholder="Search or add Notify Party..." 
                      className="bg-surface-container-low border-none" 
                      onBlur={() => { if (searchNotify) field.onChange(searchNotify) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); e.stopPropagation(); 
                          if (searchNotify) { field.onChange(searchNotify); setOpenNotify(false); }
                        }
                      }}
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {notifyParties.map((c) => (<ComboboxItem key={c._id} value={c.name}>{c.name}</ComboboxItem>))}
                        <ComboboxEmpty>
                           <div onClick={() => field.onChange(searchNotify)} className="p-2 text-sm text-blue-600 cursor-pointer text-center">
                             Create "{searchNotify}" as Notify Party
                           </div>
                        </ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* OVERSEAS AGENT */}
        <div className="relative border-t border-outline-variant/10 pt-6">
          <div className="flex justify-between items-end mb-2">
            <FormLabel className="text-on-surface-variant font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              Overseas Agent
              {(getValues("partyDetails.overseasAgentId") || searchAgent) && (
                <button type="button" onClick={() => openPeekModal("agent")} className="text-primary hover:text-blue-600 transition-colors">
                    <FileEdit className="w-3.5 h-3.5" />
                </button>
              )}
            </FormLabel>
          </div>
          <FormField
            control={control}
            name="partyDetails.overseasAgentId"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormControl>
                  <Combobox
                    open={openAgent} onOpenChange={setOpenAgent}
                    value={companies.find(c => c._id === field.value)?.name || field.value || ""} 
                    inputValue={searchAgent}
                    onValueChange={(val: string | null) => {
                      const safeVal = val || ""
                      const selected = agents.find(c => c.name.toLowerCase() === safeVal.toLowerCase())
                      if (selected) {
                        field.onChange(selected._id)
                        setSearchAgent(selected.name)
                      } else {
                        field.onChange(safeVal)
                      }
                    }}
                    onInputValueChange={(val: string) => setSearchAgent(val)}
                  >
                    <ComboboxInput 
                      showTrigger 
                      placeholder="Search or add Agent..." 
                      className="bg-surface-container-low border-none" 
                      onBlur={() => { if (searchAgent) field.onChange(searchAgent) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); e.stopPropagation(); 
                          if (searchAgent) { field.onChange(searchAgent); setOpenAgent(false); }
                        }
                      }}
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {agents.map((c) => (<ComboboxItem key={c._id} value={c.name}>{c.name}</ComboboxItem>))}
                        <ComboboxEmpty>
                           <div onClick={() => field.onChange(searchAgent)} className="p-2 text-sm text-blue-600 cursor-pointer text-center">
                             Create "{searchAgent}" as Agent
                           </div>
                        </ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

      </Card>

      {/* --- THE PEEK MODAL OVERLAY --- */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-surface-container flex justify-between items-center bg-surface-container-low/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Quick Edit Entity</h3>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    {activeModal === "shipper" && "Shipper Details"}
                    {activeModal === "consignee" && "Consignee Details"}
                    {activeModal === "notify" && "Notify Party Details"}
                    {activeModal === "agent" && "Overseas Agent Details"}
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Company Name *</label>
                <input type="text" value={modalData.name} onChange={e => setModalData({...modalData, name: e.target.value})} className="w-full bg-surface-container-low border-none rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Tax ID / VAT / GSTIN</label>
                <input type="text" value={modalData.taxId} onChange={e => setModalData({...modalData, taxId: e.target.value})} className="w-full bg-surface-container-low border-none rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Street Address</label>
                <input type="text" value={modalData.streetAddress} onChange={e => setModalData({...modalData, streetAddress: e.target.value})} className="w-full bg-surface-container-low border-none rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">City</label>
                  <input type="text" value={modalData.city} onChange={e => setModalData({...modalData, city: e.target.value})} className="w-full bg-surface-container-low border-none rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">State / Province</label>
                  <input type="text" value={modalData.state} onChange={e => setModalData({...modalData, state: e.target.value})} className="w-full bg-surface-container-low border-none rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Zip Code</label>
                  <input type="text" value={modalData.zipCode} onChange={e => setModalData({...modalData, zipCode: e.target.value})} className="w-full bg-surface-container-low border-none rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Country</label>
                  <input type="text" value={modalData.country} onChange={e => setModalData({...modalData, country: e.target.value})} className="w-full bg-surface-container-low border-none rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container flex justify-end gap-3 border-t border-surface-container-highest">
              <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">Cancel</button>
              <button type="button" onClick={handleModalSave} className="px-5 py-2.5 text-sm font-bold bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity">Apply to Shipment</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}