import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InvoiceModel from '@/model/InvoiceModel';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Check this path matches your nextauth file!

export async function GET(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
    try {
        await dbConnect();
        
        // Optional: You can check session here too if you want to block unauthorized viewing
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const resolvedParams = await params;
        const invoice = await InvoiceModel.findOne({ invoiceNo: resolvedParams.invoiceId });
        
        if (!invoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: invoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
    try {
        await dbConnect();
        
        // --- THE SERVER LOCK ---
        const session = await getServerSession(authOptions);
        
        // If they are not logged in, OR they are a Viewer/Operations/Sales, block the request!
        if (!session || !["SuperAdmin", "Finance"].includes(session.user.role)) {
            return NextResponse.json({ 
                success: false, 
                error: "Security Violation: You do not have clearance to modify financial records." 
            }, { status: 403 });
        }
        // -----------------------

        const body = await request.json();
        const resolvedParams  = await params;
        
        const updatedInvoice = await InvoiceModel.findOneAndUpdate(
            { invoiceNo: resolvedParams.invoiceId },
            body,
            { new: true, runValidators: true }
        );

        if (!updatedInvoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: updatedInvoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}