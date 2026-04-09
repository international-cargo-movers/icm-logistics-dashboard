import * as React from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { JobFormValues } from "@/app/dashboard/new-job/page"

import { Combobox, ComboboxEmpty, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from "@/components/ui/combobox"

type DBCompany = {
  _id: string;
  name: string;
  defaultSalesPerson?: string;
  billingAddress?: string;
}

const isValidMongoId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

export default function CustomerSection() {
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
          const customerOnly = json.data.filter((c:any)=>c.type && c.type.includes("Customer"))
          setCompanies(customerOnly)
        }
      } catch (error) {
        console.error("Failed to Fetch companies: ", error)
      }
    }
    fetchCompanies()
  }, [])

  const handleCompanySelect = (selectedIdOrName: string) => {
    const foundCompany = companies.find(c => c._id === selectedIdOrName)
    
    if (foundCompany && isValidMongoId(foundCompany._id)) { 
      setValue("customerDetails.salesPerson", foundCompany.defaultSalesPerson || "", { shouldValidate: true })
      setValue("customerDetails.billingAddress", foundCompany.billingAddress || "", { shouldValidate: true })
    } else {
      setValue("customerDetails.salesPerson", "")
      setValue("customerDetails.billingAddress", "")
    }
  }

  const handleHoldText = (nameToKeep: string, onChange: (val: string) => void) => {
    if (!nameToKeep) return;
    
    const existing = companies.find(c => c.name.toLowerCase() === nameToKeep.toLowerCase());
    if (existing) {
      onChange(existing._id);
      handleCompanySelect(existing._id);
      setSearchQuery(existing.name);
      setOpen(false);
      return;
    }

    if (!companies.some(c => c.name.toLowerCase() === nameToKeep.toLowerCase())) {
      setCompanies(prev => [...prev, { _id: nameToKeep, name: nameToKeep }]);
    }

    onChange(nameToKeep);
    handleCompanySelect(nameToKeep);
    setOpen(false);
  }

  const currentCompanyId = watch("customerDetails.companyId") || ""
  const isKnownCompany = isValidMongoId(currentCompanyId) && companies.some(c => c._id === currentCompanyId)

  return (
    <section>
      <h2 className="section-title text-xl font-bold mb-4">Customer Details</h2>

      <Card className="p-8 grid md:grid-cols-2 gap-8">
        <div>
          <FormField
            control={control}
            name="customerDetails.companyId"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Combobox
                    open={open}
                    onOpenChange={setOpen}
                    
                    // FIX 1: Feed the Combobox UI the Name instead of the ID so it matches!
                    value={companies.find(c => c._id === field.value)?.name || field.value} 
                    
                    inputValue={searchQuery}
                    onValueChange={(val: string | null) => {
                      const safeVal = val || ""
                      
                      // FIX 2: Since the Combobox now returns a Name, we look up the company by Name!
                      const selectedComp = companies.find(c => c.name.toLowerCase() === safeVal.toLowerCase())
                      
                      if (selectedComp) {
                        // Secretly pass the real MongoDB ID to the form behind the scenes
                        field.onChange(selectedComp._id)
                        handleCompanySelect(selectedComp._id)
                        setSearchQuery(selectedComp.name)
                      } else {
                        field.onChange(safeVal)
                        handleCompanySelect(safeVal)
                      }
                    }}
                    onInputValueChange={(val: string) => {
                      setSearchQuery(val)
                      if (val === "") {
                        field.onChange("")
                        handleCompanySelect("")
                      }
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
                          e.stopPropagation() 
                          if (searchQuery) handleHoldText(searchQuery, field.onChange)
                        }
                      }}
                    />
                    
                    <ComboboxContent>
                      <ComboboxList>
                        {companies.map((c) => (
                          <ComboboxItem 
                            key={c._id} 
                            // FIX 3: The item value is now the Name! This stops the ID from jumping into the text box.
                            value={c.name}
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
        </div>

        {/* ... Rest of the component stays exactly the same (Sales Person & Billing Address) ... */}
        <div>
          <FormField
            control={control}
            name="customerDetails.salesPerson"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Sales Person</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={isKnownCompany ? "Auto-filled" : "Enter sales person name..."} 
                    readOnly={isKnownCompany} 
                    className={isKnownCompany ? "bg-muted/50 cursor-not-allowed" : ""} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="md:col-span-2">
          <FormField
            control={control}
            name="customerDetails.billingAddress"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Billing Address *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={isKnownCompany ? "Auto-filled" : "Enter full billing address..."} 
                    readOnly={isKnownCompany} 
                    className={isKnownCompany ? "bg-muted/50 cursor-not-allowed" : ""} 
                    {...field} 
                  />
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