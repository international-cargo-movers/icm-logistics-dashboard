import mongoose, { Schema, Document } from "mongoose";

export interface ICarrierVehicle extends Document {
    name: string;        // e.g. "MAERSK KARACHI" or "EK501"
    type: "Sea" | "Air"; 
    code?: string;       // e.g. IMO number for vessels or Flight code
    carrierName?: string;// e.g. "Maersk Line" or "Emirates"
    isActive: boolean;
}

export const CarrierVehicleSchema = new Schema<ICarrierVehicle>(
    {
        name: { type: String, required: true, uppercase: true },
        type: { type: String, enum: ["Sea", "Air"], required: true },
        code: { type: String, uppercase: true },
        carrierName: { type: String },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Indexes for faster searching
CarrierVehicleSchema.index({ name: 1 });
CarrierVehicleSchema.index({ type: 1 });

export default mongoose.models.CarrierVehicle || mongoose.model<ICarrierVehicle>("CarrierVehicle", CarrierVehicleSchema);
