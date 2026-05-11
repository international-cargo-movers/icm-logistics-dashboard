import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { getTenantModels } from '@/model/tenantModels';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
    try {
        await dbConnect();
        const { Invoice } = await getTenantModels();
        
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const resolvedParams = await params;
        const id = resolvedParams.invoiceId;

        // Try to find by _id first if it's a valid ObjectId, then by invoiceNo
        let invoice;
        if (mongoose.isValidObjectId(id)) {
            invoice = await Invoice.findById(id);
        }
        
        if (!invoice) {
            invoice = await Invoice.findOne({ invoiceNo: id });
        }
        
        if (!invoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: invoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
    try {
        await dbConnect();
        const { Invoice } = await getTenantModels();
        
        const session = await getServerSession(authOptions);
        
        const allowedRoles = ["SuperAdmin", "Finance", "Operations"];
        const hasAccess = session?.user?.roles?.some((r: string) => allowedRoles.includes(r)) || 
                         allowedRoles.includes(session?.user?.role || "");

        if (!session || !hasAccess) {
            return NextResponse.json({ 
                success: false, 
                error: "Security Violation: You do not have clearance to modify financial records." 
            }, { status: 403 });
        }

        const body = await request.json();
        const resolvedParams  = await params;
        const id = resolvedParams.invoiceId;
        
        // Try to find by _id first, then by invoiceNo
        let existingInvoice;
        if (mongoose.isValidObjectId(id)) {
            existingInvoice = await Invoice.findById(id);
        }
        
        if (!existingInvoice) {
            existingInvoice = await Invoice.findOne({ invoiceNo: id });
        }

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

        const updatedInvoice = await Invoice.findOneAndUpdate(
            { _id: existingInvoice._id },
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