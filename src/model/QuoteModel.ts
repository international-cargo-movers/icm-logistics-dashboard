import mongoose, { Schema, Document, Model } from "mongoose";


// 1. Interface for Financial Line Items
export interface IQuoteLineItem {
    chargeName: string;       // e.g., "Ocean Freight", "Customs Clearance"
    chargeType: string;       // e.g., "Origin", "Freight", "Destination"
    buyPrice: number;         // What you pay the vendor
    sellPrice: number;        // What you charge the customer
    currency: string;   
    roe: number;      // e.g., "USD", "EUR"
    notes?: string;           // Optional remarks for this specific charge
}

// 2. Main Interface for the Quote Document
export interface IQuote extends Document {
    quoteId: string;          // Auto-generated like "QT-2026-001"
    customerDetails: {
        companyId: mongoose.Types.ObjectId; // Links to CompanyModel
        contactPerson?: string;
    };
    routingDetails: {
        originCountry: string;      // NEW
        originPort: string;
        destinationCountry: string; // NEW
        destinationPort: string;
        mode: string;
    };
    cargoSummary: {
        commodity: string;
        equipment: string;        // e.g., "1x 40' HC" or "15 CBM"
        estimatedWeight: string;  // e.g., "12,500 kg"
    };
    validity: {
        issueDate: Date;
        expiryDate: Date;         // Critical for freight pricing
    };
    financials: {
        lineItems: IQuoteLineItem[];
        totalBuy: number;
        totalSell: number;
        profitMargin: number;
        baseCurrency: string;
    };
    status: "Draft" | "Sent" | "Approved" | "Rejected";
}

// 3. Mongoose Schema Definition
const QuoteSchema: Schema<IQuote> = new Schema(
    {
        quoteId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        customerDetails: {
            companyId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "CompanyModel",
                required: true
            },
            contactPerson: { type: String }
        },
        routingDetails: {
            originCountry: { type: String, required: true },      // NEW
            originPort: { type: String, required: true },
            destinationCountry: { type: String, required: true }, // NEW
            destinationPort: { type: String, required: true },
            mode: { type: String, required: true }
        },
        cargoSummary: {
            commodity: { type: String, default: "General Cargo" },
            equipment: { type: String, required: true },
            estimatedWeight: { type: String }
        },

        validity: {
            issueDate: { type: Date, default: Date.now },
            expiryDate: { type: Date, required: true }
        },
        financials: {
            lineItems: [
                {
                    chargeName: { type: String, required: true },
                    chargeType: { type: String, default: "Freight" },
                    buyPrice: { type: Number, required: true, default: 0 },
                    sellPrice: { type: Number, required: true, default: 0 },
                    currency: { type: String, default: "USD" },
                    roe: { type: Number, required: true, default: 1 },
                    notes: { type: String }
                }
            ],
            totalBuy: { type: Number, default: 0 },
            totalSell: { type: Number, default: 0 },
            profitMargin: { type: Number, default: 0 },
            baseCurrency: { type: String, default: "USD" }
        },
        status: {
            type: String,
            enum: ["Draft", "Sent", "Approved", "Rejected"],
            default: "Draft"
        }
    },
    {
        timestamps: true
    }
);

// 4. Pre-save Hook for Financial Calculation
// This automatically calculates totals and margins before saving to the database
// 4. Pre-save Hook for Financial Calculation
// Updated for modern Mongoose + TypeScript compatibility
QuoteSchema.pre("save", function (this: IQuote, next) {
    let calcTotalBuy = 0;
    let calcTotalSell = 0;

    if (this.financials && this.financials.lineItems) {
        this.financials.lineItems.forEach(item => {
            console.log(item.roe);
            // THE FIX: Multiply by ROE to get the base (INR) value
            const roe = item.roe || 1;
            calcTotalBuy += (item.buyPrice || 0) * roe;
            calcTotalSell += (item.sellPrice || 0) * roe;
        });
    }

    this.financials.totalBuy = calcTotalBuy;
    this.financials.totalSell = calcTotalSell;
    this.financials.profitMargin = calcTotalSell - calcTotalBuy;
    
    // Set base currency to INR since totals are now converted
    this.financials.baseCurrency = "INR"; 
});
const QuoteModel: Model<IQuote> = mongoose.models.Quote || mongoose.model<IQuote>("Quote", QuoteSchema);

export default QuoteModel;