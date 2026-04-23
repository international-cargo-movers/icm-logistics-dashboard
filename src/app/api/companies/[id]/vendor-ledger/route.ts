import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import VendorInvoiceModel from "@/model/VendorInvoiceModel";
import ReceiptModel from "@/model/ReceiptModel";

export async function GET(
    request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        // 1. Fetch all Vendor Invoices for this vendor
        const vendorInvoices = await VendorInvoiceModel.find({ "vendorDetails.vendorId": id }).lean();
        
        // 2. Fetch all Receipts for this vendor
        const receipts = await ReceiptModel.find({ companyId: id, type: "Vendor" }).lean();

        // 3. Map Vendor Invoices to transaction format
        const invoiceTransactions = vendorInvoices.map((inv: any) => {
            const invoiceDate = new Date(inv.vendorInvoiceDate || inv.createdAt);
            const dueDate = new Date(invoiceDate);
            dueDate.setDate(dueDate.getDate() + 30); 

            return {
                id: inv._id.toString(),
                type: "Invoice",
                date: invoiceDate,
                reference: inv.vendorInvoiceNo,
                status: inv.status || "Unpaid",
                amount: inv.totals?.netAmount || 0,
                amountPaid: inv.amountPaid || 0,
                balanceDue: inv.balanceDue ?? (inv.status === "Paid" ? 0 : inv.totals?.netAmount || 0),
                notes: `Job: ${inv.jobReference}`,
                dueDate: dueDate,
                createdAt: inv.createdAt
            };
        });

        // 4. Map Receipts to transaction format
        const receiptTransactions = receipts.map((rct: any) => {
            return {
                id: rct._id.toString(),
                type: "Receipt",
                date: new Date(rct.paymentDate),
                reference: rct.receiptNo,
                invoiceNo: rct.invoiceNo,
                status: "Cleared",
                amount: 0, 
                amountPaid: rct.amount,
                balanceDue: 0,
                notes: `Disbursement for ${rct.invoiceNo} (${rct.referenceNo})`,
                paymentMode: rct.paymentMode,
                createdAt: rct.createdAt
            };
        });

        // 5. Combine and Sort (Newest first)
        const combinedLedger = [...invoiceTransactions, ...receiptTransactions];
        combinedLedger.sort((a, b) => {
            const dateDiff = b.date.getTime() - a.date.getTime();
            if (dateDiff !== 0) return dateDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return NextResponse.json({ success: true, data: combinedLedger });

    } catch (error: any) {
        console.error("Vendor Ledger API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
