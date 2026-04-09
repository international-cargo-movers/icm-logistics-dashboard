import mongoose, { Schema, Document, models } from "mongoose";
// import CompanyModel from "./CompanyModel";

export interface IJob extends Document {
    jobId: string;
    customerDetails: {
        companyId: mongoose.Types.ObjectId; //Links to CompanyModel
        enquiryDate?: Date;
        customerInvoiceNo?: string;
        customerInvoiceDate?: Date;
        shipperId?: mongoose.Types.ObjectId; //Links to CompanyModel
        consigneeId?: mongoose.Types.ObjectId;
    };
    partyDetails: {
        shipperId?: mongoose.Types.ObjectId; // Links to CompanyModel
        consigneeId?: mongoose.Types.ObjectId; // Links to CompanyModel
    };

    shipmentDetails: {
        mode: string;
        polCountry?: string;
        portOfLoading?: string;
        podCountry?: string;
        portOfDischarge?: string;
    };
    cargoDetails: {
        commodity?: string;
        noOfPackages?: number;
        packageUnit?: string;
        grossWeight?: number;
        grossWeightUnit?: string;
        carrier?: string;
        etd?: Date;
        eta?: Date;
        leoDate?: Date;
        overseasAgent?: string;
        services?: string;
        jobStatus: "Processing" | "Pending" | "Completed" | "Cancel";
    };
    vendorDetails: [{
        vendorId: mongoose.Types.ObjectId; //Links to CompanyModel
        assignedTask?: string;
    }];
}

const JobSchema = new Schema<IJob>({
    jobId: { type: String, required: true, unique: true },
    customerDetails: {
        companyId: { type: Schema.Types.ObjectId, ref: "CompanyModel", required: true },
        enquiryDate: { type: Date },
        customerInvoiceNo: { type: String },
        customerInvoiceDate: { type: Date },
        shipperId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },
        consigneeId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },

    },
    partyDetails: {
        shipperId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },
        consigneeId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },
    },
    shipmentDetails: {
        mode: { type: String, required: true }, // Marked with * in UI
        polCountry: { type: String },
        portOfLoading: { type: String },
        podCountry: { type: String },
        portOfDischarge: { type: String },
    },

    cargoDetails: {
        commodity: { type: String },
        noOfPackages: { type: Number },
        packageUnit: { type: String },
        grossWeight: { type: Number },
        grossWeightUnit: { type: String },
        carrier: { type: String },
        etd: { type: Date },
        eta: { type: Date },
        leoDate: { type: Date },
        overseasAgent: { type: String },
        services: { type: String },
        jobStatus: {
            type: String,
            enum: ["Processing", "Pending", "Completed", "Cancel"],
            default: "Processing",
        },
    },
    vendorDetails: [{
        vendorId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },
        assignedTask: { type: String }
    }]
}, { timestamps: true });

export default models.Job || mongoose.model<IJob>("Job", JobSchema);