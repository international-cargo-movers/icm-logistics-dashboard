import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyModel from "@/model/CompanyModel";

export async function GET(){
    try{
        await dbConnect();

        const companies = await CompanyModel.find({}).sort({name:1});
        return NextResponse.json({success:true,data:companies},{status:200});
    }catch(error:any){
        console.log("Error fetching Companies: ",error)
        return NextResponse.json({success:false,error:error.message},{status:500});
    }
}

export async function POST(request:Request){
    try{
        await dbConnect();

        const body = await request.json();

        const newCompany = await CompanyModel.create({
            name: body.name,
            type: body.type || ["Customer"],
            defaultSalesPerson: body.defaultSalesPerson || body.salesPerson, // fallback just in case
            taxId: body.taxId,
            streetAddress: body.streetAddress,
            city: body.city,
            state: body.state,
            zipCode: body.zipCode,
            country: body.country
        });
        return NextResponse.json({success:true,data:newCompany},{status:201})
    }catch(error:any){
        return NextResponse.json({success:false,error:error.message},{status:500});
    }
}