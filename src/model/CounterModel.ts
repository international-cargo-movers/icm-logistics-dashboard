import mongoose, { Schema, Document } from "mongoose";

export interface ICounter extends Document {
  model: string; // e.g., "job", "invoice", "quote", etc.
  seq: number;
}

export const CounterSchema = new Schema<ICounter>({
  model: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

// We'll use a unique index on model to ensure only one counter per type in each DB
CounterSchema.index({ model: 1 }, { unique: true });
