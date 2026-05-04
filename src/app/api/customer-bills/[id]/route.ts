import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getTenantModels } from '@/model/tenantModels';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { CustomerBill } = await getTenantModels();
        
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const resolvedParams = await params;
        const bill = await CustomerBill.findOne({ billNo: resolvedParams.id });
        
        if (!bill) return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: bill });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { CustomerBill } = await getTenantModels();
        
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
        
        const existingBill = await CustomerBill.findOne({ billNo: resolvedParams.id });
        if (!existingBill) return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });

        const amountPaid = existingBill.amountPaid || 0;
        // Financials follow INR for consistency in balance tracking
        const newNetAmount = body.financials?.totalAmountINR || existingBill.financials.totalAmountINR;
        const newBalanceDue = Math.max(0, newNetAmount - amountPaid);

        let newStatus = body.status || existingBill.status;
        if (amountPaid > 0) {
            newStatus = newBalanceDue <= 0.5 ? "Paid" : "Partially Paid";
        } else if (newStatus !== "Draft") {
            newStatus = "Unpaid";
        }

        const updatedBill = await CustomerBill.findOneAndUpdate(
            { billNo: resolvedParams.id },
            { 
                ...body, 
                balanceDue: newBalanceDue, 
                status: newStatus,
                amountPaid: amountPaid
            },
            { new: true, runValidators: true }
        );

        if (!updatedBill) return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: updatedBill });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { CustomerBill } = await getTenantModels();
        
        const session = await getServerSession(authOptions);
        const isSuperAdmin = session?.user?.roles?.includes("SuperAdmin") || session?.user?.role === "SuperAdmin";
        if (!session || !isSuperAdmin) {
            return NextResponse.json({ success: false, error: "Only SuperAdmins can delete records." }, { status: 403 });
        }

        const resolvedParams = await params;
        const deletedBill = await CustomerBill.findOneAndDelete({ billNo: resolvedParams.id });

        if (!deletedBill) return NextResponse.json({ success: false, error: "Bill not found" }, { status: 404 });
        return NextResponse.json({ success: true, message: "Bill deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
