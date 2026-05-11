import mongoose, { Schema, Document, models } from "mongoose";

export interface ICustomerBillLineItem {
    description: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    unitPriceUSD: number;
    amountUSD: number;
    unitPriceINR: number;
    taxableAmountINR: number;
    gstPercentage: number;
    gstAmountINR: number;
    totalAmountINR: number;
}

export interface ICustomerBill extends Document {
    billNo: string;
    billDate: Date;
    jobId: mongoose.Types.ObjectId;
    jobReference: string;

    // Header Details
    exporterDetails: {
        name: string;
        address: string;
        gstin: string;
        iecNo: string;
        exporterRef: string;
    };
    consigneeDetails: {
        customerId?: mongoose.Types.ObjectId;
        name: string;
        address: string;
        tel?: string;
        poBox?: string;
        country: string;
    };
    buyerDetails?: {
        name: string;
        address: string;
        country: string;
    };

    // Shipping & Metadata
    shippingDetails: {
        preCarriageBy?: string;
        placeOfReceipt?: string;
        vesselFlightNo?: string;
        portOfLoading?: string;
        portOfDischarge?: string;
        finalDestination?: string;
        marksAndNumbers?: string;
        countryOfOrigin?: string;
        countryOfDestination?: string;
        buyersOrderNo?: string;
        buyersOrderDate?: string;
        adCode?: string;
        termsOfDeliveryPayment?: string;
    };

    // Bank Details (for Commercial Invoice)
    bankDetails: {
        bankName: string;
        accountNo: string;
        branchAddress: string;
        swiftCode: string;
        ifscCode: string;
    };

    lineItems: ICustomerBillLineItem[];
    
    financials: {
        exchangeRate: number;
        totalUSD: number;
        totalTaxableINR: number;
        totalGstINR: number;
        totalAmountINR: number;
        amountInWordsUSD: string;
        amountInWordsINR: string;
    };

    status: "Draft" | "Unpaid" | "Paid" | "Partially Paid";
    amountPaid: number;
    balanceDue: number;
}

export const CustomerBillSchema = new Schema<ICustomerBill>({
    billNo: { type: String, required: true, unique: true },
    billDate: { type: Date, default: Date.now, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    jobReference: { type: String, required: true },

    exporterDetails: {
        name: { type: String, default: "INTERNATIONAL CARGO MOVERS" },
        address: { type: String, default: "193A, BASEMENT ARJUN NAGAR, SAFDARJUNG ENCLAVE, NEW DELHI-110029, INDIA" },
        gstin: { type: String, default: "07ACDPR6690N1ZU" },
        iecNo: { type: String, default: "0512091251" },
        exporterRef: String,
    },
    consigneeDetails: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        tel: String,
        poBox: String,
        country: { type: String, required: true },
    },
    buyerDetails: {
        name: String,
        address: String,
        country: String,
    },
    shippingDetails: {
        preCarriageBy: String,
        placeOfReceipt: String,
        vesselFlightNo: String,
        portOfLoading: String,
        portOfDischarge: String,
        finalDestination: String,
        marksAndNumbers: String,
        countryOfOrigin: { type: String, default: "INDIA" },
        countryOfDestination: String,
        buyersOrderNo: String,
        buyersOrderDate: String,
        adCode: { type: String, default: "6380006" },
        termsOfDeliveryPayment: { type: String, default: "PAYMENT : ADVANCE" },
    },
    bankDetails: {
        bankName: { type: String, default: "ICICI BANK" },
        accountNo: { type: String, default: "032205500481" },
        branchAddress: { type: String, default: "A1/15, SAFDARJUNG ENCLAVE NEW DELHI-110029, INDIA" },
        swiftCode: { type: String, default: "ICICINBBCTS" },
        ifscCode: { type: String, default: "ICIC0000322" },
    },
    lineItems: [{
        description: { type: String, required: true },
        hsnCode: String,
        quantity: { type: Number, default: 0 },
        unit: { type: String, default: "PCS" },
        unitPriceUSD: { type: Number, default: 0 },
        amountUSD: { type: Number, default: 0 },
        unitPriceINR: { type: Number, default: 0 },
        taxableAmountINR: { type: Number, default: 0 },
        gstPercentage: { type: Number, default: 0 },
        gstAmountINR: { type: Number, default: 0 },
        totalAmountINR: { type: Number, default: 0 },
    }],
    financials: {
        exchangeRate: { type: Number, default: 1 },
        totalUSD: { type: Number, default: 0 },
        totalTaxableINR: { type: Number, default: 0 },
        totalGstINR: { type: Number, default: 0 },
        totalAmountINR: { type: Number, default: 0 },
        amountInWordsUSD: String,
        amountInWordsINR: String,
    },
    status: { type: String, enum: ["Draft", "Unpaid", "Paid", "Partially Paid"], default: "Draft" },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
}, { timestamps: true });

CustomerBillSchema.pre("save", function (this: ICustomerBill) {
    let tUSD = 0;
    let tTaxableINR = 0;
    let tGstINR = 0;
    let tTotalINR = 0;

    const exRate = this.financials.exchangeRate || 1;

    this.lineItems.forEach(item => {
        // Calculations for USD (Commercial)
        item.amountUSD = (item.unitPriceUSD || 0) * (item.quantity || 0);
        tUSD += item.amountUSD;

        // Calculations for INR (Tax)
        // If unitPriceINR is not provided, we can derive it from USD if needed, 
        // but typically user will provide it or we calculate it from exchange rate.
        if (!item.unitPriceINR && item.unitPriceUSD) {
            item.unitPriceINR = item.unitPriceUSD * exRate;
        }
        
        item.taxableAmountINR = (item.unitPriceINR || 0) * (item.quantity || 0);
        item.gstAmountINR = item.taxableAmountINR * ((item.gstPercentage || 0) / 100);
        item.totalAmountINR = item.taxableAmountINR + item.gstAmountINR;

        tTaxableINR += item.taxableAmountINR;
        tGstINR += item.gstAmountINR;
        tTotalINR += item.totalAmountINR;
    });

    this.financials.totalUSD = tUSD;
    this.financials.totalTaxableINR = tTaxableINR;
    this.financials.totalGstINR = tGstINR;
    this.financials.totalAmountINR = tTotalINR;
    
    // In actual app, amountPaid and balanceDue should probably follow INR for customer accounting
    this.balanceDue = tTotalINR - (this.amountPaid || 0);


});

export default models.CustomerBill || mongoose.model<ICustomerBill>("CustomerBill", CustomerBillSchema);
