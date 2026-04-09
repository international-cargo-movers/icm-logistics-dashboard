import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerEmail, customerName, quoteRef, pdfBase64 } = body;

        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD,
            }
        })
        
        const mailOptions = {
            from: `"International Cargo Movers"<${process.env.EMAIL_USER}>`,
            to:customerEmail,
            subject:`Your Freight Quotation: ${quoteRef}`,
            text:`Hi ${customerName},\n\nPlease find attached the official freight quotation (${quoteRef}) for your requested routing.\n\nLet us know if you have any questions!\n\nBest Regards,\nMarcus Thorne\nFleet Director`,
            attachments:[
                {
                    filename:`Quotation_${quoteRef}.pdf`,
                    content:pdfBuffer,
                    contentType:'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({success:true,message:"Email sent successfully!"});
    }catch(error:any){
        console.error("Email Engine Error: ",error);
        return NextResponse.json({success:false,error:error.message},{status:500})
    }
}