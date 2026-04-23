"use client"

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

// Import sections from the new-job component directory
import RoutingSection from "@/components/dashboard/new-job/routing-section";
import PartiesSection from "@/components/dashboard/new-job/parties-section";
import CargoSection from "@/components/dashboard/new-job/cargo-section";
import VendorSection from "@/components/dashboard/new-job/vendor-section";
import DocumentWorkshop from "@/components/dashboard/shipping-docs/DocumentWorkshop";

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Initialize the form
    const methods = useForm({
        defaultValues: async () => {
            const res = await fetch(`/api/jobs/${jobId}`);
            const json = await res.json();
            setLoading(false);
            if (json.success) {
                const data = json.data;
                
                // MIGRATION HELPER: Map DB fields to Form fields for Routing Section
                if (data.shipmentDetails) {
                    data.shipmentDetails = {
                        ...data.shipmentDetails,
                        originCountry: data.shipmentDetails.polCountry,
                        originPort: data.shipmentDetails.portOfLoading,
                        destinationCountry: data.shipmentDetails.podCountry,
                        destinationPort: data.shipmentDetails.portOfDischarge,
                    };
                }

                // MIGRATION HELPER: Map Party IDs for Parties Section
                if (data.partyDetails) {
                    data.partyDetails = {
                        ...data.partyDetails,
                        shipperId: data.partyDetails.shipperId?._id || data.partyDetails.shipperId,
                        consigneeId: data.partyDetails.consigneeId?._id || data.partyDetails.consigneeId,
                        notifyPartyId: data.partyDetails.notifyPartyId?._id || data.partyDetails.notifyPartyId,
                        overseasAgentId: data.partyDetails.overseasAgentId?._id || data.partyDetails.overseasAgentId,
                    };
                }
                
                // MIGRATION HELPER: Convert old single-cargo jobs to new items format
                if (data.cargoDetails && (!data.cargoDetails.items || data.cargoDetails.items.length === 0)) {
                    data.cargoDetails.items = [{
                        description: data.cargoDetails.commodity || "Initial Item",
                        noOfPackages: data.cargoDetails.noOfPackages || 0,
                        grossWeight: data.cargoDetails.grossWeight || 0,
                        netWeight: data.cargoDetails.netWeight || 0,
                        volumetricWeight: data.cargoDetails.volumetricWeight || 0,
                        dimensions: data.cargoDetails.dimensions || ""
                    }];
                }
                
                return data;
            }
            return {};
        }
    });

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            // Recalculate totals before saving to be absolutely sure
            const items = data.cargoDetails?.items || [];
            const totals = items.reduce((acc: any, item: any) => {
                acc.pkgs += Number(item.noOfPackages || 0);
                acc.gross += Number(item.grossWeight || 0);
                acc.net += Number(item.netWeight || 0);
                acc.vol += Number(item.volumetricWeight || 0);
                return acc;
            }, { pkgs: 0, gross: 0, net: 0, vol: 0 });

            data.cargoDetails.totalNoOfPackages = totals.pkgs;
            data.cargoDetails.totalGrossWeight = totals.gross;
            data.cargoDetails.totalNetWeight = totals.net;
            data.cargoDetails.totalVolumetricWeight = totals.vol;

            const res = await fetch(`/api/jobs/${jobId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            
            if (json.success) {
                toast.success("Job updated successfully!");
                router.push(`/dashboard/jobs/${json.data.jobId}`);
            } else {
                toast.error("Failed to update job: " + json.error);
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-bold text-slate-500">Hydrating Freight Job...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#F8FAFC] min-h-screen overflow-y-auto px-12 py-10">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-sm z-10 pb-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="hover:bg-white" onClick={() => router.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Edit Job: {methods.getValues("jobId")}</h1>
                            <p className="text-slate-500 text-sm font-medium">Update routing, cargo, and legal documents.</p>
                        </div>
                    </div>
                    <Button 
                        onClick={methods.handleSubmit(onSubmit)} 
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        {saving ? "Saving Changes..." : "Commit All Updates"}
                    </Button>
                </div>

                {/* The Form Provider wraps everything so sections can share data */}
                <FormProvider {...methods}>
                    <form className="space-y-12" onSubmit={methods.handleSubmit(onSubmit)}>
                        
                        {/* 1. Routing Section */}
                        <RoutingSection />

                        {/* 2. Parties Section */}
                        <PartiesSection />

                        {/* 3. Cargo Section (Updated for Multiple Items) */}
                        <CargoSection />

                        {/* 4. Vendor Section */}
                        <VendorSection />

                        {/* 5. Legal Documentation (BoL / AWB) */}
                        <div className="space-y-6 pt-6 border-t border-slate-200">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Legal Documentation</h3>
                                <p className="text-sm text-slate-500">Update marks, seal numbers, and AWB details for document generation.</p>
                            </div>
                            <DocumentWorkshop />
                        </div>

                    </form>
                </FormProvider>
            </div>
        </div>
    );
}
