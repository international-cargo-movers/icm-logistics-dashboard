import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { Job } = await getTenantModels();
        const { id } = await params;
        const body = await request.json();

        // 1. Fetch the job first to ensure it exists and to work with the document
        const job = await Job.findById(id);
        if (!job) {
            return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
        }

        // 2. Initialize shippingDocuments if missing
        if (!job.shippingDocuments) {
            job.shippingDocuments = {};
        }

        // 3. Update BolDetails if provided in body
        if (body.bolDetails) {
            if (!job.shippingDocuments.bolDetails) {
                job.shippingDocuments.bolDetails = {};
            }
            // Merge existing fields with new fields from body
            for (const key in body.bolDetails) {
                job.shippingDocuments.bolDetails[key] = body.bolDetails[key];
            }
        }

        // 4. Update AwbDetails if provided in body
        if (body.awbDetails) {
            if (!job.shippingDocuments.awbDetails) {
                job.shippingDocuments.awbDetails = {};
            }
            // Merge existing fields with new fields from body
            for (const key in body.awbDetails) {
                job.shippingDocuments.awbDetails[key] = body.awbDetails[key];
            }
        }

        // 5. Mark modified and save
        job.markModified("shippingDocuments");
        await job.save();

        return NextResponse.json({ success: true, data: job });
    } catch (error: any) {
        console.error("Docs Update Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}