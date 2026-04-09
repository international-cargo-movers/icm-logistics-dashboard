"use client"

import * as React from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { JobFormValues } from "@/app/dashboard/new-job/page"
import { Combobox, ComboboxEmpty, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "@/components/ui/combobox"

export default function PartiesSection() {
  const { control, setValue } = useFormContext<JobFormValues>()
  
  // Watch the Customer ID so we can copy it!
  const customerId = useWatch({ control, name: "customerDetails.companyId" })

  const [companies, setCompanies] = React.useState<any[]>([])
  
  // Separate states for the two comboboxes
  const [openShipper, setOpenShipper] = React.useState(false)
  const [searchShipper, setSearchShipper] = React.useState("")
  
  const [openConsignee, setOpenConsignee] = React.useState(false)
  const [searchConsignee, setSearchConsignee] = React.useState("")

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

  // Filter the lists
  const shippers = companies.filter(c => c.type?.includes("Shipper") || c.type?.includes("Customer"))
  const consignees = companies.filter(c => c.type?.includes("Consignee") || c.type?.includes("Customer"))

  const handleCopyCustomer = (field: "shipperId" | "consigneeId") => {
    if (customerId) {
      setValue(`partyDetails.${field}`, customerId, { shouldValidate: true })
      // Auto-fill the search box text so the UI updates visually
      const cust = companies.find(c => c._id === customerId)
      if (cust) {
        if (field === "shipperId") setSearchShipper(cust.name)
        if (field === "consigneeId") setSearchConsignee(cust.name)
      }
    } else {
      alert("Please select a Customer first!")
    }
  }

  return (
    <section>
      <h2 className="text-xl font-bold mb-4 text-on-surface">Shipment Parties</h2>

      <Card className="p-8 grid md:grid-cols-2 gap-8 bg-surface-container-lowest border-none shadow-[0_4px_20px_rgba(25,28,30,0.03)]">
        
        {/* SHIPPER */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <FormLabel className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Shipper (Origin)</FormLabel>
            <button 
              type="button" 
              onClick={() => handleCopyCustomer("shipperId")}
              className="text-[10px] text-blue-600 font-bold hover:underline"
            >
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
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {shippers.map((c) => (
                          <ComboboxItem key={c._id} value={c.name}>{c.name}</ComboboxItem>
                        ))}
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
        <div>
          <div className="flex justify-between items-end mb-2">
            <FormLabel className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Consignee (Destination)</FormLabel>
            <button 
              type="button" 
              onClick={() => handleCopyCustomer("consigneeId")}
              className="text-[10px] text-blue-600 font-bold hover:underline"
            >
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
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {consignees.map((c) => (
                          <ComboboxItem key={c._id} value={c.name}>{c.name}</ComboboxItem>
                        ))}
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

      </Card>
    </section>
  )
}