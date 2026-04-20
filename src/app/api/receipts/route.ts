import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ReceiptModel from "@/model/ReceiptModel";

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Create the new receipt in the database
        const newReceipt = await ReceiptModel.create(body);

        return NextResponse.json({ success: true, data: newReceipt }, { status: 201 });
    } catch (error: any) {
        // Handle E11000 duplicate key errors cleanly if the receiptNo already exists
        if (error.code === 11000) {
             return NextResponse.json({ success: false, error: "Receipt Number must be unique." }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}