import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAdminModels } from '@/model/tenantModels';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { CarrierVehicle } = await getAdminModels();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // "Sea" or "Air"
        const search = searchParams.get("search");

        let query: any = { isActive: true };
        if (type) {
            query.type = type;
        }
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const vehicles = await CarrierVehicle.find(query).sort({ name: 1 });
        return NextResponse.json({ success: true, data: vehicles }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching Carrier Vehicles: ", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        
        // Basic auth check - usually Operations/Admin can add these
        const allowedRoles = ["SuperAdmin", "Finance", "Sales", "Operations"];
        const hasAccess = session?.user?.roles?.some((r: string) => allowedRoles.includes(r)) || 
                         allowedRoles.includes(session?.user?.role || "");

        if (!session || !hasAccess) {
            return NextResponse.json({ 
                success: false, 
                error: "Security Violation: You do not have clearance to modify the Master Directory." 
            }, { status: 403 });
        }

        const { CarrierVehicle } = await getAdminModels();
        const body = await request.json();

        // Check for duplicates before creating
        const existing = await CarrierVehicle.findOne({ 
            name: body.name.toUpperCase(), 
            type: body.type 
        });

        if (existing) {
            return NextResponse.json({ success: true, data: existing, message: "Carrier already exists" }, { status: 200 });
        }

        const newVehicle = await CarrierVehicle.create({
            name: body.name.toUpperCase(),
            type: body.type,
            code: body.code?.toUpperCase(),
            carrierName: body.carrierName,
            isActive: true
        });

        return NextResponse.json({ success: true, data: newVehicle }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating Carrier Vehicle: ", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
