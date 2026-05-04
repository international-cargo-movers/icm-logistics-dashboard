import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getTenantModels } from '@/model/tenantModels';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ vendorInvoiceId: string }> }) {
    try {
        await dbConnect();
        const { VendorInvoice } = await getTenantModels();
        
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { vendorInvoiceId } = await params;
        const invoice = await VendorInvoice.findById(vendorInvoiceId);
        
        if (!invoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: invoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ vendorInvoiceId: string }> }) {
    try {
        await dbConnect();
        const { VendorInvoice } = await getTenantModels();
        
        const session = await getServerSession(authOptions);
        const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
        
        if (!session || !userRoles.some(r => ["SuperAdmin", "Finance", "Operations"].includes(r))) {
            return NextResponse.json({ 
                success: false, 
                error: "Security Violation: You do not have clearance to modify financial records." 
            }, { status: 403 });
        }

        const body = await request.json();
        const { vendorInvoiceId }  = await params;
        
        const existingInvoice = await VendorInvoice.findById(vendorInvoiceId);
        if (!existingInvoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });

        const amountPaid = existingInvoice.amountPaid || 0;
        const newNetAmount = body.totals?.netAmount || existingInvoice.totals.netAmount;
        const newBalanceDue = Math.max(0, newNetAmount - amountPaid);

        let newStatus = body.status || existingInvoice.status;
        if (amountPaid > 0) {
            newStatus = newBalanceDue <= 0.5 ? "Paid" : "Partially Paid";
        } else if (newStatus !== "Draft") {
            newStatus = "Unpaid";
        }

        const updatedInvoice = await VendorInvoice.findByIdAndUpdate(
            vendorInvoiceId,
            { 
                ...body, 
                balanceDue: newBalanceDue, 
                status: newStatus,
                amountPaid: amountPaid
            },
            { new: true, runValidators: true }
        );

        if (!updatedInvoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: updatedInvoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ vendorInvoiceId: string }> }) {
    try {
        await dbConnect();
        const { VendorInvoice } = await getTenantModels();
        
        const session = await getServerSession(authOptions);
        const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
        if (!session || !userRoles.includes("SuperAdmin")) {
            return NextResponse.json({ success: false, error: "Only SuperAdmins can delete records." }, { status: 403 });
        }

        const { vendorInvoiceId } = await params;
        const deletedInvoice = await VendorInvoice.findByIdAndDelete(vendorInvoiceId);

        if (!deletedInvoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        return NextResponse.json({ success: true, message: "Invoice deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
