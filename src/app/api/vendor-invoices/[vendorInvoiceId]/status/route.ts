import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";

export async function PATCH(
    request: Request, 
    { params }: { params: Promise<{ vendorInvoiceId: string }> }
) {
    try {
        await dbConnect();
        const { VendorInvoice } = await getTenantModels();
        const { vendorInvoiceId } = await params;
        const { status } = await request.json();

        // Ensure we only update the status field and nothing else
        const updatedVendorInvoice = await VendorInvoice.findByIdAndUpdate(
            vendorInvoiceId,
            { $set: { status: status } },
            { new: true, runValidators: true }
        );

        if (!updatedVendorInvoice) {
            return NextResponse.json({ success: false, error: "Vendor Invoice not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedVendorInvoice });
    } catch (error: any) {
        console.error("Status update error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
