import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { getAdminModels } from "@/model/tenantModels";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { User } = await getAdminModels();
    const session = await getServerSession(authOptions);

    // Ensure the requester is a SuperAdmin
    if (session?.user?.role !== "SuperAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { password, isActive, role } = body;

    const updateData: any = {};
    
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (role) {
      updateData.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
