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
        equipment?: string;
        containerCount?: number;
        containerType?: string;
        totalCBM?: number;
        items: {
            description?: string;
            hsnCode?: string;
            noOfPackages?: number;
            packageUnit?: string;
            grossWeight?: number;
            netWeight?: number;
            volumetricWeight?: number;
            dimensions?: string;
        }[];
        totalNoOfPackages?: number;
        totalGrossWeight?: number;
        totalNetWeight?: number;
        totalVolumetricWeight?: number;
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
      containerNumber?: string;
      lineSealNumber?: string;
      customSealNumber?: string;
      noOfOriginalBl?: string; // e.g., "THREE (3)" [cite: 14]
      placeAndDateOfIssue?: string; // e.g., "MUMBAI - 27/02/2026" [cite: 14]
      shippedOnBoardDate?: string;
      handlingInformation?: string;
      mtuNumber?: string;
    };

    // Airway Bill Specifics 
    awbDetails?: {
      awbPrefix?: string; // 3-digit airline code, e.g., "217" 
      awbSerialNumber?: string; // 8-digit serial 
      hawbNumber?: string; // e.g., "ICMICN064" 
      iataCode?: string; // Agent's IATA code 
      shipperAccountNumber?: string;
      consigneeAccountNumber?: string;
      accountingInformation?: string;
      declaredValueCarriage?: string; // Default: "NVD" 
      declaredValueCustoms?: string; // Default: "NCV" 
      handlingInformation?: string; // 
      airportOfDeparture?: string; // e.g., "DEL" 
      airportOfDestination?: string; // e.g., "ICN" 
      requestedRouting?: string; // 
      routingTo1?: string;
      routingBy1?: string;
      routingTo2?: string;
      routingBy2?: string;
      currencyCode?: string;
      chgsCode?: string;
      wtValPayment?: "PPD" | "COLL";
      otherPayment?: "PPD" | "COLL";
      amountOfInsurance?: string;
      charges?: {
          weight?: { prepaid?: string; collect?: string };
          valuation?: { prepaid?: string; collect?: string };
          tax?: { prepaid?: string; collect?: string };
          otherAgent?: { prepaid?: string; collect?: string };
          otherCarrier?: { prepaid?: string; collect?: string };
          total?: { prepaid?: string; collect?: string };
      };
      executedOnDate?: string;
      executedAtPlace?: string;
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

export const JobSchema = new Schema<IJob>({
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
        polCountry: { type: Schema.Types.Mixed },
        portOfLoading: { type: Schema.Types.Mixed },
        podCountry: { type: Schema.Types.Mixed },
        portOfDischarge: { type: Schema.Types.Mixed },
    },
    cargoDetails: {
        commodity: { type: String },
        equipment: { type: String },
        containerCount: { type: Number },
        containerType: { type: String },
        totalCBM: { type: Number },
        items: [{
            description: String,
            hsnCode: String,
            noOfPackages: Number,
            packageUnit: String,
            grossWeight: Number,
            netWeight: Number,
            volumetricWeight: Number,
            dimensions: String,
        }],
        totalNoOfPackages: { type: Number, default: 0 },
        totalGrossWeight: { type: Number, default: 0 },
        totalNetWeight: { type: Number, default: 0 },
        totalVolumetricWeight: { type: Number, default: 0 },
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
            bolNumber: { type: String },
            freightPayableAt: { type: String },
            bookingReference: { type: String },
            freightTerms: { type: String, enum: ["Prepaid", "Collect"], default: "Prepaid" },
            marksAndNumbers: { type: String },
            containerNumber: { type: String },
            lineSealNumber: { type: String },
            customSealNumber: { type: String },
            sealNumber: { type: String }, // Keep for backward compatibility if needed
            noOfOriginalBl: { type: String, default: "THREE (3)" },
            placeAndDateOfIssue: { type: String },
            shippedOnBoardDate: { type: String },
            handlingInformation: { type: String },
            mtuNumber: { type: String },
        },
        // Airway Bill Specifics
        awbDetails: {
            awbPrefix: String, // 3-digit airline code
            awbSerialNumber: String, // 8-digit serial
            hawbNumber: String,
            iataCode: String,
            shipperAccountNumber: { type: String },
            consigneeAccountNumber: { type: String },
            accountingInformation: { type: String, default: "FREIGHT PREPAID" },
            declaredValueCarriage: { type: String, default: "NVD" },
            declaredValueCustoms: { type: String, default: "NCV" },
            handlingInformation: String,
            airportOfDeparture: String,
            airportOfDestination: String,
            routingTo1: String,
            routingBy1: String,
            routingTo2: String,
            routingBy2: String,
            currencyCode: { type: String, default: "INR" },
            chgsCode: String,
            wtValPayment: { type: String, enum: ["PPD", "COLL"], default: "PPD" },
            otherPayment: { type: String, enum: ["PPD", "COLL"], default: "PPD" },
            amountOfInsurance: { type: String, default: "XXX" },
            charges: {
                weight: { prepaid: String, collect: String },
                valuation: { prepaid: String, collect: String },
                tax: { prepaid: String, collect: String },
                otherAgent: { prepaid: String, collect: String },
                otherCarrier: { prepaid: String, collect: String },
                total: { prepaid: String, collect: String }
            },
            executedOnDate: String,
            executedAtPlace: String,
        }
    }
}, { timestamps: true });

export default models.Job || mongoose.model<IJob>("Job", JobSchema);