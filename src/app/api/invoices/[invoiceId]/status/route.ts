import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";

export async function PATCH(
    request: Request, 
    { params }: { params: Promise<{ invoiceId: string }> }
) {
    try {
        await dbConnect();
        const { Invoice } = await getTenantModels();
        const { invoiceId } = await params;
        const { status } = await request.json();

        // Ensure we only update the status field and nothing else
        const updatedInvoice = await Invoice.findByIdAndUpdate(
            invoiceId,
            { $set: { status: status } },
            { new: true, runValidators: true }
        );

        if (!updatedInvoice) {
            return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedInvoice });
    } catch (error: any) {
        console.error("Status update error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}