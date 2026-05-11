import mongoose, { Schema, Document, models } from "mongoose";

export interface IVendorBillLineItem {
    slNo: number;
    description: string;
    hsnSac: string;
    quantityShipped: number;
    quantityBilled: number;
    unit: string; // e.g., "PCS"
    rate: number;
    amount: number; // rate * quantityBilled
    gstPercent: number; // e.g., 18
    cgstRate?: number; // 9
    cgstAmount?: number;
    sgstRate?: number; // 9
    sgstAmount?: number;
    igstRate?: number; // 18
    igstAmount?: number;
}

export interface IVendorBill extends Document {
    billNo: string;
    billDate: Date;
    jobId: mongoose.Types.ObjectId;
    jobReference: string;
    
    // Header Left
    sellerDetails: {
        vendorId: mongoose.Types.ObjectId;
        name: string;
        address: string;
        gstin: string;
        stateName: string;
        stateCode: string;
        email: string;
    };
    consigneeDetails: {
        name: string;
        address: string;
        gstin: string;
        stateName: string;
        stateCode: string;
    };
    buyerDetails: {
        name: string;
        address: string;
        gstin: string;
        stateName: string;
        stateCode: string;
        placeOfSupply: string;
    };

    // Header Right
    shippingDetails: {
        deliveryNote?: string;
        modeTermsOfPayment?: string;
        referenceNoAndDate?: string;
        otherReferences?: string;
        buyersOrderNo?: string;
        buyersOrderDated?: string;
        dispatchDocNo?: string;
        deliveryNoteDate?: string;
        dispatchedThrough?: string;
        destination?: string;
        vesselFlightNo?: string;
        placeOfReceiptByShipper?: string;
        portOfLoading?: string;
        portOfDischarge?: string;
        termsOfDelivery?: string;
    };

    lineItems: IVendorBillLineItem[];
    
    totals: {
        totalTaxableValue: number;
        totalCgstAmount: number;
        totalSgstAmount: number;
        totalIgstAmount: number;
        totalTaxAmount: number;
        netAmount: number;
        amountInWords: string;
        taxAmountInWords: string;
    };

    status: "Draft" | "Unpaid" | "Paid" | "Partially Paid";
    amountPaid: number;
    balanceDue: number;
}

export const VendorBillSchema = new Schema<IVendorBill>({
    billNo: { type: String, required: true, unique: true },
    billDate: { type: Date, default: Date.now, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    jobReference: { type: String, required: true },

    sellerDetails: {
        vendorId: { type: Schema.Types.ObjectId, ref: "CompanyModel", required: true },
        name: { type: String, required: true },
        address: { type: String, required: true },
        gstin: { type: String },
        stateName: { type: String },
        stateCode: { type: String },
        email: { type: String },
    },
    consigneeDetails: {
        name: { type: String },
        address: { type: String },
        gstin: { type: String },
        stateName: { type: String },
        stateCode: { type: String },
    },
    buyerDetails: {
        name: { type: String },
        address: { type: String },
        gstin: { type: String },
        stateName: { type: String },
        stateCode: { type: String },
        placeOfSupply: { type: String },
    },
    shippingDetails: {
        deliveryNote: String,
        modeTermsOfPayment: String,
        referenceNoAndDate: String,
        otherReferences: String,
        buyersOrderNo: String,
        buyersOrderDated: String,
        dispatchDocNo: String,
        deliveryNoteDate: String,
        dispatchedThrough: String,
        destination: String,
        vesselFlightNo: String,
        placeOfReceiptByShipper: String,
        portOfLoading: String,
        portOfDischarge: String,
        termsOfDelivery: String,
    },
    lineItems: [{
        slNo: Number,
        description: { type: String, required: true },
        hsnSac: String,
        quantityShipped: { type: Number, default: 0 },
        quantityBilled: { type: Number, default: 0 },
        unit: { type: String, default: "PCS" },
        rate: { type: Number, required: true },
        amount: { type: Number },
        gstPercent: { type: Number, default: 0 },
        cgstRate: Number,
        cgstAmount: Number,
        sgstRate: Number,
        sgstAmount: Number,
        igstRate: Number,
        igstAmount: Number,
    }],
    totals: {
        totalTaxableValue: { type: Number, default: 0 },
        totalCgstAmount: { type: Number, default: 0 },
        totalSgstAmount: { type: Number, default: 0 },
        totalIgstAmount: { type: Number, default: 0 },
        totalTaxAmount: { type: Number, default: 0 },
        netAmount: { type: Number, default: 0 },
        amountInWords: String,
        taxAmountInWords: String,
    },
    status: { type: String, enum: ["Draft", "Unpaid", "Paid", "Partially Paid"], default: "Draft" },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
}, { timestamps: true });

VendorBillSchema.pre("save", function (this: IVendorBill) {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const isInterState = this.buyerDetails.stateCode !== this.sellerDetails.stateCode;

    this.lineItems.forEach(item => {
        item.amount = item.rate * item.quantityBilled;
        totalTaxable += item.amount;

        if (isInterState) {
            item.igstRate = item.gstPercent;
            item.igstAmount = item.amount * (item.igstRate / 100);
            item.cgstRate = 0;
            item.cgstAmount = 0;
            item.sgstRate = 0;
            item.sgstAmount = 0;
            totalIgst += item.igstAmount;
        } else {
            item.cgstRate = item.gstPercent / 2;
            item.cgstAmount = item.amount * (item.cgstRate / 100);
            item.sgstRate = item.gstPercent / 2;
            item.sgstAmount = item.amount * (item.sgstRate / 100);
            item.igstRate = 0;
            item.igstAmount = 0;
            totalCgst += item.cgstAmount;
            totalSgst += item.sgstAmount;
        }
    });

    this.totals.totalTaxableValue = totalTaxable;
    this.totals.totalCgstAmount = totalCgst;
    this.totals.totalSgstAmount = totalSgst;
    this.totals.totalIgstAmount = totalIgst;
    this.totals.totalTaxAmount = totalCgst + totalSgst + totalIgst;
    this.totals.netAmount = Math.round(totalTaxable + this.totals.totalTaxAmount);
    this.balanceDue = this.totals.netAmount - (this.amountPaid || 0);

});

export default models.VendorBill || mongoose.model<IVendorBill>("VendorBill", VendorBillSchema);
