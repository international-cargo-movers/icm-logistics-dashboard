import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { ArrowRight } from "lucide-react"

export default function RoutingSection() {
  // 1. Grab the form control from the master form
  const { control } = useFormContext()

  return (
    <section>
      <h2 className="section-title text-xl font-bold mb-4">Shipment Routing</h2>

      <Card className="p-8 grid lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-3">
          {/* 2. Wire up the Select dropdown */}
          <FormField
            control={control}
            name="shipmentDetails.mode"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormLabel>Transport Mode *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Sea LCL Import">Sea LCL Import</SelectItem>
                    <SelectItem value="Sea LCL Export">Sea LCL Export</SelectItem>
                    <SelectItem value="Sea FCL Import">Sea FCL Import</SelectItem>
                    <SelectItem value="Sea FCL Export">Sea FCL Export</SelectItem>
                    <SelectItem value="Air Import">Air Import</SelectItem>
                    <SelectItem value="Air Export">Air Export</SelectItem>
                    <SelectItem value="Courier Import">Courier Import</SelectItem>
                    <SelectItem value="Courier Export">Courier Export</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="lg:col-span-4">
          <FormField
            control={control}
            name="shipmentDetails.originPort"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormLabel>Origin Port</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. CNSHA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-center pb-2">
          <ArrowRight className="text-muted-foreground" />
        </div>

        <div className="lg:col-span-4">
          <FormField
            control={control}
            name="shipmentDetails.destinationPort"
            render={({ field }:{field:any}) => (
              <FormItem>
                <FormLabel>Destination Port</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. NLRTM" {...field} />
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