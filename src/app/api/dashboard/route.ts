import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getTenantModels } from "@/model/tenantModels";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        await dbConnect();
        const { Job, Invoice, VendorInvoice, Quote } = await getTenantModels();
        const { searchParams } = new URL(request.url);
        const timeframe = searchParams.get('timeframe') || 'monthly';
        
        // Fetch all data needed for aggregations
        const jobs = await Job.find({}).populate("customerDetails.companyId", "name").lean();
        const quotes = await Quote.find({}).lean();
        const customerInvoices = await Invoice.find({}).lean();
        const vendorInvoices = await VendorInvoice.find({}).lean();

        // Create a map for quick quote lookup
        const quoteMap: Record<string, any> = {};
        quotes.forEach((q: any) => {
            quoteMap[q.quoteId] = q;
        });

        // 1. Basic Stats
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter((j: any) => j.cargoDetails?.jobStatus !== "Completed").length;
        const completedJobs = totalJobs - activeJobs;

        // 2. Financial Aggregations (Job-Based)
        let totalRevenue = 0;
        let totalExpense = 0;
        
        // Maps for company and job level tracking
        const jobRevenueMap: Record<string, number> = {};
        const jobExpenseMap: Record<string, number> = {};

        jobs.forEach((job: any) => {
            const quote = job.quoteReference ? quoteMap[job.quoteReference] : null;
            const rev = quote?.financials?.totalSell || 0;
            const exp = quote?.financials?.totalBuy || 0;
            
            const jId = job._id.toString();
            jobRevenueMap[jId] = rev;
            jobExpenseMap[jId] = exp;
            
            totalRevenue += rev;
            totalExpense += exp;
        });

        // Track actual payments from invoices for "Outstanding"
        let totalReceived = 0;
        const receivedMap: Record<string, number> = {};

        customerInvoices.forEach((inv: any) => {
            const billedAmount = Number(inv.totals?.netAmount) || 0;
            const paidAmount = (inv.status === "Paid" && (inv.amountPaid === undefined || inv.amountPaid === 0)) 
                ? billedAmount 
                : (Number(inv.amountPaid) || 0);
            
            const jId = inv.jobId?.toString();
            if (jId) {
                receivedMap[jId] = (receivedMap[jId] || 0) + paidAmount;
            }
            totalReceived += paidAmount;
        });

        const totalProfit = totalRevenue - totalExpense;
        const outstanding = totalRevenue - totalReceived;

        // 3. Company Level Aggregation (Job-Based)
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

            const rev = jobRevenueMap[jId] || 0;
            const exp = jobExpenseMap[jId] || 0;
            const rec = receivedMap[jId] || 0;

            companyMetrics[companyName].revenue += rev;
            companyMetrics[companyName].margin += (rev - exp);
            companyMetrics[companyName].jobs += 1;
            companyMetrics[companyName].outstanding += (rev - rec);
        });

        const topCompanies = Object.values(companyMetrics)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // 4. Monthly/Weekly/Yearly Trend (Job-Based Revenue vs Profit)
        const trendDataMap: Record<string, { revenue: number, profit: number, sortKey: string }> = {};

        const getGroupingKey = (d: any, type: string) => {
            const date = new Date(d || new Date());
            const year = date.getFullYear();
            
            if (type === 'yearly') {
                return { key: `${year}`, sortKey: `${year}` };
            }
            
            if (type === 'weekly') {
                const target = new Date(date.valueOf());
                const dayNr = (date.getDay() + 6) % 7;
                target.setDate(target.getDate() - dayNr + 3);
                const firstThursday = target.valueOf();
                target.setMonth(0, 1);
                if (target.getDay() !== 4) {
                    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
                }
                const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
                return { key: `W${week} ${year}`, sortKey: `${year}-${String(week).padStart(2, '0')}` };
            }
            
            const month = date.toLocaleString('default', { month: 'short' });
            return { key: `${month} ${year}`, sortKey: `${year}-${String(date.getMonth() + 1).padStart(2, '0')}` };
        };

        jobs.forEach((job: any) => {
            const rev = jobRevenueMap[job._id.toString()] || 0;
            const exp = jobExpenseMap[job._id.toString()] || 0;
            const { key, sortKey } = getGroupingKey(job.createdAt, timeframe);

            if (!trendDataMap[key]) {
                trendDataMap[key] = { revenue: 0, profit: 0, sortKey };
            }
            trendDataMap[key].revenue += rev;
            trendDataMap[key].profit += (rev - exp);
        });

        const trendData = Object.keys(trendDataMap)
            .map(key => ({
                name: key,
                Revenue: trendDataMap[key].revenue,
                Profit: trendDataMap[key].profit,
                sortKey: trendDataMap[key].sortKey
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