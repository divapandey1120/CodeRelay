import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check interviewer access
    if (path.startsWith("/dashboard")) {
      if (token?.role !== "INTERVIEWER") {
        return NextResponse.redirect(new URL("/sessions", req.url));
      }
    }

    // Check candidate access
    if (path.startsWith("/sessions")) {
      if (token?.role !== "CANDIDATE") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/session/:path*", "/sessions/:path*"],
};
