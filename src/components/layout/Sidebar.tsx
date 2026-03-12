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
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const officeItems = [
  { name: "Dashboard", href: "/office/dashboard", icon: LayoutDashboard },
  { name: "Inquiries", href: "/office/inquiries", icon: FileText },
  { name: "Admissions Progress", href: "/office/inquiries", icon: UserCheck },
];

const studentItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Admission Form", href: "/student/admission", icon: FileText },
];

interface SidebarProps {
  role: "OFFICE" | "STUDENT_PARENT";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = role === "OFFICE" ? officeItems : studentItems;

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white w-64 border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          SchoolFlow
        </h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-4">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-colors duration-150",
                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
