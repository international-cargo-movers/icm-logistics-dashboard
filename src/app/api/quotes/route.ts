import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QuoteModel from '@/model/QuoteModel';
// Import CompanyModel to ensure it's registered before populate()
import '@/model/CompanyModel';
import CompanyModel from '@/model/CompanyModel';

export async function GET() {
    try {
        await dbConnect();
        
        console.log("Registered Schema: ",CompanyModel.modelName)
        // Fetch all quotes, newest first, and dynamically pull the Company Name
        const quotes = await QuoteModel.find()
            .populate('customerDetails.companyId', 'name')
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
        const body = await request.json();
        const { quoteId, status } = body;

        if (!quoteId || !status) {
            return NextResponse.json({ success: false, error: "Missing quoteId or status" }, { status: 400 });
        }

        // Update the status (e.g., from "Sent" to "Approved")
        const updatedQuote = await QuoteModel.findOneAndUpdate(
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