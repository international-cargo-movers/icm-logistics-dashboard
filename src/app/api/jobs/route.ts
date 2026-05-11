import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJobNumber, generateHawbNumber, generateHblNumber } from "@/lib/sequencing";

export async function GET(){
    try{
        await dbConnect();
        const { Job } = await getTenantModels();
        const jobs = await Job.find({})
        .populate("customerDetails.companyId","name streetAddress state taxId zipCode defaultSalesPerson country city")
        .populate("partyDetails.shipperId")
        .populate("partyDetails.consigneeId")
        .populate("partyDetails.notifyPartyId")
        .populate("partyDetails.overseasAgentId")
        .populate("vendorDetails.vendorId")
        .sort({createdAt:-1});

        return NextResponse.json({success:true,data:jobs},{status:200});
    }catch(error:any){
        console.error("Failed to fetch Jobs: ",error);
        return NextResponse.json(
            {success:false,error:error.message},
            {status:500}
        )
    }
}

export async function POST(request:Request){
    try{
        await dbConnect();
        const { Job } = await getTenantModels();

        const session = await getServerSession(authOptions);
        
        // Block if not logged in, or if role is NOT SuperAdmin or Operations
        const allowedRoles = ["SuperAdmin", "Operations"];
        const hasAccess = session?.user?.roles?.some((r: string) => allowedRoles.includes(r)) || 
                         allowedRoles.includes(session?.user?.role || "");

        if (!session || !hasAccess) {
            return NextResponse.json({ 
                success: false, 
                error: "Security Violation: You do not have clearance to create jobs." 
            }, { status: 403 });
        }

        const body = await request.json();
        
        // Generate Sequence-based IDs
        const jobId = await generateJobNumber(body.shipmentDetails?.mode || "");
        
        // Auto-generate HAWB/HBL if missing and mode matches
        let updatedBody = { ...body, jobId };
        const mode = (body.shipmentDetails?.mode || "").toLowerCase();
        const destPort = body.shipmentDetails?.portOfDischarge || "";

        if (!body.shippingDocuments?.awbDetails?.hawbNumber && mode.includes("air")) {
            const hawb = await generateHawbNumber(destPort);
            updatedBody = {
                ...updatedBody,
                shippingDocuments: {
                    ...updatedBody.shippingDocuments,
                    awbDetails: {
                        ...(updatedBody.shippingDocuments?.awbDetails || {}),
                        hawbNumber: hawb
                    }
                }
            };
        }

        if (!body.shippingDocuments?.bolDetails?.bolNumber && mode.includes("sea")) {
            const hbl = await generateHblNumber(destPort);
            updatedBody = {
                ...updatedBody,
                shippingDocuments: {
                    ...updatedBody.shippingDocuments,
                    bolDetails: {
                        ...(updatedBody.shippingDocuments?.bolDetails || {}),
                        bolNumber: hbl
                    }
                }
            };
        }

        const newJob = await Job.create(updatedBody);

        return NextResponse.json({success:true,data:newJob},{status:201});
    }catch(error:any){
        console.error("Database Error: ",error);
        return NextResponse.json(
            {success:false,error:error.message},
            {status:400}
        );
    }
}