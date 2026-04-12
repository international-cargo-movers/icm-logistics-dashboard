"use client"

import * as React from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from "@/components/ui/combobox"
import { ArrowDown } from "lucide-react"

// Types based on our new PortModel
type DBPort = {
  _id: string;
  name: string;
  locode: string;
  country: string;
  countryCode: string;
  type: string[];
}

export default function RoutingSection() {
  const { control, setValue } = useFormContext()

  // Watch the mode to filter ports (e.g., Sea vs Air)
  const mode = useWatch({ control, name: "shipmentDetails.mode" }) || ""
  
  // Watch the countries to trigger the cascading effect
  const originCountry = useWatch({ control, name: "shipmentDetails.originCountry" })
  const destinationCountry = useWatch({ control, name: "shipmentDetails.destinationCountry" })

  const [allPorts, setAllPorts] = React.useState<DBPort[]>([])
  const [countries, setCountries] = React.useState<{name: string, code: string}[]>([])

  // UI State for Comboboxes
  const [openOC, setOpenOC] = React.useState(false); const [searchOC, setSearchOC] = React.useState("")
  const [openOP, setOpenOP] = React.useState(false); const [searchOP, setSearchOP] = React.useState("")
  const [openDC, setOpenDC] = React.useState(false); const [searchDC, setSearchDC] = React.useState("")
  const [openDP, setOpenDP] = React.useState(false); const [searchDP, setSearchDP] = React.useState("")

  // 1. Fetch Master Port Data on mount
  React.useEffect(() => {
    async function fetchPorts() {
      try {
        const res = await fetch("/api/ports")
        const json = await res.json()
        if (json.success) {
          setAllPorts(json.data)
          
          // Extract unique countries from the port list
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

  // 2. Cascading Logic: Clear the Port if the Country changes!
  React.useEffect(() => {
    setValue("shipmentDetails.originPort", "", { shouldValidate: true })
    setSearchOP("")
  }, [originCountry, setValue])

  React.useEffect(() => {
    setValue("shipmentDetails.destinationPort", "", { shouldValidate: true })
    setSearchDP("")
  }, [destinationCountry, setValue])

  // 3. Filter Ports based on selected Country AND Transport Mode
  const isAir = mode.includes("air")
  const requiredType = isAir ? "Air" : "Sea"

  const availableOriginPorts = allPorts.filter(p => 
    p.countryCode === originCountry && p.type.includes(requiredType)
  )
  
  const availableDestPorts = allPorts.filter(p => 
    p.countryCode === destinationCountry && p.type.includes(requiredType)
  )

  return (
    <section>
      <h2 className="section-title text-xl font-bold mb-4 text-on-surface">Shipment Routing</h2>

      <Card className="p-8 flex flex-col gap-8 bg-surface-container-lowest border-none shadow-[0_4px_20px_rgba(25,28,30,0.03)]">
        
        {/* ROW 1: Transport Mode */}
        <div className="md:w-1/3">
          <FormField
            control={control}
            name="shipmentDetails.mode"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Transport Mode *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-surface-container-low border-none">
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
                  <Combobox open={openOC} onOpenChange={setOpenOC} value={countries.find(c => c.code === field.value)?.name || field.value || ""} inputValue={searchOC} onValueChange={(val) => {
                      const selected = countries.find(c => c.name.toLowerCase() === (val || "").toLowerCase())
                      field.onChange(selected ? selected.code : val)
                    }} onInputValueChange={setSearchOC}>
                    <ComboboxInput showTrigger placeholder="Select Origin Country..." className="bg-white border-none" />
                    <ComboboxContent>
                      <ComboboxList>
                        {countries.map((c) => <ComboboxItem key={c.code} value={c.name}>{c.name}</ComboboxItem>)}
                        <ComboboxEmpty>No countries found</ComboboxEmpty>
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
                  <Combobox open={openOP} onOpenChange={setOpenOP} value={allPorts.find(p => p.locode === field.value)?.name || field.value || ""} inputValue={searchOP} onValueChange={(val) => {
                      const selected = availableOriginPorts.find(p => p.name.toLowerCase() === (val || "").toLowerCase())
                      field.onChange(selected ? selected.locode : val)
                    }} onInputValueChange={setSearchOP}>
                    <ComboboxInput showTrigger disabled={!originCountry} placeholder={originCountry ? "Select Port..." : "Select Country First"} className="bg-white border-none disabled:opacity-50" />
                    <ComboboxContent>
                      <ComboboxList>
                        {availableOriginPorts.map((p) => <ComboboxItem key={p.locode} value={p.name}>{p.name} ({p.locode})</ComboboxItem>)}
                        <ComboboxEmpty>{originCountry ? "No ports found" : "Select a country first"}</ComboboxEmpty>
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
                  <Combobox open={openDC} onOpenChange={setOpenDC} value={countries.find(c => c.code === field.value)?.name || field.value || ""} inputValue={searchDC} onValueChange={(val) => {
                      const selected = countries.find(c => c.name.toLowerCase() === (val || "").toLowerCase())
                      field.onChange(selected ? selected.code : val)
                    }} onInputValueChange={setSearchDC}>
                    <ComboboxInput showTrigger placeholder="Select Dest. Country..." className="bg-white border-none" />
                    <ComboboxContent>
                      <ComboboxList>
                        {countries.map((c) => <ComboboxItem key={c.code} value={c.name}>{c.name}</ComboboxItem>)}
                        <ComboboxEmpty>No countries found</ComboboxEmpty>
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
                  <Combobox open={openDP} onOpenChange={setOpenDP} value={allPorts.find(p => p.locode === field.value)?.name || field.value || ""} inputValue={searchDP} onValueChange={(val) => {
                      const selected = availableDestPorts.find(p => p.name.toLowerCase() === (val || "").toLowerCase())
                      field.onChange(selected ? selected.locode : val)
                    }} onInputValueChange={setSearchDP}>
                    <ComboboxInput showTrigger disabled={!destinationCountry} placeholder={destinationCountry ? "Select Port..." : "Select Country First"} className="bg-white border-none disabled:opacity-50" />
                    <ComboboxContent>
                      <ComboboxList>
                        {availableDestPorts.map((p) => <ComboboxItem key={p.locode} value={p.name}>{p.name} ({p.locode})</ComboboxItem>)}
                        <ComboboxEmpty>{destinationCountry ? "No ports found" : "Select a country first"}</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

      </Card>
    </section>
  )
}