import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import JobModel from "@/model/JobModel";
import InvoiceModel from "@/model/InvoiceModel";

export async function GET() {
    try {
        await dbConnect();
        
        // Fetch all jobs and invoices (lean for maximum speed)
        const jobs = await JobModel.find({}).lean();
        const invoices = await InvoiceModel.find({}).lean();

        // 1. KPI Stats
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter((j: any) => j.cargoDetails?.jobStatus !== "Completed").length;

        let totalBilled = 0;
        let outstanding = 0;

        // 2. Financial Chart Logic
        const monthlyData: Record<string, { invoiced: number, received: number, sortKey: string }> = {};

        invoices.forEach((inv: any) => {
            // Safely grab the amount (checks both netAmount and grandTotal just in case)
            const amount = Number(inv.totals?.netAmount) || Number(inv.totals?.grandTotal) || 0;
            const status = inv.status || "Unpaid";
            
            totalBilled += amount;
            if (status !== "Paid") outstanding += amount;

            // Determine the month and year
            const date = new Date(inv.invoiceDate || inv.createdAt || new Date());
            const month = date.toLocaleString('default', { month: 'short' }); // e.g. "Jan"
            const year = date.getFullYear(); // e.g. 2026
            const key = `${month} ${year}`;
            const sortKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`; // For chronological sorting

            if (!monthlyData[key]) {
                monthlyData[key] = { invoiced: 0, received: 0, sortKey };
            }

            monthlyData[key].invoiced += amount;
            if (status === "Paid") {
                monthlyData[key].received += amount;
            }
        });

        // Convert the object back into an array and sort chronologically
        const revenueData = Object.keys(monthlyData)
            .map(key => ({
                name: key,
                Invoiced: monthlyData[key].invoiced,
                Received: monthlyData[key].received,
                sortKey: monthlyData[key].sortKey
            }))
            .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

        // 3. Freight Mode Logic (For Pie Chart)
        const modeCounts: Record<string, number> = {};
        jobs.forEach((j: any) => {
            const mode = j.shipmentDetails?.mode || "Unspecified";
            modeCounts[mode] = (modeCounts[mode] || 0) + 1;
        });
        
        const modeData = Object.entries(modeCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Sort largest slices first

        return NextResponse.json({
            success: true,
            data: { totalJobs, activeJobs, totalBilled, outstanding, modeData, revenueData }
        });

    } catch (error: any) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}