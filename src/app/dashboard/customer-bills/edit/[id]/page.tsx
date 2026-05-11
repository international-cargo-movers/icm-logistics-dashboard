"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Trash2, Save, X, FileText, Receipt, Package, Truck, User, Globe, Landmark, Activity, PlusCircle } from "lucide-react"
import { Form } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getCompanyDetails } from "@/lib/constants"

// --- UTILITY: Number to Words (INR) ---
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
const customerBillSchema = z.object({
    billNo: z.string().min(1),
    billDate: z.string(),
    jobId: z.string().min(1),
    jobReference: z.string().min(1),
    exporter: z.object({ name: z.string(), address: z.string(), gstin: z.string(), iecNo: z.string(), exporterRef: z.string().optional() }),
    consignee: z.object({ name: z.string(), address: z.string(), tel: z.string().optional(), poBox: z.string().optional(), country: z.string() }),
    buyer: z.object({ name: z.string().optional(), address: z.string().optional(), country: z.string().optional() }),
    shipping: z.object({ preCarriageBy: z.string().optional(), placeOfReceipt: z.string().optional(), vesselFlightNo: z.string().optional(), portOfLoading: z.string().optional(), portOfDischarge: z.string().optional(), finalDestination: z.string().optional(), marksAndNumbers: z.string().optional(), countryOfOrigin: z.string(), countryOfDestination: z.string().optional(), buyersOrderNo: z.string().optional(), buyersOrderDate: z.string().optional(), adCode: z.string().optional(), termsOfDeliveryPayment: z.string().optional() }),
    bank: z.object({ bankName: z.string(), accountNo: z.string(), branchAddress: z.string(), swiftCode: z.string(), ifscCode: z.string() }),
    exchangeRate: z.coerce.number().min(0.01),
    lineItems: z.array(z.object({ description: z.string().min(1), hsnCode: z.string(), quantity: z.coerce.number().min(0.01), unit: z.string(), unitPriceUSD: z.coerce.number().min(0), gstPercentage: z.coerce.number().min(0) })).min(1),
})

type CustomerBillFormValues = z.infer<typeof customerBillSchema>

export default function EditCustomerBillPage() {
    const router = useRouter()
    const { id } = useParams()
    const [jobs, setJobs] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const form = useForm<CustomerBillFormValues>({
        resolver: zodResolver(customerBillSchema) as any,
    })

    const { control, watch, setValue, register, handleSubmit, reset } = form
    const { fields, append, remove, replace } = useFieldArray({ control, name: "lineItems" })

    React.useEffect(() => {
        async function fetchData() {
            try {
                const [jobRes, billRes] = await Promise.all([
                    fetch("/api/jobs"),
                    fetch(`/api/customer-bills/${id}`)
                ])
                const jobJson = await jobRes.json()
                const billJson = await billRes.json()

                if (jobJson.success) setJobs(jobJson.data)
                
                if (billJson.success) {
                    const bill = billJson.data;
                    reset({
                        billNo: bill.billNo,
                        billDate: bill.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : "",
                        jobId: bill.jobId,
                        jobReference: bill.jobReference,
                        exporter: bill.exporterDetails,
                        consignee: bill.consigneeDetails,
                        buyer: bill.buyerDetails,
                        shipping: bill.shippingDetails,
                        bank: bill.bankDetails,
                        exchangeRate: bill.financials?.exchangeRate || 83,
                        lineItems: bill.lineItems
                    })
                }
            } catch (error) { toast.error("Failed to load bill data.") }
            finally { setIsLoading(false) }
        }
        fetchData()
    }, [id, reset])

    const handleJobSelect = (jobRef: string) => {
        const job = jobs.find(j => j.jobId === jobRef)
        if (!job) return
        setValue("jobId", job._id)
        setValue("jobReference", job.jobId)

        // Pre-fill Consignee from Job
        if (job.partyDetails?.consigneeId) {
            const c = job.partyDetails.consigneeId;
            setValue("consignee.name", c.name || "");
            const addr = [c.streetAddress, c.city, c.state].filter(Boolean).join(", ") + (c.zipCode ? ` - ${c.zipCode}` : "");
            setValue("consignee.address", addr);
            setValue("consignee.country", c.country || "");
        }

        // Pre-fill Buyer from Job
        if (job.customerDetails?.companyId) {
            const b = job.customerDetails.companyId;
            setValue("buyer.name", b.name || "");
            const bAddr = [b.streetAddress, b.city, b.state].filter(Boolean).join(", ") + (b.zipCode ? ` - ${b.zipCode}` : "");
            setValue("buyer.address", bAddr);
            setValue("buyer.country", b.country || "");
        }
    }

    const exRate = watch("exchangeRate") || 1
    const items = watch("lineItems") || []
    
    const totals = items.reduce((acc, item) => {
        const amtUSD = (item.unitPriceUSD || 0) * (item.quantity || 0);
        const amtTaxableINR = amtUSD * exRate;
        const gstAmt = amtTaxableINR * ((item.gstPercentage || 0) / 100);
        return { usd: acc.usd + amtUSD, taxableINR: acc.taxableINR + amtTaxableINR, gstINR: acc.gstINR + gstAmt, totalINR: acc.totalINR + amtTaxableINR + gstAmt };
    }, { usd: 0, taxableINR: 0, gstINR: 0, totalINR: 0 })

    async function onSubmit(data: CustomerBillFormValues) {
        setIsSubmitting(true)
        try {
            const payload = {
                ...data,
                exporterDetails: data.exporter,
                consigneeDetails: data.consignee,
                buyerDetails: data.buyer,
                shippingDetails: data.shipping,
                bankDetails: data.bank,
                financials: {
                    exchangeRate: data.exchangeRate,
                    totalUSD: totals.usd,
                    totalTaxableINR: totals.taxableINR,
                    totalGstINR: totals.gstINR,
                    totalAmountINR: totals.totalINR,
                    amountInWordsUSD: `USD ${totals.usd.toFixed(2)}`,
                    amountInWordsINR: numberToWords(totals.totalINR)
                }
            }

            const res = await fetch(`/api/customer-bills/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            })
            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            toast.success("Customer Goods Bill Updated!")
            router.push("/dashboard/customer-bills")
        } catch (error: any) { toast.error(error.message) }
        finally { setIsSubmitting(false) }
    }

    if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><Activity className="animate-spin text-blue-600" size={40} /></div>

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-600">Edit Customer Bill: {id}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 font-bold"><X size={18} className="mr-2" /> Discard</Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-lg shadow-emerald-200">
                        <Save size={18} className="mr-2" /> {isSubmitting ? "Updating..." : "Update Bills"}
                    </Button>
                </div>
            </div>

            <form className="max-w-7xl mx-auto p-10 space-y-8">
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Linked Freight Job</label>
                        <Select onValueChange={handleJobSelect} defaultValue={watch("jobReference")}>
                            <SelectTrigger className="bg-slate-50 border-none h-12 rounded-xl">
                                <SelectValue placeholder="Select Export Job..." />
                            </SelectTrigger>
                            <SelectContent>{jobs.map(j => <SelectItem key={j.jobId} value={j.jobId}>{j.jobId}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bill Number</label>
                        <input {...register("billNo")} disabled className="w-full bg-slate-50 border-none h-12 rounded-xl px-4 text-sm font-bold opacity-50" />
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Exchange Rate</label>
                        <input type="number" step="0.01" {...register("exchangeRate")} className="w-full bg-slate-50 border-none h-12 rounded-xl px-4 text-sm font-bold text-blue-600" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Truck className="text-blue-600" size={16}/> Exporter</h3>
                        <input {...register("exporter.name")} placeholder="Name" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                        <textarea {...register("exporter.address")} placeholder="Address" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold h-20" />
                        <input {...register("exporter.gstin")} placeholder="GSTIN" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-[10px] font-bold" />
                        <input {...register("exporter.iecNo")} placeholder="IEC" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-[10px] font-bold" />
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Package className="text-emerald-600" size={16}/> Consignee</h3>
                        <input {...register("consignee.name")} placeholder="Name" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                        <textarea {...register("consignee.address")} placeholder="Address" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold h-20" />
                        <input {...register("consignee.country")} placeholder="Country" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Landmark className="text-slate-400" size={16}/> Bank Info</h3>
                        <input {...register("bank.bankName")} placeholder="Bank" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                        <input {...register("bank.accountNo")} placeholder="A/C No" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                        <input {...register("bank.swiftCode")} placeholder="SWIFT" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-10 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">Goods Specification</h3>
                        <Button type="button" size="sm" onClick={() => append({ description: "", hsnCode: "", quantity: 1, unit: "PCS", unitPriceUSD: 0, gstPercentage: 18 })} className="bg-slate-900 text-white rounded-xl font-bold"><PlusCircle size={16} className="mr-2" /> Add Goods</Button>
                    </div>
                    <div className="p-10 space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="col-span-3 space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Description</label><input {...register(`lineItems.${index}.description`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold" /></div>
                                <div className="col-span-2 space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">HSN</label><input {...register(`lineItems.${index}.hsnCode`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold" /></div>
                                <div className="col-span-1 space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">QTY</label><input type="number" step="0.01" {...register(`lineItems.${index}.quantity`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold" /></div>
                                <div className="col-span-1 space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Unit</label><input {...register(`lineItems.${index}.unit`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold" /></div>
                                <div className="col-span-2 space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Price (USD)</label><input type="number" step="0.001" {...register(`lineItems.${index}.unitPriceUSD`)} className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold text-right" /></div>
                                <div className="col-span-2 space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">GST%</label><select {...register(`lineItems.${index}.gstPercentage`)} className="w-full bg-white border-none rounded-xl px-2 py-2.5 text-xs font-bold"><option value="18">18%</option><option value="12">12%</option><option value="5">5%</option><option value="0">0%</option></select></div>
                                <div className="col-span-1 pb-1 flex justify-center"><button type="button" onClick={() => remove(index)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[40px] p-12 flex justify-between items-center text-white shadow-2xl">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Total Commercial Value</p>
                        <h4 className="text-5xl font-black italic">USD {totals.usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                    </div>
                    <div className="flex gap-12 items-center text-right">
                        <div><p className="text-[10px] font-black uppercase text-slate-500 mb-2">Total GST</p><p className="text-xl font-bold text-emerald-400">₹{totals.gstINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p></div>
                        <div className="h-12 w-[1px] bg-slate-800"></div>
                        <div><p className="text-[10px] font-black uppercase text-blue-400 mb-2">Gross Total (INR)</p><p className="text-3xl font-black">₹{totals.totalINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p></div>
                    </div>
                </div>
            </form>
        </div>
    )
}
