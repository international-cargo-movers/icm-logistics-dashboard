import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InvoiceModel from "@/model/InvoiceModel";
import "@/model/JobModel"
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Make sure this path is correct for your app!

export async function GET() {
    try {
        await dbConnect();
        // Grabs all invoices, sorted by newest first
        const invoices = await InvoiceModel.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, data: invoices });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();

        // --- THE SERVER LOCK ---
        const session = await getServerSession(authOptions);
        
        // Block if not logged in, or if role is NOT SuperAdmin or Finance
        if (!session?.user?.role || !["SuperAdmin", "Finance"].includes(session.user.role)) {
            return NextResponse.json({ 
                success: false, 
                error: "Security Violation: You do not have clearance to create financial records." 
            }, { status: 403 });
        }
        // -----------------------

        const body = await request.json();
        const newInvoice = await InvoiceModel.create(body);

        return NextResponse.json({ success: true, data: newInvoice }, { status: 201 });
    } catch (error: any) {
        console.error("Database Error: ", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}