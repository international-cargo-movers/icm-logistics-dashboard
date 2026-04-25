"use client"

import React, { useEffect, useState, forwardRef, useCallback } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
    value?: string;
    onChange?: (e: any) => void;
    onBlur?: (e: any) => void;
    placeholder?: string;
    className?: string;
    name?: string;
}

/**
 * A specialized combobox input for financial line item descriptions.
 * Fetches unique descriptions from the admin database and allows free text input.
 * Automatically saves new descriptions to the admin database.
 */
export const LineItemDescriptionInput = forwardRef<HTMLInputElement, Props>(({ 
    value = "", 
    onChange, 
    onBlur,
    placeholder, 
    className,
    name,
    ...rest
}, ref) => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState(value);

    // Sync internal state with prop value
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const fetchItems = useCallback(async () => {
        try {
            const res = await fetch('/api/financial-items');
            const json = await res.json();
            if (json.success) {
                setItems(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch financial items', err);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const saveItem = async (nameToSave: string) => {
        if (!nameToSave || nameToSave.trim() === "" || items.includes(nameToSave.trim())) return;
        
        try {
            await fetch('/api/financial-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameToSave.trim() }),
            });
            // Refresh items list
            fetchItems();
        } catch (err) {
            console.error('Failed to save financial item', err);
        }
    };

    const handleSelect = (currentValue: string) => {
        const newValue = currentValue;
        setInputValue(newValue);
        
        // Trigger onChange for both react-hook-form and standard usage
        if (onChange) {
            const event = {
                target: {
                    name,
                    value: newValue
                }
            };
            onChange(event);
        }
        
        setOpen(false);
        saveItem(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        if (onChange) onChange(e);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (onBlur) onBlur(e);
        saveItem(inputValue);
    };

    return (
        <div className="relative w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <div className="flex items-center w-full">
                    <input
                        {...rest}
                        ref={ref}
                        name={name}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        placeholder={placeholder}
                        className={cn("w-full pr-8", className)}
                        autoComplete="off"
                    />
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <ChevronsUpDown className="h-4 w-4" />
                        </button>
                    </PopoverTrigger>
                </div>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search descriptions..." />
                        <CommandList>
                            <CommandEmpty>No suggestions found.</CommandEmpty>
                            <CommandGroup heading="Recent Descriptions">
                                {items.map((item) => (
                                    <CommandItem
                                        key={item}
                                        value={item}
                                        onSelect={() => handleSelect(item)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                inputValue === item ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {item}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
});

LineItemDescriptionInput.displayName = "LineItemDescriptionInput";
