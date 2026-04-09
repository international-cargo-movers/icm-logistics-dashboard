"use client"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const companies = [
  { label: "Global Logistics Co.", value: "gl" },
  { label: "FastFreight Inc.", value: "ff" },
]

// 1. Accept the form field props
export default function Combobox({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value ? companies.find(c => c.value === value)?.label : "Search existing or type new..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-full">
        <Command>
          <CommandInput placeholder="Search company..." />
          <CommandList>
            {companies.map((c) => (
              <CommandItem
                key={c.value}
                value={c.value}
                onSelect={(currentValue) => {
                  // 2. Call the onChange from React Hook Form instead of local state
                  onChange(currentValue === value ? "" : currentValue)
                  setOpen(false)
                }}
              >
                <Check className={`mr-2 h-4 w-4 ${value === c.value ? "opacity-100" : "opacity-0"}`} />
                {c.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}