import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InvoiceModel from "@/model/InvoiceModel";

export async function GET(
    request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        // Fetch Invoices for this company
        const invoices = await InvoiceModel.find({ "customerDetails.companyId": id }).lean();
        
        const invoiceTracker = invoices.map((inv: any) => {
            const invoiceDate = new Date(inv.invoiceDate || inv.createdAt);
            
            // Calculate Due Date (Assuming standard Net 30 terms)
            // You can change the '30' below if your terms are different
            const dueDate = new Date(invoiceDate);
            dueDate.setDate(dueDate.getDate() + 30); 

            return {
                id: inv._id,
                date: invoiceDate,
                reference: inv.invoiceNo,
                status: inv.status || "Unpaid",
                amount: inv.totals?.netAmount || 0,
                notes: `Job: ${inv.jobReference}`,
                dueDate: dueDate,
                // Mongoose automatically updates the 'updatedAt' timestamp when we run the PATCH request
                paidAt: inv.status === "Paid" ? inv.updatedAt : null 
            };
        });

        // Sort newest invoices first
        invoiceTracker.sort((a, b) => b.date.getTime() - a.date.getTime());

        return NextResponse.json({ success: true, data: invoiceTracker });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}