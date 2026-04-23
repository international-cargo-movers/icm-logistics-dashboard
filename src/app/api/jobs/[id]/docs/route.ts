import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import JobModel from "@/model/JobModel";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        // Update shippingDocuments sub-fields explicitly to avoid overwriting the whole object
        const updateData: any = {};
        if (body.awbDetails) {
            for (const key in body.awbDetails) {
                updateData[`shippingDocuments.awbDetails.${key}`] = body.awbDetails[key];
            }
        }
        if (body.bolDetails) {
            for (const key in body.bolDetails) {
                updateData[`shippingDocuments.bolDetails.${key}`] = body.bolDetails[key];
            }
        }

        const updatedJob = await JobModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return NextResponse.json({ success: true, data: updatedJob });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}