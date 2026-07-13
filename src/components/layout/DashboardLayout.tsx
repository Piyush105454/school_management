"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { getDashboardUrl } from "@/lib/roleUtils";

// Role-based route access control
const ROLE_ROUTES: Record<string, string[]> = {
  OFFICE: ["/office", "/dashboard", "/teacher", "/profile", "/reset-password", "/tasks"],
  PRINCIPAL: ["/office", "/dashboard", "/teacher", "/profile", "/reset-password", "/tasks"],
  ADMIN: ["/office", "/dashboard", "/teacher", "/profile", "/reset-password", "/tasks"],
  STUDENT_PARENT: ["/student", "/dashboard", "/profile", "/reset-password"],
  TEACHER: [
    "/teacher", 
    "/office/inquiries", 
    "/office/admissions-progress", 
    "/office/admissions",
    "/office/document-verification", 
    "/office/entrance-tests", 
    "/office/home-visits",
    "/office/final-admissions", // Added just in case
    "/office/academy-management",
    "/office/timetable",
    "/teacher/timetable",
    "/profile",
    "/reset-password",
    "/tasks"
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (session) {
      fetch("/api/sidebar-permissions", { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
          if (data && data.permissions) {
            setPermissions(data.permissions);
          }
        })
        .catch(err => console.error("Error loading layout permissions:", err))
        .finally(() => setLoadingPerms(false));
    } else {
      setLoadingPerms(false);
    }
  }, [session]);

  const userRole = (session?.user?.role as string || "").toUpperCase();
  const allowedRoutes = ROLE_ROUTES[userRole] || [];
  
  // Static check first
  const isStaticallyAllowed = allowedRoutes.some(route => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + "/")) return true;
    if (pathname.startsWith(route)) return true;
    return false;
  });

  // Override check
  let hasAccess = isStaticallyAllowed;
  if (permissions && permissions.items) {
    const override = permissions.items[pathname];
    if (override !== undefined) {
      hasAccess = override;
    } else {
      // Check parent prefix paths (deepest matching path first)
      const matchingKey = Object.keys(permissions.items)
        .sort((a, b) => b.length - a.length)
        .find(itemPath => pathname.startsWith(itemPath + "/"));
      if (matchingKey !== undefined) {
        hasAccess = permissions.items[matchingKey];
      }
    }
  }

  // Redirect if no access (Fix for React state update during render)
  React.useEffect(() => {
    if (session && !loadingPerms && !hasAccess) {
      const dashboardUrl = getDashboardUrl(userRole as any);
      if (pathname !== dashboardUrl) {
        router.push(dashboardUrl);
      }
    }
  }, [hasAccess, session, loadingPerms, pathname, router, userRole]);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || (session && loadingPerms)) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!session || !hasAccess) {
    return null;
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
