"use client"

import React, { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Wallet, Calendar, Hash, FileText } from "lucide-react"

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoiceData: {
        id: string;
        invoiceNo: string;
        totalAmount: number;
        balanceDue: number;
        type: "Customer" | "Vendor";
    } | null;
}

export default function RecordPaymentModal({ isOpen, onClose, onSuccess, invoiceData }: RecordPaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: "Bank Transfer",
        referenceNo: "",
        notes: ""
    });

    // Reset form when modal opens with new invoice data
    React.useEffect(() => {
        if (invoiceData) {
            setFormData({
                amount: invoiceData.balanceDue.toString(),
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMode: "Bank Transfer",
                referenceNo: "",
                notes: ""
            });
        }
    }, [invoiceData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceData) return;

        if (Number(formData.amount) <= 0) {
            return toast.error("Please enter a valid amount.");
        }

        if (Number(formData.amount) > invoiceData.balanceDue) {
            toast.warning(`Note: Amount exceeds balance due (${invoiceData.balanceDue}).`);
        }

        setLoading(true);
        try {
            const res = await fetch("/api/receipts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    invoiceId: invoiceData.id,
                    type: invoiceData.type
                })
            });
            const json = await res.json();

            if (json.success) {
                toast.success("Payment recorded successfully!");
                onSuccess();
                onClose();
            } else {
                toast.error(json.error || "Failed to record payment.");
            }
        } catch (error) {
            toast.error("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!invoiceData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-slate-50 p-8 border-b border-slate-100">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${invoiceData.type === 'Customer' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                                <Wallet className="h-5 w-5" />
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${invoiceData.type === 'Customer' ? 'text-blue-600' : 'text-rose-600'}`}>
                                Settlement Entry
                            </p>
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tighter">Record Payment</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Logging transaction for <span className="font-black text-slate-900">{invoiceData.invoiceNo}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bill</p>
                            <p className="font-black text-slate-900">₹{invoiceData.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Balance Due</p>
                            <p className="font-black text-amber-700">₹{invoiceData.balanceDue.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount Received (₹)</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <Input 
                                    type="number" 
                                    required 
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    className="bg-slate-50 border-none rounded-xl py-6 pl-8 font-black text-lg focus-visible:ring-blue-600"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Date</Label>
                                <Input 
                                    type="date" 
                                    required 
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                                    className="bg-slate-50 border-none rounded-xl py-6 font-bold focus-visible:ring-blue-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mode</Label>
                                <Select 
                                    value={formData.paymentMode} 
                                    onValueChange={(val) => setFormData({...formData, paymentMode: val})}
                                >
                                    <SelectTrigger className="bg-slate-50 border-none rounded-xl py-6 font-bold focus:ring-blue-600">
                                        <SelectValue placeholder="Select Mode" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl font-bold">
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Reference / UTR No.</Label>
                            <Input 
                                required 
                                value={formData.referenceNo}
                                onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
                                className="bg-slate-50 border-none rounded-xl py-6 font-mono font-bold focus-visible:ring-blue-600 uppercase"
                                placeholder="UTR123456789"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Private Notes</Label>
                            <Input 
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                className="bg-slate-50 border-none rounded-xl py-6 font-bold focus-visible:ring-blue-600"
                                placeholder="Optional details..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={onClose}
                            className="flex-1 py-7 rounded-2xl font-bold text-slate-500 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className={`flex-1 py-7 rounded-2xl font-black shadow-xl transition-all border-none ${invoiceData.type === 'Customer' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'}`}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Commit Settlement"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
