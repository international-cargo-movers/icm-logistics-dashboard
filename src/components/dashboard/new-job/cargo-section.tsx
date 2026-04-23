"use client"

import * as React from "react"
import { useFormContext, useFieldArray, useWatch } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"

export default function CargoSection({ isReadOnly }: { isReadOnly?: boolean }) {
  const { control, register } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "cargoDetails.items"
  })

  // useWatch ensures the component re-renders on every keystroke in these fields
  const items = useWatch({
    control,
    name: "cargoDetails.items"
  }) || []

  // Calculate totals during render - no lag
  const totals = items.reduce((acc: any, item: any) => {
    acc.pkgs += Number(item.noOfPackages || 0)
    acc.gross += Number(item.grossWeight || 0)
    acc.net += Number(item.netWeight || 0)
    acc.vol += Number(item.volumetricWeight || 0)
    return acc
  }, { pkgs: 0, gross: 0, net: 0, vol: 0 })

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="section-title text-xl font-bold text-on-surface">Cargo Specifications</h2>
        {isReadOnly && <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-md">Baseline Locked by Quote</span>}
      </div>

      <Card className="p-8 space-y-8 bg-surface-container-lowest border-none shadow-[0_4px_20px_rgba(25,28,30,0.03)]">
        
        {/* COMMODITY LEVEL */}
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="cargoDetails.commodity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Main Commodity Group</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Furniture, Electronics..." 
                    {...field} 
                    readOnly={isReadOnly}
                    className={isReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="cargoDetails.carrier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carrier / Airline</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Emirates, Maersk..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ITEMS ARRAY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Line Items</h3>
            {!isReadOnly && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ description: "", noOfPackages: 0, grossWeight: 0, netWeight: 0, volumetricWeight: 0, dimensions: "" })}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 relative group">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                  <Input {...register(`cargoDetails.items.${index}.description` as const)} placeholder="Item name..." className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pkgs</label>
                  <Input type="number" {...register(`cargoDetails.items.${index}.noOfPackages` as const, { valueAsNumber: true })} placeholder="0" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Gross Wt</label>
                  <Input type="number" step="0.01" {...register(`cargoDetails.items.${index}.grossWeight` as const, { valueAsNumber: true })} placeholder="0.00" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Net Wt</label>
                  <Input type="number" step="0.01" {...register(`cargoDetails.items.${index}.netWeight` as const, { valueAsNumber: true })} placeholder="0.00" className="h-9" />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Vol. Wt</label>
                  <Input type="number" step="0.01" {...register(`cargoDetails.items.${index}.volumetricWeight` as const, { valueAsNumber: true })} placeholder="0.00" className="h-9" />
                  {!isReadOnly && fields.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="absolute -right-2 -top-2 p-1 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Dimensions (L x W x H)</label>
                  <Input {...register(`cargoDetails.items.${index}.dimensions` as const)} placeholder="e.g. 120x80x100 cm" className="h-9" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOTALS DISPLAY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary uppercase">Total Pkgs</span>
            <div className="text-lg font-bold">{totals.pkgs}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary uppercase">Total Gross</span>
            <div className="text-lg font-bold">{totals.gross} kg</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary uppercase">Total Net</span>
            <div className="text-lg font-bold">{totals.net} kg</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary uppercase">Total Volumetric</span>
            <div className="text-lg font-bold">{totals.vol} kg</div>
          </div>
        </div>

        {/* DATES */}
        <div className="grid md:grid-cols-2 gap-6 pt-4">
          <FormField
            control={control}
            name="cargoDetails.etd"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Estimated Time of Departure (ETD)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button" 
                      variant={"outline"}
                      className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                    >
                      {field.value ? new Date(field.value).toLocaleDateString() : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="cargoDetails.eta"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Estimated Time of Arrival (ETA)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                    >
                      {field.value ? new Date(field.value).toLocaleDateString() : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

      </Card>
    </section>
  )
}
