import mongoose, { Schema, Document, models } from "mongoose";

// 1. Define the TypeScript Interface for a single Document
export interface IJobDocument {
    _id?: mongoose.Types.ObjectId;
    fileName: string;
    fileUrl: string;
    format?: string;
    uploadedBy: string;
    uploadedAt: Date;
}

export interface IJob extends Document {
    jobId: string;
    quoteReference?: string;
    customerDetails: {
        companyId: mongoose.Types.ObjectId; // Just the ID! The single source of truth.
        enquiryDate?: Date;                 // Job-specific
        customerInvoiceNo?: string;         // Job-specific
        customerInvoiceDate?: Date;         // Job-specific
    };
    partyDetails: {
        shipperId?: mongoose.Types.ObjectId;
        consigneeId?: mongoose.Types.ObjectId;
        notifyPartyId?: mongoose.Types.ObjectId;
        overseasAgentId?: mongoose.Types.ObjectId;
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
        netWeight?: number;
        dimensions?: string;
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
    documents: IJobDocument[];
    shippingDocuments?: {
    // Ocean / Multimodal Bill of Lading Specifics [cite: 14]
    bolDetails?: {
      bolNumber?: string;
      bookingReference?: string; // e.g., ICMPLDEL/UGKLA/169 [cite: 14]
      freightPayableAt?: string; // e.g., "AS ARRANGED" [cite: 14]
      freightTerms?: "Prepaid" | "Collect"; // [cite: 14]
      marksAndNumbers?: string; // e.g., Container/Seal details [cite: 14]
      sealNumber?: string; // [cite: 14]
      noOfOriginalBl?: string; // e.g., "THREE (3)" [cite: 14]
      placeAndDateOfIssue?: string; // e.g., "MUMBAI - 27/02/2026" [cite: 14]
    };

    // Airway Bill Specifics 
    awbDetails?: {
      awbPrefix?: string; // 3-digit airline code, e.g., "217" 
      awbSerialNumber?: string; // 8-digit serial 
      hawbNumber?: string; // e.g., "ICMICN064" 
      iataCode?: string; // Agent's IATA code 
      declaredValueCarriage?: string; // Default: "NVD" 
      declaredValueCustoms?: string; // Default: "NCV" 
      handlingInformation?: string; // 
      airportOfDeparture?: string; // e.g., "DEL" 
      airportOfDestination?: string; // e.g., "ICN" 
      requestedRouting?: string; // 
    };
  };
}

// 3. Create the Mongoose Sub-Schema for the Document Vault
const DocumentSchema = new Schema({
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    format: { type: String },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const JobSchema = new Schema<IJob>({
    jobId: { type: String, required: true, unique: true },
    quoteReference: { type: String },
    customerDetails: {
        companyId: { type: Schema.Types.ObjectId, ref: "CompanyModel", required: true },
        enquiryDate: { type: Date },
        customerInvoiceNo: { type: String },
        customerInvoiceDate: { type: Date },
    },
    partyDetails: {
        shipperId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },
        consigneeId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },
        notifyPartyId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },
        overseasAgentId: { type: Schema.Types.ObjectId, ref: "CompanyModel" },
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
        netWeight: { type: Number },
        dimensions: { type: String },
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
    }],
    documents: {
        type: [DocumentSchema],
        default: []
    },
    shippingDocuments: {
        // Ocean Bill of Lading Specifics
        bolDetails: {
            bolNumber: String,
            freightPayableAt: String,
            bookingReference:{type:String},
            freightTerms: { type: String, enum: ["Prepaid", "Collect"], default: "Prepaid" },
            marksAndNumbers: String,
            sealNumber: String,
            noOfOriginalBl: { type: String, default: "THREE (3)" },
            placeAndDateOfIssue: String,
        },
        // Airway Bill Specifics
        awbDetails: {
            awbPrefix: String, // 3-digit airline code
            awbSerialNumber: String, // 8-digit serial
            hawbNumber: String,
            iataCode: String,
            declaredValueCarriage: { type: String, default: "NVD" },
            declaredValueCustoms: { type: String, default: "NCV" },
            handlingInformation: String,
            airportOfDeparture: String,
            airportOfDestination: String,
        }
    }
}, { timestamps: true });

export default models.Job || mongoose.model<IJob>("Job", JobSchema);