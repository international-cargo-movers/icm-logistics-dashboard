import * as React from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { JobFormValues } from "@/app/dashboard/new-job/page"

import { Combobox, ComboboxEmpty, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "@/components/ui/combobox"

type DBCompany = {
  _id: string;
  name: string;
  defaultSalesPerson?: string;
  taxId?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

const isValidMongoId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

export default function CustomerSection({ isReadOnly }: { isReadOnly?: boolean }) {
  const { control, setValue, watch } = useFormContext<JobFormValues>()
  
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [companies, setCompanies] = React.useState<DBCompany[]>([]);

  React.useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/companies")
        const json = await res.json();
        if (json.success) {
          const customerOnly = json.data.filter((c:any)=>c.type && (c.type.includes("Customer")||c.type.includes("Shipper")||c.type.includes("Consignee")))
          setCompanies(customerOnly)
        }
      } catch (error) { console.error("Failed to Fetch companies: ", error) }
    }
    fetchCompanies()
  }, [])

  const currentCompanyId = watch("customerDetails.companyId") || ""
  const isKnownCompany = isValidMongoId(currentCompanyId) && companies.some(c => c._id === currentCompanyId)
  
  // Allow editing if the current ID is NOT a valid MongoDB ID (i.e. it's just a text name from a quote)
  // or if explicitly allowed.
  const canEditCompanyName = !isReadOnly || !isValidMongoId(currentCompanyId);

  // THE ULTIMATE GHOST-DATA FIX
  // This explicitly guarantees that the visual text box matches the background data state at all times!
  React.useEffect(() => {
    if (!currentCompanyId) {
      setSearchQuery(""); // Instantly wipe visual text when "Clear Selection" is clicked
    } else if (companies.length > 0) {
      const foundCompany = companies.find(c => c._id === currentCompanyId);
      if (foundCompany) {
        setSearchQuery(foundCompany.name); // Instantly paint the visual text when Quote is linked
      }
    }
  }, [currentCompanyId, companies]);

  const handleCompanySelect = (selectedIdOrName: string) => {
    const foundCompany = companies.find(c => c._id === selectedIdOrName)
    
    if (foundCompany && isValidMongoId(foundCompany._id)) { 
      setValue("customerDetails.salesPerson", foundCompany.defaultSalesPerson || "", { shouldValidate: true })
      setValue("customerDetails.taxId", foundCompany.taxId || "", { shouldValidate: true })
      setValue("customerDetails.streetAddress", foundCompany.streetAddress || "", { shouldValidate: true })
      setValue("customerDetails.city", foundCompany.city || "", { shouldValidate: true })
      setValue("customerDetails.state", foundCompany.state || "", { shouldValidate: true })
      setValue("customerDetails.zipCode", foundCompany.zipCode || "", { shouldValidate: true })
      setValue("customerDetails.country", foundCompany.country || "", { shouldValidate: true })
    } else {
      setValue("customerDetails.salesPerson", "")
      setValue("customerDetails.taxId", "")
      setValue("customerDetails.streetAddress", "")
      setValue("customerDetails.city", "")
      setValue("customerDetails.state", "")
      setValue("customerDetails.zipCode", "")
      setValue("customerDetails.country", "")
    }
  }

  const handleHoldText = (nameToKeep: string, onChange: (val: string) => void) => {
    if (!nameToKeep) return;
    const existing = companies.find(c => c.name.toLowerCase() === nameToKeep.toLowerCase());
    if (existing) {
      onChange(existing._id);
      handleCompanySelect(existing._id);
      setSearchQuery(existing.name);
    } else {
      setCompanies(prev => [...prev, { _id: nameToKeep, name: nameToKeep }]);
      onChange(nameToKeep);
      handleCompanySelect(nameToKeep);
    }
    setOpen(false);
  }

  return (
    <section>
      <div className="flex justify-between items-end mb-4">
        <h2 className="section-title text-xl font-bold text-on-surface">Customer Details</h2>
        {isReadOnly && <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-md">Baseline Locked by Quote</span>}
      </div>

      <Card className="p-8 grid md:grid-cols-2 gap-8 bg-surface-container-lowest border-none shadow-[0_4px_20px_rgba(25,28,30,0.03)]">
        <div>
          <FormField
            control={control}
            name="customerDetails.companyId"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Combobox
                    open={canEditCompanyName ? open : false}
                    onOpenChange={canEditCompanyName ? setOpen : () => {}}
                    value={companies.find(c => c._id === field.value)?.name || field.value} 
                    inputValue={searchQuery}
                    onValueChange={(val: string | null) => {
                      if (!canEditCompanyName) return;
                      const safeVal = val || ""
                      const selectedComp = companies.find(c => c.name.toLowerCase() === safeVal.toLowerCase())
                      if (selectedComp) {
                        field.onChange(selectedComp._id)
                        handleCompanySelect(selectedComp._id)
                        setSearchQuery(selectedComp.name)
                      } else {
                        field.onChange(safeVal)
                        handleCompanySelect(safeVal)
                      }
                    }}
                    onInputValueChange={(val: string) => {
                      if (!canEditCompanyName) return;
                      setSearchQuery(val)
                      if (val === "") {
                        field.onChange("")
                        handleCompanySelect("")
                      }
                    }}
                  >
                    <ComboboxInput 
                      showTrigger={canEditCompanyName}
                      disabled={!canEditCompanyName}
                      placeholder="Search or type new..." 
                      className={!canEditCompanyName ? "bg-muted/50 opacity-70 cursor-not-allowed border-none text-on-surface font-semibold" : "border-none"}
                      onBlur={() => { if (searchQuery && canEditCompanyName) handleHoldText(searchQuery, field.onChange) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canEditCompanyName) {
                          e.preventDefault() 
                          e.stopPropagation() 
                          if (searchQuery) handleHoldText(searchQuery, field.onChange)
                        }
                      }}
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {companies.map((c) => (
                          <ComboboxItem key={c._id} value={c.name} className={isValidMongoId(c._id) ? "" : "hidden"}>{c.name}</ComboboxItem>
                        ))}
                        <ComboboxEmpty>
                          <div onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleHoldText(searchQuery, field.onChange) }} className="cursor-pointer px-4 py-3 text-sm text-center hover:bg-muted text-primary font-medium transition-colors">
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
        </div>

        <div>
          <FormField
            control={control}
            name="customerDetails.salesPerson"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Sales Person</FormLabel>
                <FormControl><Input placeholder="Enter sales person name..." {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="customerDetails.taxId"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Tax ID (GSTIN/EIN)</FormLabel>
                <FormControl><Input placeholder="e.g. 27AAAAA0000A1Z5" {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
           <FormField
            control={control}
            name="customerDetails.streetAddress"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl><Input placeholder="123 Logistics Way..." {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="customerDetails.city"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl><Input placeholder="City" {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="customerDetails.state"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>State / Province</FormLabel>
                <FormControl><Input placeholder="State" {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="customerDetails.zipCode"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Zip / Postal Code</FormLabel>
                <FormControl><Input placeholder="Zip Code" {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={control}
            name="customerDetails.country"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl><Input placeholder="Country" {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Card>
    </section>
  )
}