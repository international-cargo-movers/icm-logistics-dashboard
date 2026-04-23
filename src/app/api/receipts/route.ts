import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReceiptModel from "@/model/ReceiptModel";
import InvoiceModel from "@/model/InvoiceModel";
import VendorInvoiceModel from "@/model/VendorInvoiceModel";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
    try {
        await dbConnect();
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { type, invoiceId, amount, paymentDate, paymentMode, referenceNo, notes } = body;

        // 1. Basic Validation
        if (!type || !invoiceId || !amount || !referenceNo) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // 2. Fetch the target invoice
        let invoice;
        let Model;
        if (type === "Customer") {
            Model = InvoiceModel;
            invoice = await InvoiceModel.findById(invoiceId);
        } else {
            Model = VendorInvoiceModel;
            invoice = await VendorInvoiceModel.findById(invoiceId);
        }

        if (!invoice) {
            return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        }

        // 3. Generate Receipt Number
        const receiptNo = `RCT-${Date.now()}`;

        // 4. Create the Receipt Record
        await ReceiptModel.create({
            receiptNo,
            type,
            invoiceId,
            invoiceNo: type === "Customer" ? invoice.invoiceNo : invoice.vendorInvoiceNo,
            companyId: type === "Customer" ? invoice.customerDetails.companyId : invoice.vendorDetails.vendorId,
            companyName: type === "Customer" ? invoice.customerDetails.name : invoice.vendorDetails.name,
            amount: Number(amount),
            paymentDate,
            paymentMode,
            referenceNo,
            notes,
            recordedBy: session.user?.email || "System"
        });

        // 5. RECALCULATE TOTAL PAID FROM ALL RECEIPTS (Source of Truth)
        // This ensures math never drifts and always matches the sum of receipts
        const allReceipts = await ReceiptModel.find({ invoiceId });
        const totalAmountPaid = allReceipts.reduce((sum, rct) => sum + (Number(rct.amount) || 0), 0);
        
        const totalBilled = Number(invoice.totals.netAmount) || 0;
        const newBalanceDue = Math.max(0, totalBilled - totalAmountPaid);

        // 6. Determine Status based on Truth
        // We use a small buffer (0.5) for floating point safety if needed
        let newStatus = "Partially Paid";
        if (newBalanceDue <= 0.5) {
            newStatus = "Paid";
        } else if (totalAmountPaid === 0) {
            newStatus = "Unpaid";
        }

        const updateData = {
            amountPaid: totalAmountPaid,
            balanceDue: newBalanceDue,
            status: newStatus
        };

        const updatedInvoice = await Model.findByIdAndUpdate(invoiceId, { $set: updateData }, { new: true });

        return NextResponse.json({ 
            success: true, 
            data: updatedInvoice,
            message: `Recorded payment of ₹${amount}. New Balance: ₹${newBalanceDue}` 
        }, { status: 201 });

    } catch (error: any) {
        console.error("Receipt API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get("invoiceId");

        const query = invoiceId ? { invoiceId } : {};
        const receipts = await ReceiptModel.find(query).sort({ paymentDate: -1 });

        return NextResponse.json({ success: true, data: receipts });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
