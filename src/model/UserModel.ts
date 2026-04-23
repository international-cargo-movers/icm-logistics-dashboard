import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: "SuperAdmin" | "Finance" | "Operations" | "Sales" | "Viewer";
  isActive: boolean;
  lastLogin: Date;
}

export const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["SuperAdmin", "Finance", "Operations", "Sales", "Viewer"], 
    default: "Viewer" 
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

export default models.User || mongoose.model<IUser>("User", UserSchema);