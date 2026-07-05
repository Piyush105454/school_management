import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

// 1. Define Next-Auth middleware for protected routes
const authMiddleware = withAuth(
  function proxy(req: NextRequest & { nextauth: any }) {
    const pathname = req.nextUrl.pathname;
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
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
  }
);

// 2. Export standard middleware entry point
export default async function middleware(req: NextRequest, event: any) {
  const host = req.headers.get("host") || "";
  const isVercel = host.includes("vercel.app") || host.includes("school-management-six-iota");
  const pathname = req.nextUrl.pathname;

  // Static files, API routes, and assets should always pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // A. Vercel restriction check: redirect all requests (except /moved-notice) to /moved-notice
  if (isVercel) {
    if (pathname === "/moved-notice") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/moved-notice", req.url));
  }

  // B. Production/localhost check: prevent accessing /moved-notice
  if (pathname === "/moved-notice") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // C. Run authorization guards for protected application paths
  const isProtectedPath = 
    pathname.startsWith("/office") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/face-scanner";

  if (isProtectedPath) {
    return (authMiddleware as any)(req, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
