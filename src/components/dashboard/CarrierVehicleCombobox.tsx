"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { 
  Combobox, 
  ComboboxInput, 
  ComboboxContent, 
  ComboboxList, 
  ComboboxItem, 
  ComboboxEmpty 
} from "@/components/ui/combobox"
import { Ship, Plane, Plus } from "lucide-react"

interface CarrierVehicleComboboxProps {
  name: string; // Form field name
  type?: "Sea" | "Air"; // Filter by type
  placeholder?: string;
  className?: string;
}

export default function CarrierVehicleCombobox({ 
  name, 
  type, 
  placeholder = "Search or register carrier...",
  className
}: CarrierVehicleComboboxProps) {
  const { control, setValue, watch } = useFormContext();
  const currentValue = watch(name) || "";
  
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState(currentValue);
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (currentValue && !search) {
      setSearch(currentValue);
    }
  }, [currentValue]);

  React.useEffect(() => {
    async function fetchVehicles() {
      setIsLoading(true);
      try {
        const query = new URLSearchParams();
        if (type) query.append("type", type);
        const res = await fetch(`/api/carrier-vehicles?${query.toString()}`);
        const json = await res.json();
        if (json.success) setVehicles(json.data);
      } catch (error) {
        console.error("Failed to fetch carrier vehicles:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchVehicles();
  }, [type]);

  const handleSelect = (val: string) => {
    setValue(name, val, { shouldValidate: true });
    setOpen(false);
  };

  const handleRegisterNew = async () => {
    const normalizedSearch = search.toUpperCase();
    if (!normalizedSearch || !type) return;
    
    try {
      const res = await fetch("/api/carrier-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedSearch, type })
      });
      const json = await res.json();
      if (json.success) {
        // Add to local list and select
        setVehicles(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)));
        handleSelect(json.data.name);
      }
    } catch (error) {
      console.error("Failed to register carrier:", error);
    }
  };

  return (
    <Combobox
      open={open}
      onOpenChange={setOpen}
      value={currentValue}
      inputValue={search}
      onValueChange={(val) => val && handleSelect(val)}
      onInputValueChange={setSearch}
    >
      <ComboboxInput 
        showTrigger 
        placeholder={placeholder}
        className={className}
        onBlur={() => {
            if (search && !vehicles.some(v => v.name === search)) {
                // If the user tabbed out with a custom value, set it
                setValue(name, search.toUpperCase());
            }
        }}
      />
      <ComboboxContent>
        <ComboboxList>
          {vehicles.map((v) => (
            <ComboboxItem key={v._id} value={v.name}>
              <div className="flex items-center gap-2">
                {v.type === "Sea" ? <Ship className="w-3 h-3 text-blue-500" /> : <Plane className="w-3 h-3 text-sky-500" />}
                <span>{v.name}</span>
                {v.carrierName && <span className="text-[10px] text-slate-400">({v.carrierName})</span>}
              </div>
            </ComboboxItem>
          ))}
          <ComboboxEmpty>
            {search ? (
              <div 
                onClick={handleRegisterNew}
                className="p-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 border-t mt-1"
              >
                <Plus className="w-4 h-4" />
                Register & Use "{search.toUpperCase()}"
              </div>
            ) : (
              <div className="p-4 text-xs text-slate-400 text-center">No carriers found</div>
            )}
          </ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
