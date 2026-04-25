import mongoose, { Schema, Document } from "mongoose";
import { getAdminModel } from "./ModelRegistry";

export interface IFinancialItem extends Document {
  name: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const FinancialItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: { type: String, trim: true },
  },
  { timestamps: true }
);

export async function getFinancialItemModel() {
  return getAdminModel<IFinancialItem>("FinancialItem", FinancialItemSchema);
}
