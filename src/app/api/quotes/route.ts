import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getTenantModels } from '@/model/tenantModels';

export async function GET() {
    try {
        await dbConnect();
        const { Quote, Company } = await getTenantModels();
        
        console.log("Registered Schema: ", Company.modelName)
        // Fetch all quotes, newest first, and dynamically pull the Company Name
        const quotes = await Quote.find()
            .populate({ path: 'customerDetails.companyId', select: 'name', strictPopulate: false })
            .sort({ createdAt: -1 })
            .lean();
            
        return NextResponse.json({ success: true, data: quotes });
    } catch (error: any) {
        console.error("Fetch Quotes Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        await dbConnect();
        const { Quote } = await getTenantModels();
        const body = await request.json();
        const { quoteId, status } = body;

        if (!quoteId || !status) {
            return NextResponse.json({ success: false, error: "Missing quoteId or status" }, { status: 400 });
        }

        // Update the status (e.g., from "Sent" to "Approved")
        const updatedQuote = await Quote.findOneAndUpdate(
            { quoteId },
            { status },
            { new: true }
        );

        return NextResponse.json({ success: true, data: updatedQuote });
    } catch (error: any) {
        console.error("Update Quote Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}