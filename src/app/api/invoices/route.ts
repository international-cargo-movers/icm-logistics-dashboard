import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import InvoiceModel from "@/model/InvoiceModel";
import "@/model/JobModel"

export async function POST(request:Request){
    try{
        await dbConnect()
        const body = await request.json();

        const newInvoice = await InvoiceModel.create(body);

        return NextResponse.json({success:true,data:newInvoice},{status:201});
    }catch(error:any){
        console.error("Database Error: ",error);
        return NextResponse.json(
            {success:false,error:error.message},
            {status:400}
        );
    }
}