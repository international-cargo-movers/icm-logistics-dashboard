import {NextResponse} from 'next/server'
import dbConnect from '@/lib/mongodb'
import { getAdminModels } from '@/model/tenantModels';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request:Request){
    try{
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
        const session = await getServerSession(authOptions);
        const allowedRoles = ["SuperAdmin", "Finance", "Sales", "Operations"];
        const hasAccess = session?.user?.roles?.some((r: string) => allowedRoles.includes(r)) || 
                         allowedRoles.includes(session?.user?.role || "");

        if (!session || !hasAccess) {
            return NextResponse.json({ 
                success: false, 
                error: "Security Violation: You do not have clearance to modify the Master Directory." 
            }, { status: 403 });
        }

        const { Port } = await getAdminModels();
        const body = await request.json();

        if(Array.isArray(body)){
            try {
                // Sanitize LOCODEs in bulk import to handle empty strings
                const sanitizedBody = body.map(port => ({
                    ...port,
                    locode: (port.locode && port.locode.trim() !== "") ? port.locode.toUpperCase() : undefined,
                    countryCode: port.countryCode ? port.countryCode.toUpperCase() : undefined
                }));
                const newPorts = await Port.insertMany(sanitizedBody, { ordered: false });
                return NextResponse.json({success:true,data:newPorts},{status:201});
            } catch (bulkError: any) {
                // If some succeeded and some failed (e.g. duplicates), we can still return success for those that worked
                if (bulkError.writeErrors) {
                    return NextResponse.json({
                        success: true, 
                        data: bulkError.insertedDocs,
                        warning: `${bulkError.writeErrors.length} records were skipped (likely duplicates).`
                    }, {status: 201});
                }
                throw bulkError;
            }
        }else {
            const newPort = await Port.create({
                name: body.name,
                locode: (body.locode && body.locode.trim() !== "") ? body.locode.toUpperCase() : undefined,
                country: body.country,
                countryCode: body.countryCode ? body.countryCode.toUpperCase() : undefined,
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