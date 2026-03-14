"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Settings, 
  LogOut,
  FileText,
  UserCheck,
  X,
  ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const officeItems = [
  { name: "Dashboard", href: "/office/dashboard", icon: LayoutDashboard },
  { name: "Inquiries", href: "/office/inquiries?tab=inquiries", icon: FileText, baseHref: "/office/inquiries" },
  { name: "Admissions Progress", href: "/office/inquiries?tab=admissions", icon: UserCheck, baseHref: "/office/inquiries" },
  { name: "Document Verification", href: "/office/document-verification", icon: FileText },
  { name: "Entrance Tests", href: "/office/entrance-tests", icon: ClipboardCheck },
];

const studentItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Admission Form", href: "/student/admission", icon: FileText },
  { name: "Document Verification", href: "/student/document-verification", icon: UserCheck },
  { name: "Entrance Test", href: "/student/entrance-test", icon: ClipboardCheck },
];

interface SidebarProps {
  role: "OFFICE" | "STUDENT_PARENT";
  onClose?: () => void;
}

export function Sidebar({ role, onClose }: SidebarProps) {
  const pathname = usePathname();
  const items = role === "OFFICE" ? officeItems : studentItems;

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white w-72 md:w-64 border-r border-slate-800">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-lg md:text-xl font-bold text-white tracking-tight uppercase">
          DPS Dhanpuri
        </h1>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <nav className="flex-1 space-y-1.5 px-4 py-4">
        {items.map((item) => {
          // Special logic for office inquiries tabs
          let isActive = pathname === item.href;
          if (role === "OFFICE" && (item as any).baseHref === "/office/inquiries") {
            const currentTab = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tab');
            const targetTab = new URL(item.href, 'http://x').searchParams.get('tab');
            isActive = pathname === (item as any).baseHref && currentTab === targetTab;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center px-4 py-3 md:py-2 text-sm md:text-[13px] font-bold rounded-xl transition-all duration-150 uppercase tracking-wider",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 md:h-4 md:w-4 transition-colors duration-150",
                isActive ? "text-white" : "text-slate-500 group-hover:text-white"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
