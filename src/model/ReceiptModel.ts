import mongoose, { Schema, Document, models } from "mongoose";

export interface IReceipt extends Document {
    receiptNo: string;
    type: "Customer" | "Vendor" | "VendorBill";
    invoiceId: mongoose.Types.ObjectId; // Reference to Invoice, VendorInvoice or VendorBill
    invoiceNo: string;
    companyId: mongoose.Types.ObjectId; // Reference to CompanyModel
    companyName: string;
    amount: number;
    paymentDate: Date;
    paymentMode: "Bank Transfer" | "Cheque" | "Cash" | "Other";
    referenceNo: string; // UTR, Cheque No, etc.
    notes?: string;
    recordedBy: string; // User email or ID
}

export const ReceiptSchema = new Schema<IReceipt>({
    receiptNo: { type: String, required: true, unique: true },
    type: { type: String, enum: ["Customer", "Vendor", "VendorBill"], required: true },
    invoiceId: { type: Schema.Types.ObjectId, required: true },
    invoiceNo: { type: String, required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "CompanyModel", required: true },
    companyName: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now, required: true },
    paymentMode: { type: String, enum: ["Bank Transfer", "Cheque", "Cash", "Other"], default: "Bank Transfer" },
    referenceNo: { type: String, required: true },
    notes: { type: String },
    recordedBy: { type: String, required: true }
}, { timestamps: true });

export default models.FinancialReceipt || mongoose.model<IReceipt>("FinancialReceipt", ReceiptSchema);
