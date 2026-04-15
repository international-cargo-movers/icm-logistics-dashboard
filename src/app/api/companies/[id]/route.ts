import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyModel from "@/model/CompanyModel";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const body = await request.json();

        // 1. Prepare the update payload
        const updatePayload: any = { ...body };

        // 2. THE FIX: If the frontend sends 'email', map it to 'contactEmail' for Mongoose
        if (body.email) {
            updatePayload.contactEmail = body.email;
            delete updatePayload.email; // Clean up the invalid key
        }
        const resolvedParams = await params;
        const updatedCompany = await CompanyModel.findByIdAndUpdate(
             resolvedParams.id,
            { $set: updatePayload },
            { new: true, runValidators: true }
        );

        if (!updatedCompany) {
            return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedCompany }, { status: 200 });

    } catch (error: any) {
        console.error("Error updating company:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}