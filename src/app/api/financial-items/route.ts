import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getFinancialItemModel } from "@/model/FinancialItemModel";

export async function GET() {
    try {
        await dbConnect();
        const FinancialItem = await getFinancialItemModel();

        const items = await FinancialItem.find({}).sort({ name: 1 });
        const uniqueNames = items.map(item => item.name);

        return NextResponse.json({ success: true, data: uniqueNames });
    } catch (error: any) {
        console.error("Failed to fetch financial items:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { name } = await req.json();

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
        }

        const FinancialItem = await getFinancialItemModel();
        
        // Use findOneAndUpdate with upsert to avoid duplicate errors and ensure it's saved
        await FinancialItem.findOneAndUpdate(
            { name: name.trim() },
            { name: name.trim() },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to save financial item:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
