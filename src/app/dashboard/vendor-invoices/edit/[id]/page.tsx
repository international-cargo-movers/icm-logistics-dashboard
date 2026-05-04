"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { MapPin, Anchor, PlusCircle, Trash2, Info, Save, X, Shield, FileText, Activity } from "lucide-react"
import { pdf } from '@react-pdf/renderer'
import VendorInvoicePDF from '@/components/dashboard/vendor-invoices/VendorInvoicePDF'

import { Form, FormField, FormItem, FormControl } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import { LineItemDescriptionInput } from "@/components/dashboard/financials/LineItemDescriptionInput"

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
const vendorInvoiceSchema = z.object({
    vendorInvoiceNo: z.string().min(1, "Required"),
    issueDate: z.string(),
    jobId: z.string().min(1, "Required"),
    jobReference:z.string().min(1,"Required"),
    vendorName: z.string(),
    billingAddress: z.string(),
    gstin: z.string().optional(),
    stateCode: z.string().optional(),
    origin: z.string(),
    destination: z.string(),
    
    // Advanced Routing Details
    oblMawb: z.string().optional(),
    hblHawb: z.string().optional(),
    containerNo: z.string().optional(),
    vesselFlight: z.string().optional(),
    commodity: z.string().optional(),
    egm: z.string().optional(),
    igm: z.string().optional(),
    sbNo: z.string().optional(),
    noOfPackages: z.coerce.number().optional(),
    grossWeight: z.coerce.number().optional(),
    volumetricWeight: z.coerce.number().optional(),
    chargeableWeight: z.coerce.number().optional(),

    lineItems: z.array(z.object({
        description: z.string().min(1),
        sacCode: z.string(),
        rate: z.coerce.number().min(0),
        quantity: z.coerce.number().min(0.01).default(1),
        unit: z.string().default("SET"),
        currency: z.string(),
        roe: z.coerce.number().min(1),
        gstPercent: z.coerce.number().min(0),
    })).min(1),
})

type VendorInvoiceFormValues = z.infer<typeof vendorInvoiceSchema>

export default function EditVendorInvoicePage() {
    const router = useRouter()
    const { id } = useParams()
    const { data: session, status } = useSession()
    const [jobs, setJobs] = React.useState<any[]>([])
    const [vendors, setVendors] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const form = useForm<VendorInvoiceFormValues>({
        resolver: zodResolver(vendorInvoiceSchema) as any,
        defaultValues: {
            vendorInvoiceNo: "",
            issueDate: new Date().toISOString().split('T')[0],
            jobId: "", vendorName: "", billingAddress: "", gstin: "", stateCode: "",
            origin: "", destination: "",
            oblMawb: "", hblHawb: "", containerNo: "", vesselFlight: "", commodity: "",
            egm: "", igm: "", sbNo: "", noOfPackages: 0, grossWeight: 0, volumetricWeight: 0, chargeableWeight: 0,
            lineItems: []
        }
    })

    const { control, watch, setValue, register, handleSubmit, reset } = form
    const { fields, append, remove, replace } = useFieldArray({ control, name: "lineItems" })

    React.useEffect(() => {
        async function fetchData() {
            try {
                const [jobRes, vendorRes, invoiceRes] = await Promise.all([
                    fetch("/api/jobs"),
                    fetch("/api/companies?type=Vendor"),
                    fetch(`/api/vendor-invoices/${id}`)
                ])

                const [jobJson, vendorJson, invoiceJson] = await Promise.all([
                    jobRes.json(),
                    vendorRes.json(),
                    invoiceRes.json()
                ])

                if (jobJson.success) setJobs(jobJson.data)
                if (vendorJson.success) setVendors(vendorJson.data)
                
                if (invoiceJson.success) {
                    const inv = invoiceJson.data
                    reset({
                        vendorInvoiceNo: inv.vendorInvoiceNo,
                        issueDate: inv.vendorInvoiceDate ? new Date(inv.vendorInvoiceDate).toISOString().split('T')[0] : "",
                        jobId: inv.jobId,
                        jobReference: inv.jobReference,
                        vendorName: inv.vendorDetails?.name || "",
                        billingAddress: inv.vendorDetails?.billingAddress || "",
                        gstin: inv.vendorDetails?.gstin || "",
                        stateCode: inv.vendorDetails?.stateCode || "",
                        origin: inv.shipmentSnapshot?.origin || "",
                        destination: inv.shipmentSnapshot?.destination || "",
                        oblMawb: inv.shipmentSnapshot?.oblMawb || "",
                        hblHawb: inv.shipmentSnapshot?.hblHawb || "",
                        containerNo: inv.shipmentSnapshot?.containerNo || "",
                        vesselFlight: inv.shipmentSnapshot?.vesselFlight || "",
                        commodity: inv.shipmentSnapshot?.commodity || "",
                        egm: inv.shipmentSnapshot?.egm || "",
                        igm: inv.shipmentSnapshot?.igm || "",
                        sbNo: inv.shipmentSnapshot?.sbNo || "",
                        noOfPackages: inv.shipmentSnapshot?.noOfPackages || 0,
                        grossWeight: inv.shipmentSnapshot?.grossWeight || 0,
                        volumetricWeight: inv.shipmentSnapshot?.volumetricWeight || 0,
                        chargeableWeight: inv.shipmentSnapshot?.chargeableWeight || 0,
                        lineItems: inv.lineItems || []
                    })
                }
            } catch (error) { 
                toast.error("Could not fetch data.") 
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [id, reset])

    const handleJobSelect = async (selectedJobId: string) => {
        const job = jobs.find(j => j.jobId === selectedJobId)
        if (!job) return

        setValue("jobId", job._id)
        setValue("jobReference",job.jobId)

        // Get vendor if job has vendor details
        if (job.vendorDetails && job.vendorDetails.length > 0) {
            const vendorInfo = job.vendorDetails[0].vendorId;
            const vendorData = (typeof vendorInfo === 'object' && vendorInfo !== null) 
                ? vendorInfo 
                : vendors.find(v => v._id === vendorInfo);

            if (vendorData) {
                setValue("vendorName", vendorData.name || "")
                const addressParts = [
                    vendorData.streetAddress, 
                    vendorData.city, 
                    vendorData.state, 
                    vendorData.zipCode,
                    vendorData.country
                ].filter(Boolean)
                setValue("billingAddress", addressParts.join(", ") || "")
                setValue("gstin", vendorData.taxId || "")
            }
        }

        setValue("origin", job.shipmentDetails?.portOfLoading || "TBD")
        setValue("destination", job.shipmentDetails?.portOfDischarge || "TBD")
        setValue("commodity", job.cargoDetails?.commodity || "General Cargo")
        
        // Pull cargo totals
        const gw = Number(job.cargoDetails?.totalGrossWeight || 0)
        const vw = Number(job.cargoDetails?.totalVolumetricWeight || 0)
        const pkgs = Number(job.cargoDetails?.totalNoOfPackages || 0)
        
        setValue("grossWeight", gw)
        setValue("volumetricWeight", vw)
        setValue("noOfPackages", pkgs)
        
        // Calculate Chargeable Weight (Max of GW and VW)
        setValue("chargeableWeight", Math.max(gw, vw))

        // Pull Shipping Document details
        const hawb = job.shippingDocuments?.awbDetails?.hawbNumber || ""
        const mawb = (job.shippingDocuments?.awbDetails?.awbPrefix && job.shippingDocuments?.awbDetails?.awbSerialNumber) 
            ? `${job.shippingDocuments.awbDetails.awbPrefix}-${job.shippingDocuments.awbDetails.awbSerialNumber}` 
            : (job.shippingDocuments?.bolDetails?.bolNumber || "")

        setValue("hblHawb", hawb)
        setValue("oblMawb", mawb)
        setValue("vesselFlight", job.cargoDetails?.carrier || "")
        setValue("containerNo", job.shippingDocuments?.bolDetails?.bookingReference || "")
    }

    if (status === "loading" || isLoading) return <div className="p-12 text-center font-bold text-slate-500 animate-pulse">Synchronizing Records...</div>
    const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
    if (session && !userRoles.some(r => ["SuperAdmin", "Finance", "Operations"].includes(r))) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
                <Shield className="w-16 h-16 text-red-500 mb-4 opacity-20" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Restricted Area</h1>
                <p className="text-slate-500 max-w-md">Your current role does not have clearance to modify financial documents.</p>
                <button onClick={() => router.back()} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">Go Back</button>
            </div>
        )
    }

    const lineItems = watch("lineItems") || []
    const totals = lineItems.reduce((acc, item) => {
        const taxableValue = (item.rate || 0) * (item.quantity || 1) * (item.roe || 1)
        const gstAmount = taxableValue * ((item.gstPercent || 0) / 100)
        return {
            taxable: acc.taxable + taxableValue,
            gst: acc.gst + gstAmount,
            net: acc.net + taxableValue + gstAmount
        }
    }, { taxable: 0, gst: 0, net: 0 })

    async function onSubmit(data: VendorInvoiceFormValues) {
        setIsSubmitting(true)
        try {
            const linkedJob = jobs.find(j => j._id === data.jobId || j.jobId === data.jobReference);
            const vendor = vendors.find(v => v.name === data.vendorName);
            
            // Safe extraction of vendorId (string)
            let vendorId = vendor?._id;
            if (!vendorId && linkedJob?.vendorDetails?.[0]?.vendorId) {
                const vInfo = linkedJob.vendorDetails[0].vendorId;
                vendorId = (typeof vInfo === 'object' && vInfo !== null) ? vInfo._id : vInfo;
            }

            const processedLineItems = data.lineItems.map(item => {
                const taxableValue = (item.rate || 0) * (item.quantity || 1) * (item.roe || 1);
                const gstAmount = taxableValue * ((item.gstPercent || 0) / 100);
                return { ...item, taxableValue, gstAmount };
            });

            const vendorInvoicePayload = {
                vendorInvoiceNo: data.vendorInvoiceNo,
                vendorInvoiceDate: data.issueDate,
                jobId: data.jobId,
                jobReference: data.jobReference,
                vendorDetails: {
                    vendorId: vendorId,
                    name: data.vendorName,
                    billingAddress: data.billingAddress,
                    gstin: data.gstin,
                    stateCode: data.stateCode
                },
                shipmentSnapshot: {
                    origin: data.origin, destination: data.destination, pol: data.origin, pod: data.destination,
                    oblMawb: data.oblMawb, hblHawb: data.hblHawb, containerNo: data.containerNo, vesselFlight: data.vesselFlight,
                    commodity: data.commodity, egm: data.egm, igm: data.igm, sbNo: data.sbNo,
                    noOfPackages: data.noOfPackages, grossWeight: data.grossWeight, volumetricWeight: data.volumetricWeight, chargeableWeight: data.chargeableWeight
                },
                lineItems: processedLineItems,
                totals: {
                    totalTaxable: totals.taxable,
                    totalGst: totals.gst,
                    roundOff: 0,
                    netAmount: totals.net,
                    amountInWords: numberToWords(totals.net)
                }
            }

            const dbResponse = await fetch(`/api/vendor-invoices/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vendorInvoicePayload)
            });
            const dbResult = await dbResponse.json();
            if (!dbResult.success) throw new Error(dbResult.error || "Failed to update database");

            const blob = await pdf(<VendorInvoicePDF data={vendorInvoicePayload} />).toBlob()
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank')
            toast.success("Vendor Invoice Updated & PDF Generated!")
            router.push("/dashboard/vendor-invoices") 
        } catch (error: any) { 
            console.error(error);
            toast.error(error.message || "Failed to update vendor invoice.") 
        } 
        finally { setIsSubmitting(false) }
    }
    
    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen font-sans pb-12">
            <div className="sticky px-6 py-2 top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold tracking-tight uppercase text-slate-600">Edit Vendor Invoice: {watch("vendorInvoiceNo")}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors rounded-lg flex items-center gap-2"><X className="w-4 h-4" /> Discard</button>
                    <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold bg-black text-white p-2 rounded-lg shadow-md hover:bg-slate-800 transition-all flex items-center gap-2">
                        <Save className="w-4 h-4" /> {isSubmitting ? "Saving Changes..." : "Update Vendor Invoice"}
                    </button>
                </div>
            </div>

            <Form {...form}>
                <form className="max-w-6xl mx-auto p-8 space-y-8">
                    {/* SECTION 1: INVOICE META */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vendor Invoice Number</label>
                            <input {...register("vendorInvoiceNo")} className="bg-slate-100 border-none rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-slate-200 outline-none" />
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issue Date</label>
                            <input type="date" {...register("issueDate")} className="bg-slate-100 border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Job ID Search</label>
                            <Select onValueChange={handleJobSelect} value={watch("jobReference") || ""}>
                                <SelectTrigger className="w-full bg-slate-100 border-none rounded-lg h-[44px] px-4 shadow-none focus:ring-2 focus:ring-slate-200">
                                    <SelectValue placeholder="Select Freight Job..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobs.map(job => (<SelectItem key={job.jobId} value={job.jobId}>{job.jobId} - {job.customerDetails?.companyId?.name || "Unknown"}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* SECTION 2: VENDOR & ADVANCED ROUTING */}
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Tax & Routing Details</h2>
                        </div>
                        <div className="p-8 grid grid-cols-3 gap-x-8 gap-y-6">
                            <div className="col-span-3 grid grid-cols-2 gap-6 mb-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vendor Name</label>
                                    <input {...register("vendorName")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Billing Address</label>
                                    <input {...register("billingAddress")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vendor GSTIN/UIN</label>
                                    <input {...register("gstin")} placeholder="e.g. 07AADC..." className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm font-mono focus:ring-2 focus:ring-slate-200 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">State Code</label>
                                    <input {...register("stateCode")} placeholder="e.g. 07" className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                                </div>
                            </div>

                            {/* Shipment Details Grid */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Origin</label>
                                <input {...register("origin")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination</label>
                                <input {...register("destination")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Commodity</label>
                                <input {...register("commodity")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OBL/MAWB</label>
                                <input {...register("oblMawb")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">HBL/HAWB</label>
                                <input {...register("hblHawb")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Container No</label>
                                <input {...register("containerNo")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vessel/Flight</label>
                                <input {...register("vesselFlight")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">EGM</label>
                                <input {...register("egm")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IGM</label>
                                <input {...register("igm")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SB No</label>
                                <input {...register("sbNo")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No of Packages</label>
                                <input type="number" {...register("noOfPackages")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gross Weight (KG)</label>
                                <input type="number" {...register("grossWeight")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volumetric Weight</label>
                                <input type="number" {...register("volumetricWeight")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chargeable Weight</label>
                                <input type="number" {...register("chargeableWeight")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: LINE ITEMS */}
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-slate-500" />
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Charge Details</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => append({ description: "", sacCode: "996511", rate: 0, quantity: 1, unit: "SET", currency: "USD", roe: 1, gstPercent: 18 })}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <PlusCircle className="w-4 h-4" /> Add Line
                            </button>
                        </div>
                        <div className="p-8 space-y-4 max-h-96 overflow-y-auto">
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="col-span-3 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-600 uppercase">Description</label>
                                        <Controller
                                            name={`lineItems.${index}.description`}
                                            control={control}
                                            render={({ field }) => (
                                                <LineItemDescriptionInput 
                                                    {...field} 
                                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-slate-200 outline-none" 
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-600 uppercase">SAC</label>
                                        <input {...register(`lineItems.${index}.sacCode`)} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-slate-200 outline-none" />
                                    </div>
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-600 uppercase">Qty</label>
                                        <input type="number" step="0.01" {...register(`lineItems.${index}.quantity`)} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-slate-200 outline-none" />
                                    </div>
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-600 uppercase">Unit</label>
                                        <input {...register(`lineItems.${index}.unit`)} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-slate-200 outline-none" />
                                    </div>
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-600 uppercase">Rate</label>
                                        <input type="number" step="0.01" {...register(`lineItems.${index}.rate`)} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-slate-200 outline-none" />
                                    </div>
                                    <div className="col-span-1 space-y-1 text-center">
                                        <label className="text-[9px] font-bold text-slate-600 uppercase">Curr</label>
                                        <select {...register(`lineItems.${index}.currency`)} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none">
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="INR">INR</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-600 uppercase">ROE</label>
                                        <input type="number" step="0.01" {...register(`lineItems.${index}.roe`)} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-slate-200 outline-none" />
                                    </div>
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-600 uppercase">GST%</label>
                                        <select {...register(`lineItems.${index}.gstPercent`)} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none">
                                            <option value="18">18%</option>
                                            <option value="12">12%</option>
                                            <option value="5">5%</option>
                                            <option value="0">0%</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 flex items-end justify-center pb-1">
                                        <button type="button" onClick={() => remove(index)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="col-span-12 text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-2">Line Total (INR):</span>
                                        <span className="text-xs font-bold text-slate-700">₹{((watch(`lineItems.${index}.rate`) || 0) * (watch(`lineItems.${index}.quantity`) || 1) * (watch(`lineItems.${index}.roe`) || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 4: TOTALS SUMMARY */}
                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl p-8 border border-slate-200">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Taxable (INR)</p>
                                <p className="text-2xl font-bold text-slate-900">₹{totals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">GST Amount</p>
                                <p className="text-2xl font-bold text-orange-600">₹{totals.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Net Amount (INR)</p>
                                <p className="text-2xl font-bold text-green-600">₹{totals.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
