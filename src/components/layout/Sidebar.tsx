"use client";

import React, { useState } from "react";
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
  ClipboardCheck,
  School,
  UserCog,
  Eye,
  ChevronDown,
  Award,
  CalendarCheck,
  ScrollText,
  FolderOpen,
  Clock,
  Megaphone,
  BookOpen,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const officeItems = [
  { name: "Dashboard", href: "/office/dashboard", icon: LayoutDashboard },
  { name: "Inquiries", href: "/office/inquiries?tab=inquiries", icon: FileText, baseHref: "/office/inquiries" },
  { name: "Admissions Progress", href: "/office/inquiries?tab=admissions", icon: UserCheck, baseHref: "/office/inquiries" },
  { name: "Doc Verification", href: "/office/document-verification", icon: FileText },
  { name: "Entrance Tests", href: "/office/entrance-tests", icon: ClipboardCheck },
  { name: "Home Visits", href: "/office/home-visits", icon: Users },
  { name: "Final Approvals", href: "/office/final-admissions", icon: ClipboardCheck },

  { type: "section", name: "Scholarship" },
  { name: "Award Scholarship", href: "/office/scholarship/award", icon: Award },
  { name: "Student Scholarships", href: "/office/scholarship/students", icon: GraduationCap },
  { name: "Monthly Reports", href: "/office/scholarship/reports", icon: FileText },
  { name: "Criteria Settings", href: "/office/scholarship/settings", icon: Settings },
  { type: "section", name: "Academy Management" },
  { name: "Attendance Management", href: "/office/academy-management/attendance", icon: CalendarCheck },
  { name: "Class Management", href: "/office/academy-management/classes", icon: School },
  { name: "Lesson Plan Management", href: "/office/academy-management/lesson-plan", icon: BookOpen },
  { name: "Homework Management", href: "/office/academy-management/homework", icon: ClipboardCheck },
  { name: "Test & Exam Management", href: "/office/academy-management/exams", icon: ScrollText },

  { type: "section", name: "Leave Management" },
  { name: "Library & Resources", href: "/office/academy-management/library", icon: FolderOpen },
  { name: "TC Generation", href: "/office/leaver-management/tc", icon: FileText },

  { type: "section", name: "Complaint Management" },
  { name: "Manage Complaints", href: "/office/complaint-management", icon: Users },

  { type: "section", name: "School Health Program" },
  { name: "Health Records", href: "/office/school-health", icon: Heart },

  { type: "section", name: "Time Table Management" },
  { name: "Manage Timetable", href: "/office/timetable", icon: Clock },

  { type: "section", name: "School Management" },
  { name: "Notice Board", href: "/office/school-management/notices", icon: Megaphone },
  { name: "Teacher Management", href: "/office/school-management/teachers", icon: Users },
  { name: "Principal Management", href: "/office/school-management/principal", icon: UserCog },
];

const studentItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Admission Form", href: "/student/admission", icon: FileText },
  { name: "Doc Verification", href: "/student/document-verification", icon: UserCheck },
  { name: "Entrance Test", href: "/student/entrance-test", icon: ClipboardCheck },
  { name: "Home Visit", href: "/student/home-visit", icon: Users },
  { name: "Final Option", href: "/student/final-admission", icon: ClipboardCheck },
  { name: "My Scholarship", href: "/student/scholarship", icon: GraduationCap },
];

interface SidebarProps {
  role: "OFFICE" | "STUDENT_PARENT";
  onClose?: () => void;
}

export function Sidebar({ role, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const items = role === "OFFICE"
    ? [
      ...officeItems.slice(0, 1),
      { type: "section", name: "Admissions" },
      ...officeItems.slice(1, 3),
      { name: "View Applications", href: "/office/applications", icon: Eye },
      ...officeItems.slice(3)
    ]
    : studentItems;

  return (
    <div className="flex h-full flex-col bg-white text-slate-800 w-72 md:w-64 border-r border-slate-100 shadow-sm shadow-slate-100/10">
      <div className="p-6 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
            <GraduationCap className="text-blue-600" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-none">DPS Dhanpuri</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Hub Platform</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {(() => {
          let currentSection = "";
          return items.map((item, idx) => {
            if ('type' in item && item.type === 'section') {
              currentSection = item.name;
              const isCollapsed = collapsedSections[item.name];
              return (
                <button
                  key={`section-${idx}`}
                  onClick={() => toggleSection(item.name)}
                  className="pt-5 pb-2 px-4 first:pt-0 flex items-center justify-between w-full group cursor-pointer select-none"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-slate-600 transition-colors">{item.name}</span>
                  <ChevronDown size={14} className={cn("text-slate-400 group-hover:text-slate-600 transition-transform duration-200", isCollapsed ? "-rotate-90" : "rotate-0")} />
                </button>
              );
            }

            const regularItem = item as any;
            const isCollapsed = currentSection ? collapsedSections[currentSection] : false;
            if (isCollapsed) return null;

            let isActive = pathname === regularItem.href;
            if (role === "OFFICE" && regularItem.baseHref === "/office/inquiries") {
              const currentTab = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('tab');
              const targetTab = new URL(regularItem.href, 'http://x').searchParams.get('tab');
              isActive = pathname === regularItem.baseHref && currentTab === targetTab;
            }

            return (
              <Link
                key={regularItem.href}
                href={regularItem.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center px-4 py-3 md:py-2.5 text-xs md:text-[13px] font-bold rounded-xl transition-all duration-150 tracking-wide select-none",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <regularItem.icon className={cn(
                  "mr-3 h-5 w-5 md:h-4 md:w-4 transition-colors duration-150",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                )} />
                {regularItem.name}
              </Link>
            );
          });
        })()}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center px-3 py-2.5 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all select-none"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
