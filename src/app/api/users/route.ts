import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { getAdminModels } from "@/model/tenantModels";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET: Fetch all employees (Only SuperAdmins should ideally see this)
export async function GET() {
  try {
    await dbConnect();
    const { User } = await getAdminModels();
    const session = await getServerSession(authOptions);
    
    // Extra Security: Ensure the person asking for the user list is an Admin
    if (!session?.user?.roles?.includes("SuperAdmin") && session?.user?.role !== "SuperAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await User.find({}).select("-passwordHash").lean();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new employee account
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { User } = await getAdminModels();
    const session = await getServerSession(authOptions);

    if (!session?.user?.roles?.includes("SuperAdmin") && session?.user?.role !== "SuperAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, firstName, lastName, roles } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already in use." }, { status: 400 });
    }

    // Hash their starting password
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      roles: roles || ["Viewer"],
      isActive: true,
    });

    return NextResponse.json({ success: true, data: newUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}