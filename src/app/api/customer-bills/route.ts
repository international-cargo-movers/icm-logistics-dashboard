import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        await dbConnect();
        const { CustomerBill } = await getTenantModels();
        
        const bills = await CustomerBill.find({})
            .populate("jobId", "jobId")
            .sort({ createdAt: -1 })
            .lean();

        const formattedBills = bills.map((bill: any) => ({
            ...bill,
            jobId: bill.jobId?.jobId || bill.jobId 
        }));

        return NextResponse.json({ success: true, data: formattedBills });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
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
                error: "Security Violation: You do not have clearance to create financial records." 
            }, { status: 403 });
        }

        const body = await request.json();
        const newBill = await CustomerBill.create(body);

        return NextResponse.json({ success: true, data: newBill }, { status: 201 });
    } catch (error: any) {
        console.error("Database Error: ", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
