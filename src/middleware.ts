import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // You can add advanced Role-Based Routing here later!
    // For example: if (req.nextauth.token.role === 'Viewer' && req.nextUrl.pathname.includes('/new')) return blocked;
    return NextResponse.next();
  },
  {
    callbacks: {
      // This simple line checks: "Does this user have a valid NextAuth token?"
      authorized: ({ token }) => !!token,
    },
  }
);

// This tells the middleware EXACTLY which folders to protect.
export const config = {
  matcher: [
    "/dashboard/:path*", // Locks down the entire dashboard and everything inside it
    "/api/companies/:path*", // Protect your data APIs!
    "/api/jobs/:path*",
    "/api/invoices/:path*",
    "/api/quotes/:path*"
  ],
};