import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getTenantModels } from '@/model/tenantModels';
import nodemailer from "nodemailer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Ensure this matches your path!

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { Quote } = await getTenantModels();

        // --- THE SERVER LOCK ---
        const session = await getServerSession(authOptions);
        
        // Block if not logged in, or if role is NOT SuperAdmin or Sales
        if (!session?.user?.role || !["SuperAdmin", "Sales"].includes(session.user.role)) {
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
        const newQuote = await Quote.create({
            quoteId: quoteData.quoteRef,
            customerDetails: {
                companyId: quoteData.customerId,
                contactPerson: quoteData.customerName, 
            },
            routingDetails: {
                originCountry: quoteData.originCountry,           
                originPort: quoteData.originPort,
                destinationCountry: quoteData.destinationCountry, 
                destinationPort: quoteData.destinationPort,
                // The Fallback ensures Mongoose never crashes even if the UI drops the mode
                mode: quoteData.mode, 
            },
            cargoSummary: {
                commodity: quoteData.cargoSummary?.commodity || "General Cargo",
                equipment: quoteData.cargoSummary?.equipment,
                items: quoteData.cargoSummary?.items?.map((item: any) => ({
                    description: item.description,
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
                    notes: item.notes || ""
                }))
            },
            status: "Sent"
        });

        // ==========================================
        // 2. EMAIL DISPATCH PIPELINE (Nodemailer)
        // ==========================================
        if (pdfBase64 && quoteData.customerEmail) {
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_APP_PASSWORD,
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

        console.log(`[SUCCESS] Quote ${newQuote.quoteId} saved to database!`);

        return NextResponse.json({ success: true, data: newQuote, message: "Quote saved and email sent!" }, { status: 201 });

    } catch (error: any) {
        console.error("Quote Engine Error:", error);
        
        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, error: "A quote with this Reference ID already exists." }, 
                { status: 400 }
            );
        }
        
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
