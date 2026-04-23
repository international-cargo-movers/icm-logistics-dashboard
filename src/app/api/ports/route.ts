import {NextResponse} from 'next/server'
import dbConnect from '@/lib/mongodb'
import { getAdminModels } from '@/model/tenantModels';

export async function GET(request:Request){
    try{
        await dbConnect();
        const { Port } = await getAdminModels();

        const {searchParams} = new URL(request.url);
        const countryCode = searchParams.get("countryCode");
        const type = searchParams.get("type");

        let query:any = {isActive:true};
        if(countryCode){
            query.countryCode = countryCode.toUpperCase();
        }

        if(type){
            query.type = type;
        }

        const ports = await Port.find(query).sort({name:1});
        return NextResponse.json({success:true,data:ports},{status:200})
    }catch(error:any){
        console.error("Error fetching Ports: ",error);
        return NextResponse.json({success:false,error:error.message},{status:500})
    }
}

export async function POST(request:Request){
    try{
        await dbConnect();
        const { Port } = await getAdminModels();
        const body = await request.json();

        if(Array.isArray(body)){
            const newPorts = await Port.insertMany(body);
            return NextResponse.json({success:true,data:newPorts},{status:201});
        }else {
            const newPort = await Port.create({
                name: body.name,
                locode: body.locode.toUpperCase(),
                country: body.country,
                countryCode: body.countryCode.toUpperCase(),
                type: body.type || ["Sea"],
                isActive: body.isActive !== undefined ? body.isActive : true
            });
            return NextResponse.json({ success: true, data: newPort }, { status: 201 });
        }
    }catch(error:any){
        if(error.code===11000){
            return NextResponse.json(
                {success:false,error:"A Port with the this UN/LOCODE already exists."},
                {status:400}
            )
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}