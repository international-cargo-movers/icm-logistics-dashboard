"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { PlusCircle, Trash2, Save, X, FileText, Receipt, Package, Truck, User } from "lucide-react"
import { pdf } from '@react-pdf/renderer'
import VendorBillPDF from '@/components/dashboard/vendor-bills/VendorBillPDF'

import { Form } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

// --- UTILITY: Number to Words ---
function numberToWords(num: number): string {
    if (num === 0) return "Zero";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const convert = (n: number): string => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
        if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
        return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
    };
    const wholeNumber = Math.floor(num);
    const decimal = Math.round((num - wholeNumber) * 100);
    return `INR ${convert(wholeNumber)} ${decimal > 0 ? ` & ${decimal}/100` : ""} Only`;
}

// --- SCHEMA ---
const vendorBillSchema = z.object({
    billNo: z.string().min(1, "Required"),
    billDate: z.string(),
    jobId: z.string().min(1, "Required"),
    jobReference: z.string().min(1, "Required"),
    
    seller: z.object({
        vendorId: z.string().min(1, "Required"),
        name: z.string().min(1, "Required"),
        address: z.string().min(1, "Required"),
        gstin: z.string().optional(),
        stateName: z.string().optional(),
        stateCode: z.string().optional(),
        email: z.string().optional(),
    }),

    consignee: z.object({
        name: z.string().optional(),
        address: z.string().optional(),
        gstin: z.string().optional(),
        stateName: z.string().optional(),
        stateCode: z.string().optional(),
    }),

    buyer: z.object({
        name: z.string().optional(),
        address: z.string().optional(),
        gstin: z.string().optional(),
        stateName: z.string().optional(),
        stateCode: z.string().optional(),
        placeOfSupply: z.string().optional(),
    }),

    shipping: z.object({
        deliveryNote: z.string().optional(),
        modeTermsOfPayment: z.string().optional(),
        referenceNoAndDate: z.string().optional(),
        otherReferences: z.string().optional(),
        buyersOrderNo: z.string().optional(),
        buyersOrderDated: z.string().optional(),
        dispatchDocNo: z.string().optional(),
        deliveryNoteDate: z.string().optional(),
        dispatchedThrough: z.string().optional(),
        destination: z.string().optional(),
        vesselFlightNo: z.string().optional(),
        placeOfReceiptByShipper: z.string().optional(),
        portOfLoading: z.string().optional(),
        portOfDischarge: z.string().optional(),
        termsOfDelivery: z.string().optional(),
    }),

    lineItems: z.array(z.object({
        description: z.string().min(1),
        hsnSac: z.string(),
        quantityShipped: z.coerce.number().min(0),
        quantityBilled: z.coerce.number().min(0.01),
        unit: z.string().default("PCS"),
        rate: z.coerce.number().min(0),
        gstPercent: z.coerce.number().min(0),
    })).min(1),
})

type VendorBillFormValues = z.infer<typeof vendorBillSchema>

export default function NewVendorBillPage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [jobs, setJobs] = React.useState<any[]>([])

    // Subtle UI Abstraction: Silent redirect if not authorized
    React.useEffect(() => {
        if (status === "loading") return
        const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
        if (!userRoles.some(r => ["SuperAdmin", "Finance", "Operations"].includes(r))) {
            router.push("/dashboard")
        }
    }, [session, status, router])

    const [vendors, setVendors] = React.useState<any[]>([])

    if (status === "loading") {
        return (
            <div className="bg-slate-50 min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-blue-600/20 rounded-2xl"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded-full"></div>
                </div>
            </div>
        )
    }
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const form = useForm<VendorBillFormValues>({
        resolver: zodResolver(vendorBillSchema) as any,
        defaultValues: {
            billNo: `VBILL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            billDate: new Date().toISOString().split('T')[0],
            jobId: "", jobReference: "",
            seller: { vendorId: "", name: "", address: "", gstin: "", stateName: "", stateCode: "", email: "" },
            consignee: { name: "", address: "", gstin: "", stateName: "", stateCode: "" },
            buyer: { name: "INTERNATIONAL CARGO MOVERS", address: "NEW DELHI", gstin: "", stateName: "Delhi", stateCode: "07", placeOfSupply: "Delhi" },
            shipping: { 
                deliveryNote: "", modeTermsOfPayment: "", referenceNoAndDate: "", otherReferences: "", 
                buyersOrderNo: "", buyersOrderDated: "", dispatchDocNo: "", deliveryNoteDate: "", 
                dispatchedThrough: "", destination: "", vesselFlightNo: "", placeOfReceiptByShipper: "", 
                portOfLoading: "", portOfDischarge: "", termsOfDelivery: "" 
            },
            lineItems: [{ description: "", hsnSac: "", quantityShipped: 1, quantityBilled: 1, unit: "PCS", rate: 0, gstPercent: 18 }]
        }
    })

    const { control, watch, setValue, register, handleSubmit } = form
    const { fields, append, remove, replace } = useFieldArray({ control, name: "lineItems" })

    React.useEffect(() => {
        async function fetchData() {
            try {
                const [jobRes, vendorRes] = await Promise.all([
                    fetch("/api/jobs"),
                    fetch("/api/companies?type=Vendor")
                ])
                const jobJson = await jobRes.json()
                const vendorJson = await vendorRes.json()
                if (jobJson.success) setJobs(jobJson.data)
                if (vendorJson.success) setVendors(vendorJson.data)
            } catch (error) { toast.error("Failed to load dependency data.") }
        }
        fetchData()
    }, [])

    const handleJobSelect = (jobRef: string) => {
        const job = jobs.find(j => j.jobId === jobRef)
        if (!job) return

        setValue("jobId", job._id)
        setValue("jobReference", job.jobId)

        // Pre-fill shipping from job
        setValue("shipping.portOfLoading", job.shipmentDetails?.portOfLoading || "")
        setValue("shipping.portOfDischarge", job.shipmentDetails?.portOfDischarge || "")
        setValue("shipping.destination", job.shipmentDetails?.destination || "")
        setValue("shipping.vesselFlightNo", job.cargoDetails?.carrier || "")

        // Pre-fill vendor if available
        if (job.vendorDetails?.length > 0) {
            const vData = job.vendorDetails[0].vendorId;
            // vData might be populated or just an ID
            const vendor = typeof vData === 'object' ? vData : vendors.find(v => v._id === vData);
            
            if (vendor) {
                setValue("seller.vendorId", vendor._id);
                setValue("seller.name", vendor.name);
                const addr = [vendor.streetAddress, vendor.city, vendor.state].filter(Boolean).join(", ") + (vendor.zipCode ? ` - ${vendor.zipCode}` : "");
                setValue("seller.address", addr);
                setValue("seller.gstin", vendor.taxId || "");
                setValue("seller.stateName", vendor.state || "");
                setValue("seller.stateCode", "07"); 
            }
        }

        // Pre-fill Consignee from Job
        if (job.partyDetails?.consigneeId) {
            const c = job.partyDetails.consigneeId;
            setValue("consignee.name", c.name || "");
            const addr = [c.streetAddress, c.city, c.state].filter(Boolean).join(", ") + (c.zipCode ? ` - ${c.zipCode}` : "");
            setValue("consignee.address", addr);
            setValue("consignee.gstin", c.taxId || "");
        }

        // Pre-fill Buyer from Job
        if (job.customerDetails?.companyId) {
            const b = job.customerDetails.companyId;
            setValue("buyer.name", b.name || "");
            const addr = [b.streetAddress, b.city, b.state].filter(Boolean).join(", ") + (b.zipCode ? ` - ${b.zipCode}` : "");
            setValue("buyer.address", addr);
            setValue("buyer.gstin", b.taxId || "");
        }

        // Pull Goods from Job
        if (job.cargoDetails?.items && job.cargoDetails.items.length > 0) {
            const billItems = job.cargoDetails.items.map((item: any) => ({
                description: item.description || job.cargoDetails?.commodity || "Goods",
                hsnSac: item.hsnCode || "",
                quantityShipped: Number(item.noOfPackages) || 0,
                quantityBilled: Number(item.noOfPackages) || 0,
                unit: item.packageUnit || "PCS",
                rate: 0,
                gstPercent: 18
            }));
            replace(billItems);
        } else if (job.cargoDetails?.commodity) {
            replace([{
                description: job.cargoDetails.commodity,
                hsnSac: "",
                quantityShipped: Number(job.cargoDetails.totalNoOfPackages) || 0,
                quantityBilled: Number(job.cargoDetails.totalNoOfPackages) || 0,
                unit: "PCS",
                rate: 0,
                gstPercent: 18
            }]);
        }
    }

    const lineItems = watch("lineItems") || []
    const totals = lineItems.reduce((acc, item) => {
        const taxable = (item.rate || 0) * (item.quantityBilled || 0);
        const gst = taxable * ((item.gstPercent || 0) / 100);
        return { taxable: acc.taxable + taxable, gst: acc.gst + gst, net: acc.net + taxable + gst };
    }, { taxable: 0, gst: 0, net: 0 })

    async function onSubmit(data: VendorBillFormValues) {
        setIsSubmitting(true)
        try {
            const payload = {
                billNo: data.billNo,
                billDate: data.billDate,
                jobId: data.jobId,
                jobReference: data.jobReference,
                sellerDetails: data.seller,
                consigneeDetails: data.consignee,
                buyerDetails: data.buyer,
                shippingDetails: data.shipping,
                lineItems: data.lineItems,
                totals: {
                    totalTaxableValue: totals.taxable,
                    totalTaxAmount: totals.gst,
                    netAmount: totals.net,
                    amountInWords: numberToWords(totals.net),
                    taxAmountInWords: numberToWords(totals.gst)
                },
                status: "Unpaid"
            }

            const res = await fetch("/api/vendor-bills", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            })
            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            toast.success("Vendor Goods Bill Created!")
            router.push("/dashboard/vendor-bills")
        } catch (error: any) { toast.error(error.message) }
        finally { setIsSubmitting(false) }
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Toolbar */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-600">New Vendor Goods Bill</span>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 font-bold"><X size={18} className="mr-2" /> Discard</Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-200">
                        <Save size={18} className="mr-2" /> {isSubmitting ? "Generating..." : "Save & Generate Bill"}
                    </Button>
                </div>
            </div>

            <form className="max-w-6xl mx-auto p-10 space-y-8">
                {/* 1. Link & Meta */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Linked Freight Job</label>
                        <Select onValueChange={handleJobSelect}>
                            <SelectTrigger className="bg-slate-50 border-none h-12 rounded-xl">
                                <SelectValue placeholder="Search Job ID..." />
                            </SelectTrigger>
                            <SelectContent>
                                {jobs.map(j => <SelectItem key={j.jobId} value={j.jobId}>{j.jobId}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Bill Number</label>
                        <input {...register("billNo")} className="w-full bg-slate-50 border-none h-12 rounded-xl px-4 text-sm font-bold" />
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Bill Date</label>
                        <input type="date" {...register("billDate")} className="w-full bg-slate-50 border-none h-12 rounded-xl px-4 text-sm font-bold" />
                    </div>
                </div>

                {/* 2. Parties Section */}
                <div className="grid grid-cols-3 gap-8">
                    {/* Seller */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                            <Truck className="text-blue-600" size={20} />
                            <h3 className="text-xs font-black uppercase tracking-widest">Seller (Supplier)</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Vendor Name</label>
                                <input {...register("seller.name")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Address</label>
                                <textarea {...register("seller.address")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold h-20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">GSTIN</label>
                                    <input {...register("seller.gstin")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">State Code</label>
                                    <input {...register("seller.stateCode")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Consignee */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                            <Package className="text-emerald-600" size={20} />
                            <h3 className="text-xs font-black uppercase tracking-widest">Consignee (Ship To)</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Name</label>
                                <input {...register("consignee.name")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Address</label>
                                <textarea {...register("consignee.address")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold h-20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">GSTIN</label>
                                    <input {...register("consignee.gstin")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">State Code</label>
                                    <input {...register("consignee.stateCode")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Buyer */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                            <User className="text-indigo-600" size={20} />
                            <h3 className="text-xs font-black uppercase tracking-widest">Buyer (Bill To)</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Buyer Name</label>
                                <input {...register("buyer.name")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Address</label>
                                <textarea {...register("buyer.address")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold h-20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">GSTIN</label>
                                    <input {...register("buyer.gstin")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Place of Supply</label>
                                    <input {...register("buyer.placeOfSupply")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Shipping Metadata */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                        <FileText className="text-slate-400" size={20} />
                        <h3 className="text-xs font-black uppercase tracking-widest">Invoice Metadata (Shipping & References)</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-6">
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Delivery Note</label><input {...register("shipping.deliveryNote")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Mode of Payment</label><input {...register("shipping.modeTermsOfPayment")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Ref No & Date</label><input {...register("shipping.referenceNoAndDate")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Other References</label><input {...register("shipping.otherReferences")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Buyer Order No</label><input {...register("shipping.buyersOrderNo")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Order Date</label><input {...register("shipping.buyersOrderDated")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Dispatch Doc No</label><input {...register("shipping.dispatchDocNo")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Delivery Note Date</label><input {...register("shipping.deliveryNoteDate")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Dispatched Through</label><input {...register("shipping.dispatchedThrough")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Destination</label><input {...register("shipping.destination")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Vessel/Flight No</label><input {...register("shipping.vesselFlightNo")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                        <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">POL</label><input {...register("shipping.portOfLoading")} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" /></div>
                    </div>
                </div>

                {/* 4. Goods Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-10 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">Goods Description & Pricing</h3>
                        <Button type="button" size="sm" onClick={() => append({ description: "", hsnSac: "", quantityShipped: 1, quantityBilled: 1, unit: "PCS", rate: 0, gstPercent: 18 })} className="bg-slate-900 text-white rounded-xl font-bold">
                            <PlusCircle size={16} className="mr-2" /> Add Item
                        </Button>
                    </div>
                    <div className="p-10 space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="col-span-3 space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Description of Goods</label>
                                    <input {...register(`lineItems.${index}.description`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold" placeholder="Item Name..." />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">HSN / SAC</label>
                                    <input {...register(`lineItems.${index}.hsnSac`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold" />
                                </div>
                                <div className="col-span-1 space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Shipped</label>
                                    <input type="number" {...register(`lineItems.${index}.quantityShipped`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold" />
                                </div>
                                <div className="col-span-1 space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Billed</label>
                                    <input type="number" {...register(`lineItems.${index}.quantityBilled`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold" />
                                </div>
                                <div className="col-span-1 space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Unit</label>
                                    <input {...register(`lineItems.${index}.unit`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Rate</label>
                                    <input type="number" step="0.01" {...register(`lineItems.${index}.rate`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold text-right" />
                                </div>
                                <div className="col-span-1 space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">GST%</label>
                                    <select {...register(`lineItems.${index}.gstPercent`)} className="w-full bg-white border-none rounded-xl px-2 py-2.5 text-xs font-bold">
                                        <option value="18">18%</option>
                                        <option value="12">12%</option>
                                        <option value="5">5%</option>
                                        <option value="0">0%</option>
                                    </select>
                                </div>
                                <div className="col-span-1 pb-1 flex justify-center">
                                    <button type="button" onClick={() => remove(index)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. Totals Bar */}
                <div className="bg-slate-900 rounded-3xl p-10 flex justify-between items-center text-white shadow-2xl">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Gross Total (INR)</p>
                        <h4 className="text-4xl font-black">₹{totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                    </div>
                    <div className="flex gap-10">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Taxable</p>
                            <p className="text-lg font-bold">₹{totals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right border-l border-slate-800 pl-10">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total GST</p>
                            <p className="text-lg font-bold text-blue-400">₹{totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
