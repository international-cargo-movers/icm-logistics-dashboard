import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";

export async function GET() {
    try {
        await dbConnect();
        const { Job, Invoice, VendorInvoice } = await getTenantModels();
        
        // Fetch all data needed for aggregations
        const jobs = await Job.find({}).populate("customerDetails.companyId", "name").lean();
        const customerInvoices = await Invoice.find({}).lean();
        const vendorInvoices = await VendorInvoice.find({}).lean();

        // 1. Basic Stats
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter((j: any) => j.cargoDetails?.jobStatus !== "Completed").length;
        const completedJobs = totalJobs - activeJobs;

        // 2. Financial Aggregations
        const receivablesMap: Record<string, number> = {};
        const receivedMap: Record<string, number> = {};
        let totalRevenue = 0;
        let totalReceived = 0;

        customerInvoices.forEach((inv: any) => {
            const billedAmount = Number(inv.totals?.netAmount) || 0;
            // Legacy Fix: If it's "Paid" but amountPaid is missing, treat it as fully paid
            const paidAmount = (inv.status === "Paid" && (inv.amountPaid === undefined || inv.amountPaid === 0)) 
                ? billedAmount 
                : (Number(inv.amountPaid) || 0);
            
            const jId = inv.jobId?.toString();
            
            if (jId) {
                receivablesMap[jId] = (receivablesMap[jId] || 0) + billedAmount;
                receivedMap[jId] = (receivedMap[jId] || 0) + paidAmount;
            }
            
            totalRevenue += billedAmount;
            totalReceived += paidAmount;
        });

        const payablesMap: Record<string, number> = {};
        const vendorPaidMap: Record<string, number> = {};
        let totalExpense = 0;

        vendorInvoices.forEach((inv: any) => {
            const billedAmount = Number(inv.totals?.netAmount) || 0;
            const paidAmount = (inv.status === "Paid" && (inv.amountPaid === undefined || inv.amountPaid === 0)) 
                ? billedAmount 
                : (Number(inv.amountPaid) || 0);
            
            const jId = inv.jobId?.toString();
            
            if (jId) {
                payablesMap[jId] = (payablesMap[jId] || 0) + billedAmount;
                vendorPaidMap[jId] = (vendorPaidMap[jId] || 0) + paidAmount;
            }
            
            totalExpense += billedAmount;
        });

        const totalProfit = totalRevenue - totalExpense;
        const outstanding = totalRevenue - totalReceived;

        // 3. Company Level Aggregation
        const companyMetrics: Record<string, { 
            name: string, 
            revenue: number, 
            margin: number, 
            jobs: number,
            outstanding: number
        }> = {};

        jobs.forEach((job: any) => {
            const companyName = job.customerDetails?.companyId?.name || job.customerDetails?.name || "Unknown";
            const jId = job._id.toString();
            
            if (!companyMetrics[companyName]) {
                companyMetrics[companyName] = { name: companyName, revenue: 0, margin: 0, jobs: 0, outstanding: 0 };
            }

            const rev = receivablesMap[jId] || 0;
            const exp = payablesMap[jId] || 0;
            const rec = receivedMap[jId] || 0;

            companyMetrics[companyName].revenue += rev;
            companyMetrics[companyName].margin += (rev - exp);
            companyMetrics[companyName].jobs += 1;
            companyMetrics[companyName].outstanding += (rev - rec);
        });

        const topCompanies = Object.values(companyMetrics)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // 4. Monthly Trend (Revenue vs Profit)
        const monthlyData: Record<string, { revenue: number, profit: number, sortKey: string }> = {};

        customerInvoices.forEach((inv: any) => {
            const amount = Number(inv.totals?.netAmount) || 0;
            const date = new Date(inv.invoiceDate || inv.createdAt || new Date());
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const key = `${month} ${year}`;
            const sortKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[key]) {
                monthlyData[key] = { revenue: 0, profit: 0, sortKey };
            }
            monthlyData[key].revenue += amount;
        });

        // Simplified Profit trend: just subtract vendor invoices by their date
        vendorInvoices.forEach((inv: any) => {
            const amount = Number(inv.totals?.netAmount) || 0;
            const date = new Date(inv.vendorInvoiceDate || inv.createdAt || new Date());
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const key = `${month} ${year}`;
            
            if (monthlyData[key]) {
                monthlyData[key].profit += (0 - amount); // Initial revenue already added, now subtract expenses
            }
        });
        
        // Finalize profit (it was just expenses, now add revenue)
        Object.keys(monthlyData).forEach(key => {
            monthlyData[key].profit += monthlyData[key].revenue;
        });

        const trendData = Object.keys(monthlyData)
            .map(key => ({
                name: key,
                Revenue: monthlyData[key].revenue,
                Profit: monthlyData[key].profit,
                sortKey: monthlyData[key].sortKey
            }))
            .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

        // 5. Mode Distribution
        const modeCounts: Record<string, number> = {};
        jobs.forEach((j: any) => {
            const mode = j.shipmentDetails?.mode || "Unspecified";
            modeCounts[mode] = (modeCounts[mode] || 0) + 1;
        });
        
        const modeData = Object.entries(modeCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return NextResponse.json({
            success: true,
            data: { 
                stats: {
                    totalJobs,
                    activeJobs,
                    completedJobs,
                    totalRevenue,
                    totalProfit,
                    outstanding,
                    profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
                },
                modeData,
                trendData,
                topCompanies,
                allCompanyMetrics: Object.values(companyMetrics).sort((a, b) => b.revenue - a.revenue)
            }
        });

    } catch (error: any) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}