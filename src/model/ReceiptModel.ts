import mongoose, { Schema, Document } from "mongoose";

export interface IReceipt extends Document {
  receiptNo: string;
  date: Date;
  companyId: mongoose.Types.ObjectId;
  amount: number; // Base currency (INR)
  paymentMode: "Bank Transfer" | "Cheque" | "Cash" | "UPI";
  referenceNumber?: string; // UTR or Cheque No
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    receiptNo: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: { 
      type: String, 
      enum: ["Bank Transfer", "Cheque", "Cash", "UPI"], 
      required: true 
    },
    referenceNumber: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

const ReceiptModel = mongoose.models.Receipt || mongoose.model<IReceipt>("Receipt", ReceiptSchema);
export default ReceiptModel;