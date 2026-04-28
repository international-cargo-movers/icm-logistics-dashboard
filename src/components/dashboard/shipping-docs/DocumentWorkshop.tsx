import React from 'react';
import { useFormContext, useWatch } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { FileText, Anchor, Plane } from "lucide-react";

export default function DocumentWorkshop() {
  const { register, control } = useFormContext();
  const mode = useWatch({ control, name: "mode" }) || "";
  const isAir = mode.toLowerCase().includes("air");

  return (
    <Card className="p-6 bg-white border border-slate-200 shadow-sm mt-8">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-bold text-slate-900">Document Workshop</h2>
      </div>

      {isAir ? (
        /* --- AIRWAY BILL FIELDS --- */
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sky-600 mb-2">
            <Plane className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">HAWB Legal Details</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">AWB Prefix (3 Digit)</label>
              <input {...register("shippingDocuments.awbDetails.awbPrefix")} maxLength={3} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm font-mono" placeholder="217" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">AWB Serial (8 Digit)</label>
              <input {...register("shippingDocuments.awbDetails.awbSerialNumber")} maxLength={8} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm font-mono" placeholder="52695995" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">HAWB Number</label>
              <input {...register("shippingDocuments.awbDetails.hawbNumber")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="ICMICN064" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Accounting Information</label>
              <input {...register("shippingDocuments.awbDetails.accountingInformation")} defaultValue="FREIGHT PREPAID" className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Handling Information</label>
            <textarea {...register("shippingDocuments.awbDetails.handlingInformation")} className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm h-20" placeholder="e.g. Temperature controlled, Fragile..." />
          </div>
        </div>
      ) : (
        /* --- BILL OF LADING FIELDS --- */
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Anchor className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Ocean B/L Legal Details</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">B/L Number</label>
              <input {...register("shippingDocuments.bolDetails.bolNumber")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="e.g. ICM/24-25/001" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Booking Reference</label>
              <input {...register("shippingDocuments.bolDetails.bookingReference")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="e.g. ICMPLDEL/UGKLA/169" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Container No.</label>
              <input {...register("shippingDocuments.bolDetails.containerNumber")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="e.g. MSKU1234567" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Line Seal No.</label>
              <input {...register("shippingDocuments.bolDetails.lineSealNumber")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="e.g. MLIN3226520" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Custom Seal No.</label>
              <input {...register("shippingDocuments.bolDetails.customSealNumber")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="e.g. CUST654321" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">MTU Number</label>
              <input {...register("shippingDocuments.bolDetails.mtuNumber")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="e.g. TRK-99281" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Freight Payable At</label>
              <input {...register("shippingDocuments.bolDetails.freightPayableAt")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="AS ARRANGED" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">No. of Original B/Ls</label>
              <input {...register("shippingDocuments.bolDetails.noOfOriginalBl")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="THREE (3)" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Place & Date of Issue</label>
              <input {...register("shippingDocuments.bolDetails.placeAndDateOfIssue")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="MUMBAI - 27/02/2026" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Shipped On Board Date</label>
              <input {...register("shippingDocuments.bolDetails.shippedOnBoardDate")} className="w-full bg-slate-50 border-none rounded-lg h-10 px-3 text-sm" placeholder="27/02/2026" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Marks & Numbers</label>
              <textarea {...register("shippingDocuments.bolDetails.marksAndNumbers")} className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm h-20" placeholder="e.g. SHIPPER'S LOAD STOWAGE AND COUNT..." />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Handling Information</label>
              <textarea {...register("shippingDocuments.bolDetails.handlingInformation")} className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm h-20" placeholder="e.g. Temperature controlled, Fragile..." />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}