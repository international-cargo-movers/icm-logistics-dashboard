import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary"; // The connection file you just made!

export async function POST(request: Request) {
  try {
    // --- THE SERVER LOCK ---
    const session = await getServerSession(authOptions);
    const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
    
    // Only SuperAdmins and Operations can upload files to the vault
    if (!session || !userRoles.some(r => ["SuperAdmin", "Operations"].includes(r))) {
      return NextResponse.json({ 
        success: false, 
        error: "Security Violation: You do not have clearance to upload documents." 
      }, { status: 403 });
    }
    // -----------------------

    // 1. Grab the file from the incoming request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }

    // 2. Convert the standard Web File into a Node.js Buffer
    // (Cloudinary's server-side SDK requires a buffer stream, not a raw file)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Stream the Buffer directly to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "freightos_vault", // Organizes all uploads into one neat folder in your Cloudinary dashboard
          resource_type: "auto",     // "auto" tells Cloudinary to accept PDFs, JPGs, PNGs, etc.
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // Execute the stream
      uploadStream.end(buffer);
    });

    // 4. Return Cloudinary's secure URL back to our frontend
    return NextResponse.json({ 
      success: true, 
      url: uploadResult.secure_url,
      format: uploadResult.format,
      originalName: file.name
    }, { status: 200 });

  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}