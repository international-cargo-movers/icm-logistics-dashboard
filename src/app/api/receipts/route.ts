import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { Receipt, Invoice, VendorInvoice, VendorBill } = await getTenantModels();
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
            Model = Invoice;
            invoice = await Invoice.findById(invoiceId);
        } else if (type === "Vendor") {
            Model = VendorInvoice;
            invoice = await VendorInvoice.findById(invoiceId);
        } else if (type === "VendorBill") {
            Model = VendorBill;
            invoice = await VendorBill.findById(invoiceId);
        }

        if (!invoice) {
            return NextResponse.json({ success: false, error: "Invoice/Bill not found" }, { status: 404 });
        }

        // 3. Generate Receipt Number
        const receiptNo = `RCT-${Date.now()}`;

        // 4. Create the Receipt Record
        let invoiceNo = "";
        let companyId;
        let companyName = "";

        if (type === "Customer") {
            invoiceNo = invoice.invoiceNo;
            companyId = invoice.customerDetails.companyId;
            companyName = invoice.customerDetails.name;
        } else if (type === "Vendor") {
            invoiceNo = invoice.vendorInvoiceNo;
            companyId = invoice.vendorDetails.vendorId;
            companyName = invoice.vendorDetails.name;
        } else if (type === "VendorBill") {
            invoiceNo = invoice.billNo;
            companyId = invoice.sellerDetails.vendorId;
            companyName = invoice.sellerDetails.name;
        }

        await Receipt.create({
            receiptNo,
            type,
            invoiceId,
            invoiceNo,
            companyId,
            companyName,
            amount: Number(amount),
            paymentDate,
            paymentMode,
            referenceNo,
            notes,
            recordedBy: session.user?.email || "System"
        });

        // 5. RECALCULATE TOTAL PAID FROM ALL RECEIPTS (Source of Truth)
        const allReceipts = await Receipt.find({ invoiceId });
        const totalAmountPaid = allReceipts.reduce((sum, rct) => sum + (Number(rct.amount) || 0), 0);
        
        const totalBilled = Number(invoice.totals.netAmount) || 0;
        const newBalanceDue = Math.max(0, totalBilled - totalAmountPaid);

        // 6. Determine Status based on Truth
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
        const { Receipt } = await getTenantModels();
        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get("invoiceId");

        const query = invoiceId ? { invoiceId } : {};
        const receipts = await Receipt.find(query).sort({ paymentDate: -1 });

        return NextResponse.json({ success: true, data: receipts });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
