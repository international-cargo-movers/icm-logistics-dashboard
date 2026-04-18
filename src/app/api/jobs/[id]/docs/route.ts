import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import JobModel from "@/model/JobModel";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        const updatedJob = await JobModel.findByIdAndUpdate(
            id,
            { $set: { shippingDocuments: body } },
            { returnDocument: 'after', runValidators: true }
        );

        return NextResponse.json({ success: true, data: updatedJob });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}