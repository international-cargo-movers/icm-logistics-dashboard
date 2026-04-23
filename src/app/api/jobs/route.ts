import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(){
    try{
        await dbConnect();
        const { Job } = await getTenantModels();
        const jobs = await Job.find({})
        .populate("customerDetails.companyId","name streetAddress state taxId zipCode defaultSalesPerson country city")
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
        
        // Block if not logged in, or if role is NOT SuperAdmin or Sales
        if (!session?.user?.role || !["SuperAdmin", "Operations"].includes(session.user.role)) {
            return NextResponse.json({ 
                success: false, 
                error: "Security Violation: You do not have clearance to create sales quotes." 
            }, { status: 403 });
        }

        const body = await request.json();
        const jobId = `FR-${Math.floor(100000 + Math.random()*900000)}`;
        const newJob = await Job.create({...body,jobId});

        return NextResponse.json({success:true,data:newJob},{status:201});
    }catch(error:any){
        console.error("Database Error: ",error);
        return NextResponse.json(
            {success:false,error:error.message},
            {status:400}
        );
    }
}