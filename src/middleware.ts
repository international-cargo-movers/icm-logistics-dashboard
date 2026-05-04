import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isSelectCompanyPage = req.nextUrl.pathname === "/select-company";
    const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
    const hasTenantId = req.cookies.has("tenant-id");

    if (isAuthRoute) return NextResponse.next();

    if (isAuth && !hasTenantId && !isSelectCompanyPage) {
      return NextResponse.redirect(new URL("/select-company", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
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