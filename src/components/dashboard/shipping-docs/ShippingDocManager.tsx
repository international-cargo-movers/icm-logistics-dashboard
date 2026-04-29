"use client"

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Anchor, Plane, Download, Eye, Plus } from "lucide-react";
import { toast } from "sonner"
import { pdf } from "@react-pdf/renderer";
import BolPDF from "./BoLPDF";
import AwbPDF from "./AWB";

export default function ShippingDocManager({ job }: { job: any }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Determine mode and if documents already exist
    const mode = job?.shipmentDetails?.mode || "";
    const isAir = mode.toLowerCase().includes("air");

    const hasBol = !!job?.shippingDocuments?.bolDetails?.bolNumber;
    const hasAwb = !!job?.shippingDocuments?.awbDetails?.awbSerialNumber;
    const hasDocument = isAir ? hasAwb : hasBol;

    // Initialize form with existing data if any
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            shipmentDetails: job?.shipmentDetails || {},
            shippingDocuments: job?.shippingDocuments || {}
        }
    });

    // Reset form when job data changes (important for re-fetching)
    React.useEffect(() => {
        if (job) {
            reset({
                shipmentDetails: job.shipmentDetails || {},
                shippingDocuments: job.shippingDocuments || {}
            });
        }
    }, [job, reset]);

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            // Calls the dedicated docs update route we made earlier
            // We pass data directly because register() uses "shippingDocuments.awbDetails..." 
            // so data is { shippingDocuments: { awbDetails: { ... } } }
            const res = await fetch(`/api/jobs/${job._id}/docs`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data.shippingDocuments),
            });

            const json = await res.json();
            if (json.success) {
                // IMPORTANT: Update the local job object so the PDF generator picks up new values immediately
                job.shippingDocuments = data.shippingDocuments;
                setIsEditing(false);
                router.refresh(); 
            } else {
                toast.error("Failed to save documents.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async () => {
        try {
            if (isAir) {
                toast.success("Downloading HAWB...")
            } else {
                toast.success("Downloading BoL...")
            }
            const documentComponent = isAir ? <AwbPDF data={job} /> : <BolPDF data={job} />;
            const blob = await pdf(documentComponent).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${isAir ? 'HAWB' : 'BoL'}_${job.jobId}.pdf`;
            link.click();

            // Clean up the object URL to avoid memory leaks
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF. Check console for details.");
        }
    };

    const handleView = async () => {
        try {
            // 1. Determine which document to render
            const documentComponent = isAir ? <AwbPDF data={job} /> : <BolPDF data={job} />;

            // 2. Generate the PDF Blob
            const blob = await pdf(documentComponent).toBlob();

            // 3. Create a temporary local URL for the Blob
            const url = URL.createObjectURL(blob);

            // 4. Open it in a new browser tab
            window.open(url, '_blank');

            // Note: We don't immediately revoke the ObjectURL here like we do in downloads, 
            // because the new tab needs a moment to actually load and display the file.
        } catch (error) {
            console.error("PDF View Error:", error);
            toast.error("Failed to open the PDF. Check console for details.");
        }
    };

    // --- STATE 1: DOCUMENT EXISTS (Show View/Download) ---
    if (hasDocument && !isEditing) {
        return (
            <Card className="p-6 bg-white border border-slate-200 shadow-sm mt-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isAir ? <Plane className="w-5 h-5 text-sky-600" /> : <Anchor className="w-5 h-5 text-indigo-600" />}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{isAir ? 'House Airway Bill (HAWB)' : 'House Bill of Lading (HBL)'}</h2>
                            <p className="text-sm text-slate-500">Document generated and locked.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleView}>
                            <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                        <Button className={isAir ? "bg-sky-600 hover:bg-sky-700" : "bg-indigo-600 hover:bg-indigo-700"} onClick={handleDownload}>
                            <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                        {/* Optional: Allow them to open the form again to fix typos */}
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="ml-2 text-slate-400 hover:text-slate-600">
                            Edit Data
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    // --- STATE 2: NO DOCUMENT OR EDITING (Show Form) ---
    if (!hasDocument && !isEditing) {
        return (
            <Card className="p-6 border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center py-10 mt-8">
                <FileText className="w-8 h-8 text-slate-400 mb-3" />
                <h3 className="text-slate-700 font-bold mb-1">No Legal Documents Generated</h3>
                <p className="text-slate-500 text-sm mb-4">Add the specific marks, seals, and routing details to generate the {isAir ? 'HAWB' : 'BoL'}.</p>
                <Button onClick={() => setIsEditing(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Create {isAir ? 'HAWB' : 'BoL'}
                </Button>
            </Card>
        );
    }

    // --- STATE 3: THE INPUT FORM ---
    return (
        <Card className="p-6 bg-white border border-slate-200 shadow-sm mt-8">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                {isAir ? <Plane className="w-5 h-5 text-sky-600" /> : <Anchor className="w-5 h-5 text-indigo-600" />}
                <h2 className="text-lg font-bold text-slate-900">Configure {isAir ? 'HAWB' : 'BoL'} Data</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {isAir ? (
                    /* AIR FIELDS (Fully Synced) */
                    <div className="space-y-8">
                        {/* 1. Header Details */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">AWB Prefix</label>
                                <input {...register("shippingDocuments.awbDetails.awbPrefix")} maxLength={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm font-mono" placeholder="217" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">AWB Serial</label>
                                <input {...register("shippingDocuments.awbDetails.awbSerialNumber")} maxLength={8} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm font-mono" placeholder="52695995" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">HAWB Number</label>
                                <input {...register("shippingDocuments.awbDetails.hawbNumber")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="ICMICN064" />
                            </div>
                        </div>

                        {/* 2. Routing & Destinations */}
                        <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Airport of Departure</label>
                                    <input {...register("shipmentDetails.portOfLoading")} className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm uppercase" placeholder="DEL" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Airport of Destination</label>
                                    <input {...register("shipmentDetails.portOfDischarge")} className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm uppercase" placeholder="ICN" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">IATA Code</label>
                                    <input {...register("shippingDocuments.awbDetails.iataCode")} className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="14-3-4720" />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">To (1)</label>
                                    <input {...register("shippingDocuments.awbDetails.routingTo1")} className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm uppercase" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">By (1)</label>
                                    <input {...register("shippingDocuments.awbDetails.routingBy1")} className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm uppercase" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">To (2)</label>
                                    <input {...register("shippingDocuments.awbDetails.routingTo2")} className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm uppercase" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">By (2)</label>
                                    <input {...register("shippingDocuments.awbDetails.routingBy2")} className="w-full bg-white border border-slate-200 rounded-lg h-10 px-3 text-sm uppercase" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Payment & Valuation */}
                        <div className="grid grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Currency</label>
                                <input {...register("shippingDocuments.awbDetails.currencyCode")} defaultValue="INR" className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">CHGS Code</label>
                                <input {...register("shippingDocuments.awbDetails.chgsCode")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="PX" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">WT/VAL</label>
                                <select {...register("shippingDocuments.awbDetails.wtValPayment")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm">
                                    <option value="PPD">PPD</option>
                                    <option value="COLL">COLL</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Other</label>
                                <select {...register("shippingDocuments.awbDetails.otherPayment")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm">
                                    <option value="PPD">PPD</option>
                                    <option value="COLL">COLL</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">D.V. Carriage</label>
                                <input {...register("shippingDocuments.awbDetails.declaredValueCarriage")} defaultValue="NVD" className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">D.V. Customs</label>
                                <input {...register("shippingDocuments.awbDetails.declaredValueCustoms")} defaultValue="NCV" className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Amount of Insurance</label>
                                <input {...register("shippingDocuments.awbDetails.amountOfInsurance")} defaultValue="XXX" className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" />
                            </div>
                        </div>

                        {/* 4. Charges Breakdown */}
                        <div className="space-y-4 border-t border-slate-100 pt-6">
                            <h4 className="text-[12px] font-bold text-slate-700 uppercase flex items-center gap-2">
                                <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                                Charges Breakdown
                            </h4>
                            <div className="grid grid-cols-3 gap-4 font-bold text-[10px] text-slate-500 uppercase border-b border-slate-50 pb-1 px-2">
                                <div>Charge Type</div>
                                <div>Prepaid</div>
                                <div>Collect</div>
                            </div>
                            {[
                                { label: "Weight Charge", key: "weight" },
                                { label: "Valuation Charge", key: "valuation" },
                                { label: "Tax", key: "tax" },
                                { label: "Total Other Charges Due Agent", key: "otherAgent" },
                                { label: "Total Other Charges Due Carrier", key: "otherCarrier" },
                                { label: "Total Charges", key: "total" }
                            ].map((item) => (
                                <div key={item.key} className="grid grid-cols-3 gap-4 items-center bg-slate-50/50 p-2 rounded-lg">
                                    <div className="text-xs text-slate-600 font-medium">{item.label}</div>
                                    <input {...register(`shippingDocuments.awbDetails.charges.${item.key}.prepaid`)} className="bg-white border border-slate-200 rounded-md h-8 px-3 text-sm focus:ring-1 focus:ring-sky-500 outline-none" placeholder="AS AGREED" />
                                    <input {...register(`shippingDocuments.awbDetails.charges.${item.key}.collect`)} className="bg-white border border-slate-200 rounded-md h-8 px-3 text-sm focus:ring-1 focus:ring-sky-500 outline-none" />
                                </div>
                            ))}
                        </div>

                        {/* 5. Info & Execution */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Accounting Information</label>
                                <input {...register("shippingDocuments.awbDetails.accountingInformation")} defaultValue="FREIGHT PREPAID" className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="FREIGHT PREPAID" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Handling Information</label>
                                <textarea {...register("shippingDocuments.awbDetails.handlingInformation")} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm h-20" placeholder="e.g. Temperature controlled, Fragile..." />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Executed on (Date)</label>
                                    <input {...register("shippingDocuments.awbDetails.executedOnDate")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="DD/MM/YYYY" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Executed at (Place)</label>
                                    <input {...register("shippingDocuments.awbDetails.executedAtPlace")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="NEW DELHI" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* OCEAN FIELDS (Fully Synced) */
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">B/L Number</label>
                                <input {...register("shippingDocuments.bolDetails.bolNumber")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="e.g. ICM/BL/2026/001" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Booking Reference</label>
                                <input {...register("shippingDocuments.bolDetails.bookingReference")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="e.g. ICMPLDEL/UGKLA/169" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Container No.</label>
                                <input {...register("shippingDocuments.bolDetails.containerNumber")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="e.g. MSKU1234567" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Line Seal No.</label>
                                <input {...register("shippingDocuments.bolDetails.lineSealNumber")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="e.g. MLIN3226520" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Custom Seal No.</label>
                                <input {...register("shippingDocuments.bolDetails.customSealNumber")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="e.g. CUST654321" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">MTU Number</label>
                                <input {...register("shippingDocuments.bolDetails.mtuNumber")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="e.g. TRK-99281" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Freight Terms</label>
                                <select {...register("shippingDocuments.bolDetails.freightTerms")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm">
                                    <option value="Prepaid">Prepaid</option>
                                    <option value="Collect">Collect</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Freight Payable At</label>
                                <input {...register("shippingDocuments.bolDetails.freightPayableAt")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="AS ARRANGED" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">No. of Original B/Ls</label>
                                <input {...register("shippingDocuments.bolDetails.noOfOriginalBl")} defaultValue="THREE (3)" className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Place & Date of Issue</label>
                                <input {...register("shippingDocuments.bolDetails.placeAndDateOfIssue")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="e.g. NEW DELHI, 18-APR-2026" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Shipped On Board Date</label>
                                <input {...register("shippingDocuments.bolDetails.shippedOnBoardDate")} className="w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm" placeholder="27/02/2026" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Marks & Numbers</label>
                                <textarea {...register("shippingDocuments.bolDetails.marksAndNumbers")} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm h-20" placeholder="e.g. SHIPPER'S LOAD STOWAGE AND COUNT..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Handling Information</label>
                                <textarea {...register("shippingDocuments.bolDetails.handlingInformation")} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm h-20" placeholder="e.g. Temperature controlled, Fragile..." />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-2 justify-end mt-6">
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save & Lock Document"}
                    </Button>
                </div>
            </form>
        </Card>
    );
}