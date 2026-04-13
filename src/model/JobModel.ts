import mongoose, { Schema, Document, models } from "mongoose";

export interface IJob extends Document {
    jobId: string;
    quoteReference?: string; // NEW: The link to the Approved Quote
    customerDetails: {
        companyId: mongoose.Types.ObjectId; 
        enquiryDate?: Date;
        customerInvoiceNo?: string;
        customerInvoiceDate?: Date;
        salesPerson?: string;
        taxId?: string;
        streetAddress?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    partyDetails: {
        shipperId?: mongoose.Types.ObjectId; 
        consigneeId?: mongoose.Types.ObjectId; 
        notifyPartyId?: mongoose.Types.ObjectId;   // NEW
        overseasAgentId?: mongoose.Types.ObjectId; // NEW
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
        netWeight?: number;      // NEW
        dimensions?: string;     // NEW
        carrier?: string;
        etd?: Date;
        eta?: Date;
        leoDate?: Date;
        services?: string;
        jobStatus: "Processing" | "Pending" | "Completed" | "Cancel";
    };
    vendorDetails: [{
        vendorId: mongoose.Types.ObjectId; 
        assignedTask?: string;
    }];
}

const JobSchema = new Schema<IJob>({
    jobId: { type: String, required: true, unique: true },
    quoteReference: { type: String }, // NEW
    customerDetails: {
        companyId: { type: Schema.Types.ObjectId, ref: "CompanyModel", required: true },
        enquiryDate: { type: Date },
        customerInvoiceNo: { type: String },
        customerInvoiceDate: { type: Date },
        salesPerson: { type: String },
        taxId: { type: String },
        streetAddress: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String },
    },
    partyDetails: {
        shipperId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },
        consigneeId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },
        notifyPartyId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },   // NEW
        overseasAgentId: { type: Schema.Types.ObjectId, ref: "CompanyModel" }, // NEW
    },
    shipmentDetails: {
        mode: { type: String, required: true }, 
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
        netWeight: { type: Number },  // NEW
        dimensions: { type: String }, // NEW
        carrier: { type: String },
        etd: { type: Date },
        eta: { type: Date },
        leoDate: { type: Date },
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