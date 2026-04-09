"use client"

import * as React from "react"
import { useFormContext, useFieldArray } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { JobFormValues } from "@/app/dashboard/new-job/page" // Adjust path if needed

import { Combobox, ComboboxEmpty, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "@/components/ui/combobox"

type DBCompany = {
  _id: string;
  name: string;
}

const isValidMongoId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

export default function VendorSection() {
  const { control } = useFormContext<JobFormValues>()
  
  // 1. Initialize dynamic array fields
  const { fields, append, remove } = useFieldArray({
    control,
    name: "vendorDetails"
  })

  // 2. Fetch the master database list for the Comboboxes
  const [companies, setCompanies] = React.useState<DBCompany[]>([])

  React.useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/companies")
        const json = await res.json();
        if (json.success) {
          const vendorOnly = json.data.filter((c:any)=>c.type && c.type.includes("Vendor"));
          setCompanies(vendorOnly)
        }
      } catch (error) {
        console.error("Failed to Fetch companies: ", error)
      }
    }
    fetchCompanies()
  }, [])

  return (
    <section>
      <h2 className="section-title text-xl font-bold mb-4">Vendor Assignments</h2>
      <Card className="p-8 space-y-6">
        
        {/* Render each dynamically added Vendor Row */}
        {fields.map((field, index) => (
          <VendorRow
            key={field.id}
            index={index}
            remove={() => remove(index)}
            companies={companies}
            setCompanies={setCompanies}
            control={control}
          />
        ))}

        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No vendors assigned yet.</p>
        )}

        <Button
          type="button" // CRITICAL FIX: Stops the button from submitting!
          variant="outline"
          className="w-full border-dashed"
          onClick={() => append({ vendorId: "", vendorType: "" })}
        >
          + Add Vendor
        </Button>
      </Card>
    </section>
  )
}

// Extracted Row Component to manage the Combobox state for each individual vendor
function VendorRow({ index, remove, companies, setCompanies, control }: any) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // The exact same Trojan Horse auto-create logic from the Customer Section
  const handleHoldText = (nameToKeep: string, onChange: (val: string) => void) => {
    if (!nameToKeep) return;
    
    const existing = companies.find((c: any) => c.name.toLowerCase() === nameToKeep.toLowerCase());
    if (existing) {
      onChange(existing._id);
      setSearchQuery(existing.name);
      setOpen(false);
      return;
    }

    if (!companies.some((c: any) => c._id === nameToKeep)) {
      setCompanies((prev: any) => [...prev, { _id: nameToKeep, name: nameToKeep }]);
    }

    onChange(nameToKeep);
    setOpen(false);
  }

  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/20">
      <div className="flex-1 grid md:grid-cols-2 gap-4">
        
        {/* VENDOR COMPANY COMBOBOX */}
        <FormField
          control={control}
          name={`vendorDetails.${index}.vendorId`}
          render={({ field }:{field:any}) => (
            <FormItem>
              <FormLabel>Vendor Company</FormLabel>
              <FormControl>
                <Combobox
                  open={open}
                  onOpenChange={setOpen}
                  value={field.value}
                  inputValue={searchQuery}
                  onValueChange={(val: string | null) => {
                    const safeVal = val || ""
                    field.onChange(safeVal)
                    const selectedComp = companies.find((c: any) => c._id === safeVal)
                    if (selectedComp) setSearchQuery(selectedComp.name)
                  }}
                  onInputValueChange={(val: string) => {
                    setSearchQuery(val)
                    if (val === "") field.onChange("")
                  }}
                >
                  <ComboboxInput
                    showTrigger
                    placeholder="Search or type new..."
                    onBlur={() => {
                      if (searchQuery) handleHoldText(searchQuery, field.onChange)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.stopPropagation() // Blocks premature submission
                        if (searchQuery) handleHoldText(searchQuery, field.onChange)
                      }
                    }}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {companies.map((c: any) => (
                        <ComboboxItem
                          key={c._id}
                          value={c._id}
                          className={isValidMongoId(c._id) ? "" : "hidden"}
                        >
                          {c.name}
                        </ComboboxItem>
                      ))}
                      <ComboboxEmpty>
                        <div
                          onPointerDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleHoldText(searchQuery, field.onChange)
                          }}
                          className="cursor-pointer px-4 py-3 text-sm text-center hover:bg-muted text-primary font-medium transition-colors"
                        >
                          Create "{searchQuery}"
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

        {/* VENDOR ROLE/TASK INPUT */}
        <FormField
          control={control}
          name={`vendorDetails.${index}.vendorType`}
          render={({ field }:{field:any}) => (
            <FormItem>
              <FormLabel>Assigned Task / Role</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Transporter, Customs Broker" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="mt-8 text-red-500 hover:text-red-700 hover:bg-red-100/50" 
        onClick={remove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}