import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(){
    try{
        await dbConnect();
        const { Company } = await getTenantModels();
        const companies = await Company.find({}).sort({name:1});
        return NextResponse.json({success:true,data:companies},{status:200});
    }catch(error:any){
        console.log("Error fetching Companies: ",error)
        return NextResponse.json({success:false,error:error.message},{status:500});
    }
}

export async function POST(request:Request){
    try{
        await dbConnect();
        const { Company } = await getTenantModels();

        // --- THE SERVER LOCK ---
        const session = await getServerSession(authOptions);
        
        // Block if not logged in, or if role is NOT SuperAdmin or Finance
        if (!session?.user?.role || !["SuperAdmin", "Finance"].includes(session.user.role)) {
            return NextResponse.json({ 
                success: false, 
                error: "Security Violation: You do not have clearance to modify the Master Directory." 
            }, { status: 403 });
        }
        // -----------------------

        const body = await request.json();

        const newCompany = await Company.create({
            name: body.name,
            type: body.type || ["Customer"],
            // THE FIX: Catch 'email' from frontend and save it as 'contactEmail'
            contactEmail: body.email || body.contactEmail, 
            contactName:body.contactName,
            contactPhone: body.contactPhone,
            defaultSalesPerson: body.defaultSalesPerson || body.salesPerson, 
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

// export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
//     try {
//         await dbConnect();
//         const body = await request.json();

//         // Map frontend "email" to the DB's "contactEmail" if it exists
//         const updatePayload: any = { ...body };
//         if (body.email) {
//             updatePayload.contactEmail = body.email;
//             delete updatePayload.email;
//         }
//         const resolvedParams = await params
//         const updatedCompany = await CompanyModel.findByIdAndUpdate(
//             resolvedParams.id,
//             { $set: updatePayload },
//             { new: true, runValidators: true }
//         );

//         if (!updatedCompany) {
//             return NextResponse.json({ success: false, error: "Company not found in CRM" }, { status: 404 });
//         }

//         return NextResponse.json({ success: true, data: updatedCompany }, { status: 200 });

//     } catch (error: any) {
//         console.error("Error updating company CRM:", error);
//         return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//     }
// }