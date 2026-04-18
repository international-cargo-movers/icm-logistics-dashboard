"use client"

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";

// Import your Document Workshop
import DocumentWorkshop from "@/components/dashboard/shipping-docs/DocumentWorkshop";

// TODO: Import your existing creation sections here
// import PartiesSection from "@/components/dashboard/jobs/PartiesSection";
// import CargoSection from "@/components/dashboard/jobs/CargoSection";

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
                return json.data;
            }
            return {};
        }
    });

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/jobs/${jobId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            
            if (json.success) {
                // Redirect back to the Job Details page or Job List
                router.push(`/dashboard/jobs/${json.data.jobId}`);
            } else {
                alert("Failed to update job: " + json.error);
            }
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-500 animate-pulse">
                Loading job data...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">Edit Freight Job</h1>
                </div>
                <Button 
                    onClick={methods.handleSubmit(onSubmit)} 
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* The Form Provider wraps everything so sections can share data */}
            <FormProvider {...methods}>
                <form className="space-y-8" onSubmit={methods.handleSubmit(onSubmit)}>
                    
                    {/* 1. Standard Job Details */}
                    <div className="space-y-8">
                        {/* Replace these placeholders with your actual components */}
                        {/* <PartiesSection /> */}
                        {/* <CargoSection /> */}
                        
                        <div className="p-6 bg-slate-50 border rounded-xl text-center text-slate-500 text-sm">
                            (Insert your existing PartiesSection and CargoSection components here)
                        </div>
                    </div>

                    {/* 2. Legal Documentation (BoL / AWB) */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Legal Documentation</h3>
                        <p className="text-sm text-slate-500 mb-4">Update marks, seal numbers, and AWB details for document generation.</p>
                        <DocumentWorkshop />
                    </div>

                </form>
            </FormProvider>
        </div>
    );
}