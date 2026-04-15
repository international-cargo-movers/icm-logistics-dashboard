"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { MapPin, Anchor, PlusCircle, Trash2, Info, Save, X, Shield, FileText } from "lucide-react"
import { pdf } from '@react-pdf/renderer'
import InvoicePDF from '@/components/dashboard/invoices/InvoicePDF'

import { Form, FormField, FormItem, FormControl } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

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
const invoiceSchema = z.object({
    invoiceNo: z.string().min(1, "Required"),
    issueDate: z.string(),
    jobId: z.string().min(1, "Required"),
    jobReference: z.string().optional(),
    customerName: z.string(),
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
        currency: z.string(),
        roe: z.coerce.number().min(1),
        gstPercent: z.coerce.number().min(0),
    })).min(1),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

export default function EditInvoicePage() {
    const params = useParams()
    const router = useRouter()
    const invoiceId = params.invoiceId as string

    const { data: session, status } = useSession()

    const [jobs, setJobs] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: { 
            invoiceNo: "", issueDate: "", jobId: "", jobReference: "", customerName: "", billingAddress: "", 
            gstin: "", stateCode: "07", origin: "", destination: "",
            oblMawb: "", hblHawb: "", containerNo: "", vesselFlight: "", commodity: "General Cargo",
            egm: "", igm: "", sbNo: "", noOfPackages: 0, grossWeight: 0, volumetricWeight: 0, chargeableWeight: 0,
            lineItems: [] 
        }
    })

    const { control, watch, setValue, register, handleSubmit, reset } = form
    const { fields, append, remove, replace } = useFieldArray({ control, name: "lineItems" })

    // --- 1. HYDRATION ENGINE: Fetch Master Data & Invoice Data ---
    React.useEffect(() => {
        async function loadData() {
            try {
                const [jobsRes, invRes] = await Promise.all([
                    fetch("/api/jobs"),
                    fetch(`/api/invoices/${invoiceId}`)
                ])
                
                const jobsJson = await jobsRes.json()
                const invJson = await invRes.json()

                if (jobsJson.success) setJobs(jobsJson.data)

                if (invJson.success && invJson.data) {
                    const inv = invJson.data;
                    reset({
                        invoiceNo: inv.invoiceNo,
                        issueDate: new Date(inv.invoiceDate).toISOString().split('T')[0],
                        jobId: inv.jobId,
                        jobReference: inv.jobReference || "",
                        customerName: inv.customerDetails?.name || "",
                        billingAddress: inv.customerDetails?.billingAddress || "",
                        gstin: inv.customerDetails?.gstin || "",
                        stateCode: inv.customerDetails?.stateCode || "07",
                        origin: inv.shipmentSnapshot?.origin || "",
                        destination: inv.shipmentSnapshot?.destination || "",
                        oblMawb: inv.shipmentSnapshot?.oblMawb || "",
                        hblHawb: inv.shipmentSnapshot?.hblHawb || "",
                        containerNo: inv.shipmentSnapshot?.containerNo || "",
                        vesselFlight: inv.shipmentSnapshot?.vesselFlight || "",
                        commodity: inv.shipmentSnapshot?.commodity || "General Cargo",
                        egm: inv.shipmentSnapshot?.egm || "",
                        igm: inv.shipmentSnapshot?.igm || "",
                        sbNo: inv.shipmentSnapshot?.sbNo || "",
                        noOfPackages: inv.shipmentSnapshot?.noOfPackages || 0,
                        grossWeight: inv.shipmentSnapshot?.grossWeight || 0,
                        volumetricWeight: inv.shipmentSnapshot?.volumetricWeight || 0,
                        chargeableWeight: inv.shipmentSnapshot?.chargeableWeight || 0,
                        lineItems: inv.lineItems || []
                    })
                } else {
                    toast.error("Invoice not found")
                    router.push('/dashboard/invoices')
                }
            } catch (error) {
                toast.error("Connection Error", { description: "Failed to load invoice data." })
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [invoiceId, reset, router])

    // --- 2. AUTOFILL ENGINE: Update fields from Job/CRM ---
    const handleJobSelect = async (selectedJobId: string) => {
        const job = jobs.find(j => j.jobId === selectedJobId || j._id === selectedJobId)
        if (!job) return

        setValue("jobId", job._id)
        setValue("jobReference", job.jobId)

        // Pull data from the dynamically populated company object!
        const company = job.customerDetails?.companyId || {};

        setValue("customerName", company.name || "Unknown Customer")
        
        const addressParts = [
            company.streetAddress, 
            company.city, 
            company.state, 
            company.zipCode,
            company.country
        ].filter(Boolean)
        
        setValue("billingAddress", addressParts.join(", ") || "No Address Provided")
        setValue("gstin", company.taxId || "")

        setValue("origin", job.shipmentDetails?.portOfLoading || "TBD")
        setValue("destination", job.shipmentDetails?.portOfDischarge || "TBD")
        setValue("commodity", job.cargoDetails?.commodity || "General Cargo")
        setValue("grossWeight", job.cargoDetails?.grossWeight || 0)
        setValue("noOfPackages", job.cargoDetails?.noOfPackages || 0)

        // Give the user the option to replace line items or keep existing ones
        if (job.quoteReference && watch("lineItems").length === 0) {
            toast.message(`Fetching Financials from Quote: ${job.quoteReference}`)
            try {
                const quoteRes = await fetch(`/api/quotes/${job.quoteReference}`)
                const quoteJson = await quoteRes.json()

                if (quoteJson.success && quoteJson.data) {
                    const invoiceReadyLines = (quoteJson.data.financials?.lineItems || []).map((item: any) => ({
                        description: item.chargeName || "Freight Charge",
                        sacCode: "996511",
                        rate: Number(item.sellPrice) || 0,
                        currency: item.currency || "USD",
                        roe: item.roe || 1,
                        gstPercent: 18 
                    }))
                    replace(invoiceReadyLines.length > 0 ? invoiceReadyLines : [{ description: "Freight Charges", sacCode: "996511", rate: 0, currency: "USD", roe: 1, gstPercent: 18 }])
                }
            } catch (error) { toast.error("Failed to fetch linked quote financials.") }
        }
    }

    // --- 3. LIVE MATH ENGINE ---
    const lineItems = watch("lineItems") || []
    const totals = lineItems.reduce((acc, item) => {
        const taxableValue = (item.rate || 0) * (item.roe || 1)
        const gstAmount = taxableValue * ((item.gstPercent || 0) / 100)
        return {
            taxable: acc.taxable + taxableValue,
            gst: acc.gst + gstAmount,
            net: acc.net + taxableValue + gstAmount
        }
    }, { taxable: 0, gst: 0, net: 0 })

    async function onSubmit(data: InvoiceFormValues) {
        setIsSubmitting(true)
        try {
            const linkedJob = jobs.find(j => j._id === data.jobId || j.jobId === data.jobId);
            const companyId = linkedJob?.customerDetails?.companyId?._id || linkedJob?.customerDetails?.companyId || data.customerName;

            const processedLineItems = data.lineItems.map(item => {
                const taxableValue = (item.rate || 0) * (item.roe || 1);
                const gstAmount = taxableValue * ((item.gstPercent || 0) / 100);
                return { ...item, taxableValue, gstAmount };
            });

            const invoicePayload = {
                invoiceNo: data.invoiceNo,
                invoiceDate: data.issueDate,
                jobId: data.jobId,
                jobReference: data.jobReference || linkedJob?.jobId, 
                customerDetails: {
                    companyId: companyId,
                    name: data.customerName,
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

            const dbResponse = await fetch(`/api/invoices/${invoiceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(invoicePayload)
            });

            const dbResult = await dbResponse.json();
            if (!dbResult.success) throw new Error(dbResult.error || "Failed to update database");

            const blob = await pdf(<InvoicePDF data={invoicePayload} />).toBlob()
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank')

            toast.success("Success", { description: "Invoice Revised & PDF Generated!" })
            router.push("/dashboard/invoices")

        } catch (error: any) {
            toast.error("Submission Error", { description: error.message || "Failed to update invoice." })
        } finally {
            setIsSubmitting(false)
        }
    }
    
    // --- THE CLIENT LOCK ---
    if (status === "loading" || isLoading) {
        return <div className="p-12 text-center font-bold text-slate-500 animate-pulse">Verifying Credentials & Hydrating Data...</div>
    }

    if (session && !["SuperAdmin", "Finance"].includes(session.user.role)) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
                <Shield className="w-16 h-16 text-red-500 mb-4 opacity-20" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Restricted Area</h1>
                <p className="text-slate-500 max-w-md">Your current role ({session.user.role}) does not have clearance to modify financial documents.</p>
                <button onClick={() => router.back()} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen font-sans pb-12">
            <div className="sticky px-6 py-2 top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold tracking-tight uppercase text-slate-600">Edit Invoice: {watch("invoiceNo")}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors rounded-lg flex items-center gap-2">
                        <X className="w-4 h-4" /> Discard
                    </button>
                    <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold bg-black text-white p-2 rounded-lg shadow-md hover:bg-slate-800 transition-all flex items-center gap-2">
                        <Save className="w-4 h-4" /> {isSubmitting ? "Saving..." : "Save Revisions"}
                    </button>
                </div>
            </div>

            <Form {...form}>
                <form className="max-w-6xl mx-auto p-8 space-y-8">

                    {/* SECTION 1: INVOICE META */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice Number</label>
                            <input {...register("invoiceNo")} className="bg-slate-100 border-none rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-slate-200 outline-none" />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issue Date</label>
                            <input type="date" {...register("issueDate")} className="bg-slate-100 border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-blue-600">Linked Job ID (Select to Auto-Fill Data)</label>
                            <Select onValueChange={handleJobSelect} value={watch("jobReference") || ""}>
                                <SelectTrigger className="w-full bg-slate-100 border-none rounded-lg h-[44px] px-4 shadow-none focus:ring-2 focus:ring-slate-200">
                                    <SelectValue placeholder="Select Freight Job..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobs.length === 0 && <SelectItem value="none" disabled>Loading jobs...</SelectItem>}
                                    {jobs.map(job => (<SelectItem key={job._id} value={job.jobId}>{job.jobId} - {job.customerDetails?.companyId?.name || "Unknown"}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* SECTION 2: CUSTOMER & ADVANCED ROUTING */}
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-700">Tax & Routing Details</h2>
                        </div>
                        <div className="p-8 grid grid-cols-3 gap-x-8 gap-y-6">
                            <div className="col-span-3 grid grid-cols-2 gap-6 mb-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consignee Name</label>
                                    <input {...register("customerName")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Billing Address</label>
                                    <input {...register("billingAddress")} className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-slate-200 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer GSTIN/UIN</label>
                                    <input {...register("gstin")} placeholder="e.g. 07AADC..." className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm font-mono focus:ring-2 focus:ring-slate-200 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">State Code</label>
                                    <input {...register("stateCode")} placeholder="e.g. 07" className="w-full bg-slate-100 border-none rounded-lg h-10 px-3 text-sm font-mono focus:ring-2 focus:ring-slate-200 outline-none" />
                                </div>
                            </div>
                            
                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase block">Origin / POL</label><input {...register("origin")} className="w-full bg-slate-100 rounded-lg h-9 px-3 text-sm outline-none" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase block">Destination / POD</label><input {...register("destination")} className="w-full bg-slate-100 rounded-lg h-9 px-3 text-sm outline-none" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase block">Vessel & Voyage / Flight</label><input {...register("vesselFlight")} className="w-full bg-slate-100 rounded-lg h-9 px-3 text-sm outline-none" /></div>
                            
                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase block">OBL / MAWB No</label><input {...register("oblMawb")} className="w-full bg-slate-100 rounded-lg h-9 px-3 text-sm outline-none font-mono" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase block">HBL / HAWB No</label><input {...register("hblHawb")} className="w-full bg-slate-100 rounded-lg h-9 px-3 text-sm outline-none font-mono" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase block">Container No.</label><input {...register("containerNo")} className="w-full bg-slate-100 rounded-lg h-9 px-3 text-sm outline-none font-mono" /></div>

                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase block">EGM No.</label><input {...register("egm")} className="w-full bg-slate-100 rounded-lg h-9 px-3 text-sm outline-none font-mono" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase block">IGM No.</label><input {...register("igm")} className="w-full bg-slate-100 rounded-lg h-9 px-3 text-sm outline-none font-mono" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase block">Shipping Bill (SB) No.</label><input {...register("sbNo")} className="w-full bg-slate-100 rounded-lg h-9 px-3 text-sm outline-none font-mono" /></div>
                        </div>
                    </div>

                    {/* SECTION 3: INTERACTIVE BILLING LINES */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-sm font-extrabold text-slate-900">Billing Items</h2>
                            <button type="button" onClick={() => append({ description: "", sacCode: "996511", rate: 0, currency: "USD", roe: 1, gstPercent: 18 })} className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                <PlusCircle className="w-4 h-4" /> Add Charge Line
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[30%]">Description</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">SAC/HSN</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rate</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Cur</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest">ROE</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">GST%</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Amount (₹)</th>
                                        <th className="px-6 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fields.map((field, index) => {
                                        const lineRate = watch(`lineItems.${index}.rate`) || 0;
                                        const lineRoe = watch(`lineItems.${index}.roe`) || 1;
                                        const lineTaxable = lineRate * lineRoe;
                                        return (
                                            <tr key={field.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4"><input {...register(`lineItems.${index}.description`)} className="w-full bg-transparent border-none text-sm font-medium focus:ring-0 p-0 outline-none" placeholder="Description..." /></td>
                                                <td className="px-4 py-4"><input {...register(`lineItems.${index}.sacCode`)} className="w-full bg-transparent border-none text-xs text-slate-500 font-mono focus:ring-0 p-0 outline-none" placeholder="996511" /></td>
                                                <td className="px-4 py-4"><input type="number" step="0.01" {...register(`lineItems.${index}.rate`)} className="w-full bg-transparent border-none text-sm font-semibold tabular-nums focus:ring-0 p-0 outline-none" /></td>
                                                <td className="px-4 py-4 text-center">
                                                    <select {...register(`lineItems.${index}.currency`)} className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-1 rounded-full outline-none uppercase cursor-pointer appearance-none">
                                                        <option value="USD">USD</option><option value="EUR">EUR</option><option value="INR">INR</option>
                                                        <option value="GBP">GBP</option><option value="AED">AED</option><option value="SGD">SGD</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4"><input type="number" step="0.01" {...register(`lineItems.${index}.roe`)} className="w-full bg-transparent border-none text-xs font-mono text-slate-500 text-center focus:ring-0 p-0 outline-none" /></td>
                                                <td className="px-4 py-4">
                                                    <select {...register(`lineItems.${index}.gstPercent`)} className="bg-transparent border-none text-xs font-medium focus:ring-0 p-0 outline-none cursor-pointer">
                                                        <option value="18">18%</option><option value="12">12%</option><option value="5">5%</option><option value="0">0%</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm font-bold tabular-nums">{lineTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-right"><button type="button" onClick={() => remove(index)} className="text-slate-300 hover:text-red-500 hover:scale-110 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION 4: LIVE MATH FOOTER */}
                    <div className="flex flex-col md:flex-row gap-10 items-end justify-between py-10 border-t-2 border-slate-200 border-dashed">
                        <div className="max-w-md w-full">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="w-4 h-4 text-slate-400" /><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Taxation & Compliance Note</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed italic">All freight charges are subject to carrier-standard ROE. Tax calculated as per destination local authority. Please ensure the HSN codes are verified against current customs data.</p>
                        </div>
                        <div className="w-full md:w-96 space-y-4">
                            <div className="flex justify-between items-center text-sm"><span className="text-slate-600 font-medium">Subtotal (Taxable)</span><span className="font-bold tabular-nums">₹{totals.taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-slate-600 font-medium">Estimated GST</span><span className="font-bold tabular-nums text-blue-600">+ ₹{totals.gst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                            <div className="h-px bg-slate-200 my-4"></div>
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-800 mt-2">Net Amount Due</span>
                                <div className="text-right">
                                    <div className="text-3xl font-black tabular-nums tracking-tighter text-slate-900">₹{totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-1 max-w-[200px] leading-tight">{numberToWords(totals.net)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    )
}