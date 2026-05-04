import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getTenantModels } from '@/model/tenantModels';
import nodemailer from "nodemailer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { Quote } = await getTenantModels();

        // --- THE SERVER LOCK ---
        const session = await getServerSession(authOptions);
        const userRoles = session?.user?.roles || (session?.user?.role ? [session?.user?.role] : []);
        
        // Block if not logged in, or if role is NOT SuperAdmin, Sales or Operations
        if (!session || !userRoles.some(r => ["SuperAdmin", "Sales", "Operations"].includes(r))) {
            return NextResponse.json({ 
                success: false, 
                error: "Security Violation: You do not have clearance to create sales quotes." 
            }, { status: 403 });
        }
        // -----------------------
        
        const body = await request.json();
        const { quoteData, pdfBase64 } = body;

        if (!quoteData || !quoteData.quoteRef) {
            return NextResponse.json(
                { success: false, error: "Missing quote payload." }, 
                { status: 400 }
            );
        }

        // 1. Map the frontend data to our strict MongoDB Schema
        const updatedQuote = await Quote.findOneAndUpdate(
            { quoteId: quoteData.quoteRef },
            {
                customerDetails: {
                    companyId: quoteData.customerId,
                    contactPerson: quoteData.customerName, 
                },
                routingDetails: {
                    originCountry: String(quoteData.originCountry),           
                    originPort: String(quoteData.originPort),
                    destinationCountry: String(quoteData.destinationCountry), 
                    destinationPort: String(quoteData.destinationPort),
                    mode: String(quoteData.mode), 
                },
                cargoSummary: {
                    commodity: quoteData.cargoSummary?.commodity || "General Cargo",
                    equipment: quoteData.cargoSummary?.equipment,
                    containerCount: Number(quoteData.cargoSummary?.containerCount) || undefined,
                    containerType: quoteData.cargoSummary?.containerType,
                    totalCBM: Number(quoteData.cargoSummary?.totalCBM) || undefined,
                    items: quoteData.cargoSummary?.items?.map((item: any) => ({
                        description: item.description,
                        hsnCode: item.hsnCode,
                        noOfPackages: Number(item.noOfPackages) || 0,
                        grossWeight: Number(item.grossWeight) || 0,
                        volumetricWeight: Number(item.volumetricWeight) || 0,
                    })) || [],
                    totalNoOfPackages: Number(quoteData.totalNoOfPackages) || 0,
                    totalGrossWeight: Number(quoteData.totalGrossWeight) || 0,
                    totalVolumetricWeight: Number(quoteData.totalVolumetricWeight) || 0,
                },
                validity: {
                    issueDate: new Date(),
                    expiryDate: new Date(quoteData.validUntil),
                },
                financials: {
                    lineItems: quoteData.lineItems.map((item: any) => ({
                        chargeName: item.chargeName,
                        chargeType: item.chargeType,
                        buyPrice: Number(item.buyPrice),
                        sellPrice: Number(item.sellPrice),
                        currency: item.currency || "USD",
                        roe: Number(item.roe) || 1,
                        quantity: Number(item.quantity) || 1,
                        notes: item.notes || ""
                    })),
                    totalBuy: Number(quoteData.totalBuy) || 0,
                    totalSell: Number(quoteData.totalSell) || 0,
                    profitMargin: Number(quoteData.profitMargin) || 0,
                    baseCurrency: "INR"
                },
                status: "Sent"
            },
            { upsert: true, returnDocument: 'after', runValidators: true }
        );

        // ==========================================
        // 2. EMAIL DISPATCH PIPELINE (Nodemailer)
        // ==========================================
        if (pdfBase64 && quoteData.customerEmail) {
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');

            const transporter = nodemailer.createTransport({
                host: "smtp.office365.com",
                port: 587,
                secure: false, // use TLS
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_APP_PASSWORD,
                },
                tls: {
                    ciphers: 'SSLv3'
                }
            });
            
            const mailOptions = {
                from: `"International Cargo Movers" <${process.env.EMAIL_USER}>`,
                to: quoteData.customerEmail,
                subject: `Your Freight Quotation: ${quoteData.quoteRef}`,
                text: `Hi ${quoteData.customerName},\n\nPlease find attached the official freight quotation (${quoteData.quoteRef}) for your requested routing.\n\nLet us know if you have any questions!\n\nBest Regards,\nMarcus Thorne\nFleet Director`,
                attachments: [
                    {
                        filename: `Quotation_${quoteData.quoteRef}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            await transporter.sendMail(mailOptions);
            console.log(`[SUCCESS] Email sent to ${quoteData.customerEmail}`);
        } else {
            console.warn("[WARNING] Missing email or PDF base64. Quote saved to DB but email skipped.");
        }

        console.log(`[SUCCESS] Quote ${updatedQuote.quoteId} saved to database!`);

        return NextResponse.json({ success: true, data: updatedQuote, message: "Quote saved successfully!" }, { status: 200 });

    } catch (error: any) {
        console.error("Quote Engine Error:", error);
        
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
