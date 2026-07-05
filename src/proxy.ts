import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

export default withAuth(
  function proxy(req: NextRequest & { nextauth: any }) {
    const host = req.headers.get("host") || "";
    const isVercel = host.includes("vercel.app") || host.includes("school-management-six-iota");
    const pathname = req.nextUrl.pathname;

    // 1. If on Vercel, force redirect to /moved-notice page (except for static/api/moved-notice requests)
    if (isVercel) {
      if (pathname === "/moved-notice") {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/moved-notice", req.url));
    }

    // 2. If on production/localhost, don't allow accessing the moved notice page directly (redirect to home)
    if (pathname === "/moved-notice") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const token = req.nextauth.token;

    // If no token, let next-auth handle it
    if (!token) {
      return NextResponse.next();
    }

    const userRole = token.role as string;
    const userEmail = token.email as string;

    if (userEmail === "dpsface@gmail.com") {
      if (pathname !== "/face-scanner") {
        return NextResponse.redirect(new URL("/face-scanner", req.url));
      }
      return NextResponse.next();
    }

    // Define role-based route access
    const roleRoutes: Record<string, string[]> = {
      OFFICE: ["/office", "/dashboard", "/teacher"],
      PRINCIPAL: ["/office", "/dashboard", "/teacher"],
      ADMIN: ["/office", "/dashboard", "/teacher"],
      STUDENT_PARENT: ["/student", "/dashboard"],
      TEACHER: [
        "/teacher", 
        "/office/inquiries", 
        "/office/admissions-progress", 
        "/office/admissions",
        "/office/home-visits", 
        "/office/entrance-tests", 
        "/office/document-verification",
        "/office/academy-management",
        "/office/final-admissions",
        "/office/scholarship",
        "/student/scholarship"
      ],
    };

    // Check if user has access to this route
    const hasAccess = roleRoutes[userRole]?.some(route => pathname.startsWith(route));

    // If trying to access a protected route without permission, redirect to their dashboard
    if (pathname.startsWith("/office") || pathname.startsWith("/student") || pathname.startsWith("/teacher")) {
      if (!hasAccess) {
        // Redirect to appropriate dashboard based on role
        const dashboardMap: Record<string, string> = {
          OFFICE: "/office/dashboard",
          PRINCIPAL: "/office/dashboard",
          ADMIN: "/office/dashboard",
          STUDENT_PARENT: "/student/dashboard",
          TEACHER: "/teacher/dashboard",
        };
        
        return NextResponse.redirect(new URL(dashboardMap[userRole] || "/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Bypass next-auth authorization check on Vercel or for the moved notice page
        const host = req.headers.get("host") || "";
        const isVercel = host.includes("vercel.app") || host.includes("school-management-six-iota");
        if (isVercel || req.nextUrl.pathname === "/moved-notice") {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/login",
    "/moved-notice",
    "/face-scanner/:path*",
    "/office/:path*",
    "/student/:path*",
    "/teacher/:path*",
    "/dashboard/:path*",
  ],
};
