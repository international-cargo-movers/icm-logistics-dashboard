import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import QuoteModel from '@/model/QuoteModel';
import nodemailer from "nodemailer";

export async function POST(request: Request) {
    try {
        await dbConnect();
        
        // 1. Parse the incoming payload from the frontend
        const body = await request.json();
        const { quoteData, pdfBase64 } = body;

        if (!quoteData || !quoteData.quoteRef) {
            return NextResponse.json(
                { success: false, error: "Missing quote payload." }, 
                { status: 400 }
            );
        }

        // 2. Map the frontend data to our strict MongoDB Schema
        const newQuote = await QuoteModel.create({
            quoteId: quoteData.quoteRef,
            customerDetails: {
                companyId: quoteData.customerId,
                contactPerson: quoteData.customerName, 
            },
            routingDetails: {
                originPort: quoteData.originPort,
                destinationPort: quoteData.destinationPort,
                mode: quoteData.mode,
            },
            cargoSummary: {
                commodity: quoteData.cargoSummary?.commodity || "General Cargo",
                equipment: quoteData.cargoSummary?.equipment,
                estimatedWeight: quoteData.cargoSummary?.estimatedWeight
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
                }))
            },
            status: "Sent"
        });

        // ==========================================
        // 3. EMAIL DISPATCH PIPELINE (Nodemailer)
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

        // 4. Return success back to the UI
        return NextResponse.json({ success: true, data: newQuote, message: "Quote saved and email sent!" }, { status: 201 });

    } catch (error: any) {
        console.error("Quote Engine Error:", error);
        
        // Gracefully catch duplicate Quote IDs
        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, error: "A quote with this Reference ID already exists." }, 
                { status: 400 }
            );
        }
        
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}