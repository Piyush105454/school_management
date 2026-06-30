import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

export default withAuth(
  function proxy(req: NextRequest & { nextauth: any }) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

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
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: [
    "/office/:path*",
    "/student/:path*",
    "/teacher/:path*",
    "/dashboard/:path*",
  ],
};
