import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InvoiceModel from '@/model/InvoiceModel';

export async function GET(request: Request, { params }: { params: { invoiceId: string } }) {
    try {
        await dbConnect();
        const resolvedParams = await params;
        // FIX: Search by the invoiceNo column instead of the hidden _id
        const invoice = await InvoiceModel.findOne({ invoiceNo: resolvedParams.invoiceId });
        
        if (!invoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: invoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { invoiceId: string } }) {
    try {
        await dbConnect();
        const body = await request.json();
        const resolvedParams  = await params;
        // FIX: Update the document by matching the invoiceNo column
        const updatedInvoice = await InvoiceModel.findOneAndUpdate(
            { invoiceNo: resolvedParams.invoiceId },
            body,
            { new: true, runValidators: true }
        );

        if (!updatedInvoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: updatedInvoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}