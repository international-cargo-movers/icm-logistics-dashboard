import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";

// GET: Fetch the specific job data to populate the edit form
export async function GET(
    request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { Job } = await getTenantModels();
        const { id } = await params;
        
        // Populate the companyId so the frontend has the full customer object if needed
        const job = await Job.findById(id).populate("customerDetails.companyId");
        
        if (!job) {
            return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, data: job });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT: Update the job with the edited data (including shipping documents)
export async function PUT(
    request: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { Job } = await getTenantModels();
        const { id } = await params;
        const body = await request.json();

        const updatedJob = await Job.findByIdAndUpdate(
            id,
            { $set: body },
            { returnDocument: 'after', runValidators: true }
        );

        return NextResponse.json({ success: true, data: updatedJob });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}