import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import JobModel from "@/model/JobModel";
import "@/model/CompanyModel"
import { success } from "zod";

export async function GET(){
    try{
        await dbConnect();
        const jobs = await JobModel.find({})
        .populate("customerDetails.companyId","name billingAddress")
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

        const body = await request.json();
        const jobId = `FR-${Math.floor(100000 + Math.random()*900000)}`;
        const newJob = await JobModel.create({...body,jobId});

        return NextResponse.json({success:true,data:newJob},{status:201});
    }catch(error:any){
        console.error("Database Error: ",error);
        return NextResponse.json(
            {success:false,error:error.message},
            {status:400}
        );
    }
}