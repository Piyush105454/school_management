"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { getDashboardUrl } from "@/lib/roleUtils";

// Role-based route access control
const ROLE_ROUTES: Record<string, string[]> = {
  OFFICE: ["/office", "/dashboard"],
  STUDENT_PARENT: ["/student", "/dashboard"],
  TEACHER: [
    "/teacher", 
    "/office/inquiries", 
    "/office/admissions-progress", 
    "/office/admissions",
    "/office/document-verification", 
    "/office/entrance-tests", 
    "/office/home-visits",
    "/office/final-admissions", // Added just in case
    "/office/academy-management" 
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  if (status === "loading") {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!session) {
    router.push("/");
    return null;
  }

  const userRole = (session.user?.role as string || "").toUpperCase();
  const allowedRoutes = ROLE_ROUTES[userRole] || [];
  
  // Robust access check
  const hasAccess = allowedRoutes.some(route => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + "/")) return true;
    // Special case for exact prefix matches like /office/admissions and /office/admissions-progress
    if (pathname.startsWith(route)) return true;
    return false;
  });

  // Redirect if no access
  if (!hasAccess) {
    const dashboardUrl = getDashboardUrl(userRole as any);
    if (pathname !== dashboardUrl) {
      router.push(dashboardUrl);
      return null;
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          role={session.user.role as any} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
