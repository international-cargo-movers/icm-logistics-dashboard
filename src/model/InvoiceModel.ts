import mongoose, { Schema, Document, models } from "mongoose";

export interface ILineItem {
    description: string;
    sacCode: string;
    rate: number;
    currency: string;
    roe: number;
    gstPercent: number;
    taxableValue: number;
    gstAmount: number;
}

export interface IInvoice extends Document {
    invoiceNo: string;
    invoiceDate: Date;
    jobId: mongoose.Types.ObjectId; 
    jobReference: string; // <-- NEW: Stores "JOB-2026-001" safely
    
    customerDetails: {
        companyId: mongoose.Types.ObjectId;
        name: string;
        billingAddress?: string;
        gstin?: string;
        stateCode?: string; 
        email?: string;
    };
    shipmentSnapshot: {
        origin?: string; destination?: string; pol?: string; pod?: string;
        oblMawb?: string; hblHawb?: string; vesselFlight?: string; 
        commodity?: string; grossWeight?: number; volumetricWeight?: number; 
        chargeableWeight?: number; noOfPackages?: number; containerNo?: string;  
        egm?: string; igm?: string; sbNo?: string;         
    };
    lineItems: ILineItem[];
    totals: {
        totalTaxable: number; totalGst: number; roundOff: number;
        netAmount: number; amountInWords: string; 
    };
    amountPaid: number;
    balanceDue: number;
    status: "Draft" | "Unpaid" | "Paid" | "Overdue" | "Partially Paid";
}

export const InvoiceSchema = new Schema<IInvoice>({
    invoiceNo: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, default: Date.now, required: true },
    
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    jobReference: { type: String, required: true }, // <-- NEW: Allowed in DB

    customerDetails: {
        companyId: { type: Schema.Types.ObjectId, ref: "CompanyModel", required: true },
        name: { type: String, required: true },
        billingAddress: { type: String, required: true },
        gstin: { type: String }, stateCode: { type: String }, email: { type: String },
    },
    shipmentSnapshot: {
        origin: { type: String }, destination: { type: String }, pol: { type: String },
        pod: { type: String }, oblMawb: { type: String }, hblHawb: { type: String },
        vesselFlight: { type: String }, commodity: { type: String }, grossWeight: { type: Number },
        volumetricWeight: { type: Number }, chargeableWeight: { type: Number }, noOfPackages: { type: Number },
        containerNo: { type: String }, egm: { type: String }, igm: { type: String }, sbNo: { type: String },
    },
    lineItems: [{
        description: { type: String, required: true }, sacCode: { type: String },
        rate: { type: Number, required: true }, currency: { type: String, default: "INR" },
        roe: { type: Number, default: 1 }, gstPercent: { type: Number, required: true },
        taxableValue: { type: Number, required: true }, gstAmount: { type: Number, required: true }
    }],
    totals: {
        totalTaxable: { type: Number, required: true }, totalGst: { type: Number, required: true },
        roundOff: { type: Number, default: 0 }, netAmount: { type: Number, required: true },
        amountInWords: { type: String }
    },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: function() { 
        return this.totals?.netAmount || 0; 
    }},
    status: {
        type: String, enum: ["Draft", "Unpaid", "Paid", "Overdue", "Partially Paid"], default: "Draft"
    }
}, { timestamps: true });

export default models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);