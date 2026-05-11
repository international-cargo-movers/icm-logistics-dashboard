"use client"

import * as React from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox"
import { ArrowDown } from "lucide-react"
import { AddPortModal } from "@/components/dashboard/ports/AddPortModal"

type DBPort = {
  _id: string;
  name: string;
  locode: string;
  country: string;
  countryCode: string;
  type: string[];
}

export default function RoutingSection({ isReadOnly }: { isReadOnly?: boolean }) {
  const { control, setValue } = useFormContext()

  const mode = useWatch({ control, name: "shipmentDetails.mode" }) || ""
  const originCountry = useWatch({ control, name: "shipmentDetails.originCountry" })
  const destinationCountry = useWatch({ control, name: "shipmentDetails.destinationCountry" })
  const originPort = useWatch({ control, name: "shipmentDetails.originPort" }) || ""
  const destinationPort = useWatch({ control, name: "shipmentDetails.destinationPort" }) || ""

  const [allPorts, setAllPorts] = React.useState<DBPort[]>([])
  const [countries, setCountries] = React.useState<{name: string, code: string}[]>([])

  const [openOC, setOpenOC] = React.useState(false); const [searchOC, setSearchOC] = React.useState("")
  const [openOP, setOpenOP] = React.useState(false); const [searchOP, setSearchOP] = React.useState("")
  const [openDC, setOpenDC] = React.useState(false); const [searchDC, setSearchDC] = React.useState("")
  const [openDP, setOpenDP] = React.useState(false); const [searchDP, setSearchDP] = React.useState("")

  // Modal State
  const [isPortModalOpen, setIsPortModalOpen] = React.useState(false)
  const [portModalConfig, setPortModalConfig] = React.useState<{
    target: "origin" | "destination";
    initialName: string;
  } | null>(null)

  const handlePortSuccess = (newPort: any) => {
    setAllPorts(prev => [...prev, newPort])
    setCountries(prev => {
        if (!prev.find(c => c.code === newPort.countryCode)) {
            return [...prev, { name: newPort.country, code: newPort.countryCode }].sort((a, b) => a.name.localeCompare(b.name));
        }
        return prev;
    })

    if (portModalConfig?.target === "origin") {
        setValue("shipmentDetails.originCountry", newPort.countryCode, { shouldValidate: true })
        setValue("shipmentDetails.originPort", newPort.locode || newPort.name, { shouldValidate: true })
    } else {
        setValue("shipmentDetails.destinationCountry", newPort.countryCode, { shouldValidate: true })
        setValue("shipmentDetails.destinationPort", newPort.locode || newPort.name, { shouldValidate: true })
    }
  }

  // --- 1. RESTORED: Fetch Master Data ---
  React.useEffect(() => {
    async function fetchPorts() {
      try {
        const res = await fetch("/api/ports")
        const json = await res.json()
        if (json.success) {
          setAllPorts(json.data)
          const uniqueCountriesMap = new Map()
          json.data.forEach((p: DBPort) => {
            if (!uniqueCountriesMap.has(p.countryCode)) {
              uniqueCountriesMap.set(p.countryCode, { name: p.country, code: p.countryCode })
            }
          })
          setCountries(Array.from(uniqueCountriesMap.values()).sort((a, b) => a.name.localeCompare(b.name)))
        }
      } catch (error) {
        console.error("Failed to fetch ports:", error)
      }
    }
    fetchPorts()
  }, [])

  // --- 2. RACE CONDITION FIX: Only clear the port if the new country DOESN'T match ---
  React.useEffect(() => {
    if(!isReadOnly && originCountry && allPorts.length > 0) {
        const currentPortObj = allPorts.find(p => (p.locode === originPort || p.name === originPort));
        if (currentPortObj && currentPortObj.countryCode !== originCountry) {
            setValue("shipmentDetails.originPort", "", { shouldValidate: true })
        }
    }
  }, [originCountry, isReadOnly, allPorts, setValue, originPort])

  React.useEffect(() => {
    if(!isReadOnly && destinationCountry && allPorts.length > 0) {
        const currentPortObj = allPorts.find(p => (p.locode === destinationPort || p.name === destinationPort));
        if (currentPortObj && currentPortObj.countryCode !== destinationCountry) {
            setValue("shipmentDetails.destinationPort", "", { shouldValidate: true })
        }
    }
  }, [destinationCountry, isReadOnly, allPorts, setValue, destinationPort])

  // --- 3. ULTIMATE GHOST DATA FIXES ---
  // Syncs the visual text boxes when a Quote is linked, OR wipes them when "Clear Selection" is clicked
  React.useEffect(() => {
    if (!originCountry) setSearchOC("");
    else if (countries.length > 0) {
      const found = countries.find(c => c.code === originCountry);
      if (found) setSearchOC(found.name);
    }
  }, [originCountry, countries]);

  React.useEffect(() => {
    if (!originPort) setSearchOP("");
    else if (allPorts.length > 0) {
      const found = allPorts.find(p => (p.locode === originPort || p.name === originPort));
      if (found) setSearchOP(found.name);
    }
  }, [originPort, allPorts]);

  React.useEffect(() => {
    if (!destinationCountry) setSearchDC("");
    else if (countries.length > 0) {
      const found = countries.find(c => c.code === destinationCountry);
      if (found) setSearchDC(found.name);
    }
  }, [destinationCountry, countries]);

  React.useEffect(() => {
    if (!destinationPort) setSearchDP("");
    else if (allPorts.length > 0) {
      const found = allPorts.find(p => (p.locode === destinationPort || p.name === destinationPort));
      if (found) setSearchDP(found.name);
    }
  }, [destinationPort, allPorts]);

  const isAir = mode.includes("Air")
  const requiredType = isAir ? "Air" : "Sea"

  const availableOriginPorts = allPorts.filter(p => p.countryCode === originCountry && p.type.includes(requiredType))
  const availableDestPorts = allPorts.filter(p => p.countryCode === destinationCountry && p.type.includes(requiredType))

  return (
    <section>
      <div className="flex justify-between items-end mb-4">
        <h2 className="section-title text-xl font-bold text-on-surface">Shipment Routing</h2>
        {isReadOnly && <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-md">Baseline Locked by Quote</span>}
      </div>

      <Card className="p-8 flex flex-col gap-8 bg-surface-container-lowest border-none shadow-[0_4px_20px_rgba(25,28,30,0.03)]">
        
        {/* ROW 1: Transport Mode */}
        <div className="md:w-1/3">
          <FormField
            control={control}
            name="shipmentDetails.mode"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Transport Mode *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                  <FormControl>
                    <SelectTrigger className={`border-none ${isReadOnly ? "bg-muted/50 opacity-70 cursor-not-allowed" : "bg-surface-container-low"}`}>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Sea FCL Export">Sea FCL Export</SelectItem>
                    <SelectItem value="Sea FCL Import">Sea FCL Import</SelectItem>
                    <SelectItem value="Sea LCL Export">Sea LCL Export</SelectItem>
                    <SelectItem value="Sea LCL Import">Sea LCL Import</SelectItem>
                    <SelectItem value="Air Export">Air Export</SelectItem>
                    <SelectItem value="Air Import">Air Import</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ROW 2: Origin Routing */}
        <div className="grid md:grid-cols-2 gap-6 p-6 bg-surface-container-low/50 rounded-xl border border-outline-variant/20">
          <FormField
            control={control}
            name="shipmentDetails.originCountry"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">POL Country</FormLabel>
                <FormControl>
                  <Combobox open={isReadOnly ? false : openOC} onOpenChange={isReadOnly ? () => {} : setOpenOC} value={countries.find(c => c.code === field.value)?.name || field.value || ""} inputValue={searchOC} onValueChange={(val) => {
                      if(isReadOnly) return;
                      const selected = countries.find(c => c.name.toLowerCase() === (val || "").toLowerCase())
                      field.onChange(selected ? selected.code : val)
                    }} onInputValueChange={isReadOnly ? () => {} : setSearchOC}>
                    <ComboboxInput showTrigger={!isReadOnly} disabled={isReadOnly} placeholder="Select Origin Country..." className={`border-none ${isReadOnly ? "bg-muted/50 opacity-70 cursor-not-allowed font-semibold text-on-surface" : "bg-white"}`} />
                    <ComboboxContent>
                      <ComboboxList>
                        {countries.map((c) => <ComboboxItem key={c.code} value={c.name}>{c.name}</ComboboxItem>)}
                        <ComboboxEmpty className="flex flex-col gap-2 p-4">
                          <p className="text-xs text-muted-foreground">No countries found.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setPortModalConfig({ target: "origin", initialName: "" });
                              setIsPortModalOpen(true);
                              setOpenOC(false);
                            }}
                            className="text-[10px] font-bold uppercase py-2 px-4 border border-primary/20 bg-primary/5 text-primary rounded-md hover:bg-primary/10 transition-all text-left"
                          >
                            + Add Port in "{searchOC}"
                          </button>
                        </ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="shipmentDetails.originPort"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Port of Loading</FormLabel>
                <FormControl>
                  <Combobox open={isReadOnly ? false : openOP} onOpenChange={isReadOnly ? () => {} : setOpenOP} value={allPorts.find(p => (p.locode === field.value || p.name === field.value))?.name || field.value || ""} inputValue={searchOP} onValueChange={(val) => {
                      if(isReadOnly) return;
                      const selected = availableOriginPorts.find(p => p.name.toLowerCase() === (val || "").toLowerCase())
                      field.onChange(selected ? (selected.locode || selected.name) : val)
                    }} onInputValueChange={isReadOnly ? () => {} : setSearchOP}>
                    <ComboboxInput showTrigger={!isReadOnly && !!originCountry} disabled={isReadOnly || !originCountry} placeholder={originCountry ? "Select Port..." : "Select Country First"} className={`border-none ${isReadOnly || !originCountry ? "bg-muted/50 opacity-70 cursor-not-allowed font-semibold text-on-surface" : "bg-white"}`} />
                    <ComboboxContent>
                      <ComboboxList>
                        {availableOriginPorts.map((p) => <ComboboxItem key={p._id} value={p.name}>{p.name} ({p.locode || "N/A"})</ComboboxItem>)}
                        <ComboboxEmpty className="flex flex-col gap-2 p-4">
                          <p className="text-xs text-muted-foreground">No ports found.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setPortModalConfig({ target: "origin", initialName: searchOP });
                              setIsPortModalOpen(true);
                              setOpenOP(false);
                            }}
                            className="text-[10px] font-bold uppercase py-2 px-4 border border-primary/20 bg-primary/5 text-primary rounded-md hover:bg-primary/10 transition-all"
                          >
                            + Add "{searchOP}"
                          </button>
                        </ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-center -my-6 z-10">
          <div className="bg-surface-container-highest p-2 rounded-full shadow-sm border border-outline-variant/10">
             <ArrowDown className="text-on-surface-variant w-5 h-5" />
          </div>
        </div>

        {/* ROW 3: Destination Routing */}
        <div className="grid md:grid-cols-2 gap-6 p-6 bg-surface-container-low/50 rounded-xl border border-outline-variant/20">
          <FormField
            control={control}
            name="shipmentDetails.destinationCountry"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">POD Country</FormLabel>
                <FormControl>
                  <Combobox open={isReadOnly ? false : openDC} onOpenChange={isReadOnly ? () => {} : setOpenDC} value={countries.find(c => c.code === field.value)?.name || field.value || ""} inputValue={searchDC} onValueChange={(val) => {
                      if(isReadOnly) return;
                      const selected = countries.find(c => c.name.toLowerCase() === (val || "").toLowerCase())
                      field.onChange(selected ? selected.code : val)
                    }} onInputValueChange={isReadOnly ? () => {} : setSearchDC}>
                    <ComboboxInput showTrigger={!isReadOnly} disabled={isReadOnly} placeholder="Select Dest. Country..." className={`border-none ${isReadOnly ? "bg-muted/50 opacity-70 cursor-not-allowed font-semibold text-on-surface" : "bg-white"}`} />
                    <ComboboxContent>
                      <ComboboxList>
                        {countries.map((c) => <ComboboxItem key={c.code} value={c.name}>{c.name}</ComboboxItem>)}
                        <ComboboxEmpty className="flex flex-col gap-2 p-4">
                          <p className="text-xs text-muted-foreground">No countries found.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setPortModalConfig({ target: "destination", initialName: "" });
                              setIsPortModalOpen(true);
                              setOpenDC(false);
                            }}
                            className="text-[10px] font-bold uppercase py-2 px-4 border border-primary/20 bg-primary/5 text-primary rounded-md hover:bg-primary/10 transition-all text-left"
                          >
                            + Add Port in "{searchDC}"
                          </button>
                        </ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="shipmentDetails.destinationPort"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Port of Discharge</FormLabel>
                <FormControl>
                  <Combobox open={isReadOnly ? false : openDP} onOpenChange={isReadOnly ? () => {} : setOpenDP} value={allPorts.find(p => (p.locode === field.value || p.name === field.value))?.name || field.value || ""} inputValue={searchDP} onValueChange={(val) => {
                      if(isReadOnly) return;
                      const selected = availableDestPorts.find(p => p.name.toLowerCase() === (val || "").toLowerCase())
                      field.onChange(selected ? (selected.locode || selected.name) : val)
                    }} onInputValueChange={isReadOnly ? () => {} : setSearchDP}>
                    <ComboboxInput showTrigger={!isReadOnly && !!destinationCountry} disabled={isReadOnly || !destinationCountry} placeholder={destinationCountry ? "Select Port..." : "Select Country First"} className={`border-none ${isReadOnly || !destinationCountry ? "bg-muted/50 opacity-70 cursor-not-allowed font-semibold text-on-surface" : "bg-white"}`} />
                    <ComboboxContent>
                      <ComboboxList>
                        {availableDestPorts.map((p) => <ComboboxItem key={p._id} value={p.name}>{p.name} ({p.locode || "N/A"})</ComboboxItem>)}
                        <ComboboxEmpty className="flex flex-col gap-2 p-4">
                          <p className="text-xs text-muted-foreground">No ports found.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setPortModalConfig({ target: "destination", initialName: searchDP });
                              setIsPortModalOpen(true);
                              setOpenDP(false);
                            }}
                            className="text-[10px] font-bold uppercase py-2 px-4 border border-primary/20 bg-primary/5 text-primary rounded-md hover:bg-primary/10 transition-all"
                          >
                            + Add "{searchDP}"
                          </button>
                        </ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </Card>

      <AddPortModal 
        isOpen={isPortModalOpen}
        onClose={() => setIsPortModalOpen(false)}
        onSuccess={handlePortSuccess}
        initialName={portModalConfig?.initialName}
        defaultCountry={countries.find(c => c.code === (portModalConfig?.target === "origin" ? originCountry : destinationCountry))}
        defaultType={isAir ? "Air" : "Sea"}
      />
    </section>
  )
}
