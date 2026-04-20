"use client"

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AddReceiptProps {
    companyId: string;
    onSuccess?: () => void; // Optional callback to trigger a ledger refresh
}

export default function AddReceiptForm({ companyId, onSuccess }: AddReceiptProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            receiptNo: "",
            date: new Date().toISOString().split('T')[0], // Defaults to today
            amount: "",
            paymentMode: "Bank Transfer",
            referenceNumber: "",
            notes: ""
        }
    });

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                companyId,
                amount: Number(data.amount) // Ensure amount is passed as a number
            };

            const res = await fetch("/api/receipts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (json.success) {
                toast.success("Payment recorded successfully.");
                reset(); // Clear the form
                if (onSuccess) onSuccess(); // Trigger Ledger table refresh
                router.refresh();
            } else {
                toast.error(`Failed to record payment: ${json.error}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="p-6 bg-slate-50 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Log Incoming Payment</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Receipt Number */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Receipt No.</label>
                        <input 
                            {...register("receiptNo", { required: true })} 
                            className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm font-mono" 
                            placeholder="REC-2026-001" 
                        />
                    </div>

                    {/* Date */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Date</label>
                        <input 
                            type="date"
                            {...register("date", { required: true })} 
                            className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm" 
                        />
                    </div>

                    {/* Amount */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Amount (₹)</label>
                        <input 
                            type="number"
                            step="0.01"
                            {...register("amount", { required: true, min: 1 })} 
                            className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm font-bold text-emerald-700" 
                            placeholder="0.00" 
                        />
                    </div>

                    {/* Payment Mode */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Mode</label>
                        <select 
                            {...register("paymentMode")} 
                            className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm"
                        >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
                            <option value="Cash">Cash</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reference Number */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Reference / UTR / Cheque No.</label>
                        <input 
                            {...register("referenceNumber")} 
                            className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm" 
                            placeholder="e.g. UTR NO. SBIN12345678" 
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Internal Notes (Optional)</label>
                        <input 
                            {...register("notes")} 
                            className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm" 
                            placeholder="Settlement for Job #1234" 
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button 
                        type="submit" 
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {saving ? "Recording..." : "Record Payment"}
                    </Button>
                </div>
            </form>
        </Card>
    );
}