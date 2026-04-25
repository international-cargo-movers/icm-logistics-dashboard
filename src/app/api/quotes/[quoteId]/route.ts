import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getTenantModels } from '@/model/tenantModels';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Ensure this path matches

// GET: Fetch a single quote to populate the Edit Form
export async function GET(request: Request, { params }: { params: Promise<{ quoteId: string }> }) {
    try {
        await dbConnect();
        const { Quote } = await getTenantModels();
        const { quoteId } = await params;

        const quote = await Quote.findOne({ quoteId }).lean();

        if (!quote) {
            return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: quote });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT: Update an existing quote
export async function PUT(request: Request, { params }: { params: Promise<{ quoteId: string }> }) {
    try {
        await dbConnect();
        const { Quote } = await getTenantModels();

        // --- THE SERVER LOCK ---
        const session = await getServerSession(authOptions);

        // Block if not logged in, or if role is NOT SuperAdmin or Sales
        if (!session?.user?.role || !["SuperAdmin", "Sales", "Operations"].includes(session.user.role)) {
            return NextResponse.json({
                success: false,
                error: "Security Violation: You do not have clearance to modify quotes."
            }, { status: 403 });
        }
        // -----------------------

        const { quoteId } = await params;
        const body = await request.json();
        const { quoteData } = body;

        // We use .findOne() and .save() instead of findOneAndUpdate() 
        // to ensure our Mongoose pre-save hook (which calculates profit margins) fires correctly!
        const quote = await Quote.findOne({ quoteId });

        if (!quote) {
            return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
        }

        // Update the document properties
        quote.customerDetails.companyId = quoteData.customerId;
        quote.customerDetails.contactPerson = quoteData.customerName;
        quote.routingDetails = {
            originCountry: quoteData.originCountry,
            destinationCountry: quoteData.destinationCountry,

            originPort: quoteData.originPort,
            destinationPort: quoteData.destinationPort,
            mode: quoteData.mode
        };
        quote.cargoSummary = {
            commodity: quoteData.cargoSummary?.commodity || "General Cargo",
            equipment: quoteData.cargoSummary?.equipment,
            items: quoteData.cargoSummary?.items?.map((item: any) => ({
                description: item.description,
                noOfPackages: Number(item.noOfPackages) || 0,
                grossWeight: Number(item.grossWeight) || 0,
                volumetricWeight: Number(item.volumetricWeight) || 0,
            })) || [],
            totalNoOfPackages: Number(quoteData.totalNoOfPackages) || 0,
            totalGrossWeight: Number(quoteData.totalGrossWeight) || 0,
            totalVolumetricWeight: Number(quoteData.totalVolumetricWeight) || 0,
        };
        quote.validity.expiryDate = new Date(quoteData.validUntil);
        quote.financials.lineItems = quoteData.lineItems.map((item: any) => ({
            chargeName: item.chargeName,
            chargeType: item.chargeType,
            buyPrice: Number(item.buyPrice),
            sellPrice: Number(item.sellPrice),
            currency: item.currency || "USD",
            roe: Number(item.roe) || 1,
            notes: item.notes || ""
        }));

        // If it was rejected or draft, editing it moves it back to Draft/Sent depending on action
        if (quote.status === "Rejected") quote.status = "Draft";

        await quote.save();

        return NextResponse.json({ success: true, data: quote });
    } catch (error: any) {
        console.error("Update Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}