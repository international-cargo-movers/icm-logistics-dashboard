import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        await dbConnect();
        const { VendorInvoice, Job } = await getTenantModels();
        
        // 1. Fetch vendor invoices and POPULATE the jobId field from the Job collection
        const vendorInvoices = await VendorInvoice.find({})
            .populate("jobId", "jobId") // Looks up the Job and grabs its custom 'jobId' string
            .sort({ createdAt: -1 })
            .lean();

        // 2. Flatten the populated object so the frontend receives a clean string
        const formattedVendorInvoices = vendorInvoices.map((inv: any) => ({
            ...inv,
            // Because of populate(), inv.jobId is now an object: { _id: "...", jobId: "FR-595212" }
            // We extract just the custom string here:
            jobId: inv.jobId?.jobId || inv.jobId 
        }));

        return NextResponse.json({ success: true, data: formattedVendorInvoices });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { VendorInvoice } = await getTenantModels();

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
        const newVendorInvoice = await VendorInvoice.create(body);

        return NextResponse.json({ success: true, data: newVendorInvoice }, { status: 201 });
    } catch (error: any) {
        console.error("Database Error: ", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
