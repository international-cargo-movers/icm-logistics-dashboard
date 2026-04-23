"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"

interface EntityData {
    name?: string
    taxId?: string
    streetAddress?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    defaultSalesPerson?: string
    salesPerson?: string
}

interface EntitySwitcherProps {
    client: {
        companyId?: EntityData
        taxId?: string
        streetAddress?: string
        city?: string
        state?: string
        zipCode?: string
        country?: string
        salesPerson?: string
    }
    consignee: EntityData
}

export default function EntitySwitcher({ client, consignee }: EntitySwitcherProps) {
    const [activeTab, setActiveTab] = useState<"client" | "consignee">("client")

    const clientData = {
        name: client.companyId?.name || "Unknown Company",
        taxId: client.taxId || client.companyId?.taxId || "N/A",
        streetAddress: client.streetAddress || client.companyId?.streetAddress || "—",
        city: client.city || client.companyId?.city || "—",
        state: client.state || client.companyId?.state || "—",
        zipCode: client.zipCode || client.companyId?.zipCode || "—",
        country: client.country || client.companyId?.country || "—",
        salesPerson: client.salesPerson || client.companyId?.defaultSalesPerson || "—"
    }

    const consigneeData = {
        name: consignee?.name || "Unknown Company",
        taxId: consignee?.taxId || "N/A",
        streetAddress: consignee?.streetAddress || "—",
        city: consignee?.city || "—",
        state: consignee?.state || "—",
        zipCode: consignee?.zipCode || "—",
        country: consignee?.country || "—",
        salesPerson: consignee?.defaultSalesPerson || "—"
    }

    const EntityInfo = ({ data }: { data: typeof clientData }) => (
        <div className="p-6 w-full shrink-0">
            <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg font-bold text-lg shrink-0">
                    {data.name?.substring(0, 2).toUpperCase() || "??"}
                </div>
                <div className="overflow-hidden">
                    <h3 className="font-bold text-foreground text-lg truncate" title={data.name}>
                        {data.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                        Tax ID: <span className="font-mono text-primary font-medium">{data.taxId}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Street Address</p>
                    <p className="text-sm font-medium text-foreground leading-snug">
                        {data.streetAddress}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">City</p>
                    <p className="text-sm font-medium text-foreground leading-snug">
                        {data.city}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">State / Prov</p>
                    <p className="text-sm font-medium text-foreground leading-snug">
                        {data.state}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Zip Code</p>
                    <p className="text-sm font-medium text-foreground leading-snug">
                        {data.zipCode}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Country</p>
                    <p className="text-sm font-medium text-foreground leading-snug">
                        {data.country}
                    </p>
                </div>

                <div className="col-span-2 mt-1 pt-5 border-t">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Sales Person</p>
                    <p className="text-sm font-medium text-foreground">
                        {data.salesPerson}
                    </p>
                </div>
            </div>
        </div>
    )

    return (
        <Card className="border border-border shadow-sm border-t-4 border-t-primary overflow-hidden">
            {/* Minimalist Rounded Tab Headers */}
            <div className="flex justify-center gap-2 p-3 bg-muted/20 border-b">
                <button
                    onClick={() => setActiveTab("client")}
                    className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${
                        activeTab === "client" 
                        ? "bg-primary-container text-on-primary shadow-sm scale-105" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    Client
                </button>
                <button
                    onClick={() => setActiveTab("consignee")}
                    className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${
                        activeTab === "consignee" 
                        ? "bg-primary-container text-on-primary shadow-sm scale-105" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    Consignee
                </button>
            </div>

            {/* Sliding Container */}
            <div className="relative overflow-hidden">
                <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(${activeTab === "client" ? "0%" : "-100%"})` }}
                >
                    <EntityInfo data={clientData} />
                    <EntityInfo data={consigneeData} />
                </div>
            </div>
        </Card>
    )
}
