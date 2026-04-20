import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InvoiceModel from "@/model/InvoiceModel";

export async function PATCH(
    request: Request, 
    { params }: { params: Promise<{ invoiceId: string }> }
) {
    try {
        await dbConnect();
        const { invoiceId } = await params;
        const { status } = await request.json();

        // Ensure we only update the status field and nothing else
        const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
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