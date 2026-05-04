"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Anchor, Plane, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AddPortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (port: any) => void;
  defaultCountry?: { name: string, code: string };
  defaultType?: "Sea" | "Air";
  initialName?: string;
}

export function AddPortModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  defaultCountry, 
  defaultType = "Sea",
  initialName = ""
}: AddPortModalProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: initialName,
    locode: "",
    country: defaultCountry?.name || "",
    countryCode: defaultCountry?.code || "",
    type: [defaultType]
  })

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      name: initialName,
      country: defaultCountry?.name || prev.country,
      countryCode: defaultCountry?.code || prev.countryCode,
      type: [defaultType]
    }))
  }, [initialName, defaultCountry, defaultType])

  const handleSave = async () => {
    if (!formData.name) return toast.error("Port name is required.");
    if (!formData.country || !formData.countryCode) return toast.error("Country details are required.");

    setIsLoading(true)
    try {
      const res = await fetch("/api/ports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Port "${formData.name}" added to master directory.`)
        onSuccess(json.data)
        onClose()
      } else {
        toast.error(json.error || "Failed to add port")
      }
    } catch (error) {
      toast.error("An error occurred while saving the port.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleType = (t: string) => {
    setFormData(prev => ({
      ...prev,
      type: prev.type.includes(t as any) 
        ? prev.type.filter(item => item !== t) 
        : [...prev.type, t]
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Port</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Port Name *</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Nhava Sheva"
              className="bg-muted/50 border-none"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="locode" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">UN/LOCODE (Optional)</Label>
            <Input 
              id="locode" 
              value={formData.locode} 
              onChange={(e) => setFormData({ ...formData, locode: e.target.value.toUpperCase() })}
              placeholder="e.g. INNSA"
              maxLength={5}
              className="bg-muted/50 border-none font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Country *</Label>
              <Input 
                value={formData.country} 
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="India"
                className="bg-muted/50 border-none"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Code *</Label>
              <Input 
                value={formData.countryCode} 
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                placeholder="IN"
                maxLength={2}
                className="bg-muted/50 border-none"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Capability</Label>
            <div className="flex gap-2">
              <Button 
                type="button"
                variant={formData.type.includes("Sea") ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => toggleType("Sea")}
              >
                <Anchor className="h-4 w-4" /> Sea
              </Button>
              <Button 
                type="button"
                variant={formData.type.includes("Air") ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => toggleType("Air")}
              >
                <Plane className="h-4 w-4" /> Air
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save to Directory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
