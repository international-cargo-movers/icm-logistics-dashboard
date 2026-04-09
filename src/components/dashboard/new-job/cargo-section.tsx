"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { JobFormValues } from "@/app/dashboard/new-job/page" // Adjust path if needed
import { CalendarIcon } from "lucide-react"

export default function CargoSection() {
  const { control } = useFormContext<JobFormValues>()

  return (
    <section>
      <h2 className="section-title text-xl font-bold mb-4">Cargo Specifications</h2>

      <Card className="p-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* COMMODITY */}
        <FormField
          control={control}
          name="cargoDetails.commodity"
          render={({ field }:{field:any}) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Commodity</FormLabel>
              <FormControl>
                <Input placeholder="Enter commodity..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PACKAGE COUNT */}
        <FormField
          control={control}
          name="cargoDetails.packageCount"
          render={({ field }:{field:any}) => (
            <FormItem>
              <FormLabel>Package Count</FormLabel>
              <FormControl>
                {/* We use onChange to ensure it parses as a number if needed */}
                <Input 
                  type="number" 
                  placeholder="0" 
                  {...field} 
                  onChange={(e) => field.onChange(e.target.valueAsNumber || e.target.value)} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* GROSS WEIGHT */}
        <FormField
          control={control}
          name="cargoDetails.grossWeight"
          render={({ field }:{field:any}) => (
            <FormItem>
              <FormLabel>Gross Weight (kg)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ETD DATE PICKER */}
        <FormField
          control={control}
          name="cargoDetails.etd"
          render={({ field }:{field:any}) => (
            <FormItem className="flex flex-col mt-2">
              <FormLabel>Estimated Time of Departure (ETD)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  {/* CRITICAL FIX: We removed <FormControl> so the click event doesn't get swallowed! */}
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
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ETA DATE PICKER */}
        <FormField
          control={control}
          name="cargoDetails.eta"
          render={({ field }:{field:any}) => (
            <FormItem className="flex flex-col mt-2">
              <FormLabel>Estimated Time of Arrival (ETA)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  {/* CRITICAL FIX: Removed <FormControl> */}
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
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

      </Card>
    </section>
  )
}