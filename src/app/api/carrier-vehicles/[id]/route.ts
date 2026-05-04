import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getAdminModels } from '@/model/tenantModels';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const session = await getServerSession(authOptions);
        const body = await request.json();
        const { CarrierVehicle } = await getAdminModels();

        const updatedVehicle = await CarrierVehicle.findByIdAndUpdate(
            id,
            {
                name: body.name.toUpperCase(),
                type: body.type,
                code: body.code?.toUpperCase(),
                carrierName: body.carrierName,
                isActive: body.isActive
            },
            { new: true, runValidators: true }
        );

        if (!updatedVehicle) {
            return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedVehicle }, { status: 200 });
    } catch (error: any) {
        console.error("Error updating Carrier Vehicle: ", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const session = await getServerSession(authOptions);
        const { CarrierVehicle } = await getAdminModels();

        const deletedVehicle = await CarrierVehicle.findByIdAndDelete(id);

        if (!deletedVehicle) {
            return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Vehicle deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Error deleting Carrier Vehicle: ", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
