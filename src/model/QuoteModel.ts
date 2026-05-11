import mongoose, { Schema, Document } from "mongoose";

// 1. Interface for Financial Line Items
export interface IQuoteLineItem {
    chargeName: string;       // e.g., "Ocean Freight", "Customs Clearance"
    chargeType: string;       // e.g., "Origin", "Freight", "Destination"
    buyPrice: number;         // What you pay the vendor
    sellPrice: number;        // What you charge the customer
    currency: string;   
    roe: number;              // e.g., "USD", "EUR"
    quantity: number;         // Multiplier for the price
    notes?: string;           // Optional remarks for this specific charge
    gstPercent?: number;      // GST Percentage
    gstAmount?: number;       // Calculated GST Amount (Sell)
}

// 2. Main Quote Interface
export interface IQuote extends Document {
    quoteId: string;
    customerDetails: {
        companyId: mongoose.Types.ObjectId;
        contactPerson?: string;
    };
    routingDetails: {
        originCountry: string;
        originPort: string;
        destinationCountry: string;
        destinationPort: string;
        mode: string;
    };
    cargoSummary: {
        commodity: string;
        equipment?: string;
        containerCount?: number;
        containerType?: string;
        totalCBM?: number;
        items: {
            description?: string;
            hsnCode?: string;
            noOfPackages?: number;
            grossWeight?: number;
            volumetricWeight?: number;
        }[];
        totalNoOfPackages: number;
        totalGrossWeight: number;
        totalVolumetricWeight: number;
    };
    validity: {
        issueDate: Date;
        expiryDate: Date;
    };
    financials: {
        lineItems: IQuoteLineItem[];
        totalBuy: number;
        totalSell: number;
        profitMargin: number;
        baseCurrency: string;
        totalGst: number;
        netTotal: number;
    };
    status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired" | "Approved";
}

const RoutingDetailsSchema = new Schema({
    originCountry: { type: Schema.Types.Mixed, required: true },
    originPort: { type: Schema.Types.Mixed, required: true },
    destinationCountry: { type: Schema.Types.Mixed, required: true },
    destinationPort: { type: Schema.Types.Mixed, required: true },
    mode: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

// 3. Schema Definition
export const QuoteSchema = new Schema<IQuote>({
    quoteId: { type: String, required: true, unique: true },
    customerDetails: {
        companyId: { type: Schema.Types.ObjectId, ref: "CompanyModel", required: true },
        contactPerson: { type: String }
    },
    routingDetails: { type: RoutingDetailsSchema, required: true },
    cargoSummary: {
        commodity: { type: String, default: "General Cargo" },
        equipment: { type: String },
        containerCount: { type: Number },
        containerType: { type: String },
        totalCBM: { type: Number },
        items: [{
            description: String,
            hsnCode: String,
            noOfPackages: Number,
            grossWeight: Number,
            volumetricWeight: Number
        }],
        totalNoOfPackages: { type: Number, default: 0 },
        totalGrossWeight: { type: Number, default: 0 },
        totalVolumetricWeight: { type: Number, default: 0 }
    },
    validity: {
        issueDate: { type: Date, default: Date.now },
        expiryDate: { type: Date }
    },
    financials: {
        lineItems: [
            {
                chargeName: { type: String, required: true },
                chargeType: { type: String, default: "Other" },
                buyPrice: { type: Number, required: true, default: 0 },
                sellPrice: { type: Number, required: true, default: 0 },
                currency: { type: String, default: "USD" },
                roe: { type: Number, required: true, default: 1 },
                quantity: { type: Number, required: true, default: 1 },
                notes: { type: String },
                gstPercent: { type: Number, default: 18 },
                gstAmount: { type: Number, default: 0 }
            }
        ],
        totalBuy: { type: Number, default: 0 },
        totalSell: { type: Number, default: 0 },
        profitMargin: { type: Number, default: 0 },
        baseCurrency: { type: String, default: "USD" },
        totalGst: { type: Number, default: 0 },
        netTotal: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ["Draft", "Sent", "Accepted", "Rejected", "Expired", "Approved"],
        default: "Draft"
    }
}, { timestamps: true });

// 4. Pre-save middleware to calculate totals
QuoteSchema.pre("save", function (this: IQuote, next) {
    let calcTotalBuy = 0;
    let calcTotalSell = 0;
    let calcTotalGst = 0;

    if (this.financials && this.financials.lineItems) {
        this.financials.lineItems.forEach(item => {
            const roe = item.roe || 1;
            const quantity = item.quantity || 1;
            const baseSell = (item.sellPrice || 0) * roe * quantity;
            
            calcTotalBuy += (item.buyPrice || 0) * roe * quantity;
            calcTotalSell += baseSell;
            
            const gstAmount = baseSell * ((item.gstPercent || 0) / 100);
            item.gstAmount = gstAmount;
            calcTotalGst += gstAmount;
        });
    }

    this.financials.totalBuy = calcTotalBuy;
    this.financials.totalSell = calcTotalSell;
    this.financials.profitMargin = calcTotalSell - calcTotalBuy;
    this.financials.totalGst = calcTotalGst;
    this.financials.netTotal = calcTotalSell + calcTotalGst;
    
    // Set base currency to INR since totals are now converted
    this.financials.baseCurrency = "INR"; 
    next();
});

export default mongoose.models.Quote || mongoose.model<IQuote>("Quote", QuoteSchema);
