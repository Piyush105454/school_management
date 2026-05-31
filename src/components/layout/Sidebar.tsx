"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  ClipboardList,
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
  Heart,
  AlertCircle,
  Bus,
  Lock,
  FlaskConical,
  Users2,
  Activity,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const officeItems = [
  { name: "Dashboard", href: "/office/dashboard", icon: LayoutDashboard },
  { name: "Inquiries", href: "/office/inquiries", icon: FileText },
  { name: "Admissions Progress", href: "/office/admissions-progress", icon: UserCheck },
  { name: "Doc Verification & Affidavit Upload", href: "/office/document-verification", icon: FileText },
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
  { name: "Lesson Plan Review", href: "/office/academy-management/lesson-plan/review", icon: ClipboardList },
  { name: "Homework Management", href: "/office/academy-management/homework", icon: ClipboardCheck },
  { name: "Test & Exam Management", href: "/office/academy-management/exams", icon: ScrollText },

  { type: "section", name: "Leave Management" },
  { name: "Student Leaves", href: "/office/academy-management/leaves", icon: ClipboardList },
  { name: "Library & Resources", href: "/office/academy-management/library", icon: FolderOpen },
  { name: "TC Generation", href: "/office/leaver-management/tc", icon: FileText },

  { type: "section", name: "Incident Management" },
  { name: "Manage Incidents", href: "/office/incident-management", icon: AlertCircle },

  { type: "section", name: "School Health Program" },
  { name: "Health Dashboard", href: "/office/school-health/dashboard", icon: LayoutDashboard },
  { name: "Student Health Records", href: "/office/school-health/records", icon: Heart },
  { name: "Daily Health Check", href: "/office/school-health/daily-check", icon: Activity },
  { name: "Wellness & Nutrition", href: "/office/school-health/wellness", icon: Brain },
  { name: "Settings & Committee", href: "/office/school-health/settings", icon: Settings },

  { type: "section", name: "Time Table Management" },
  { name: "Manage Timetable", href: "/office/timetable", icon: Clock },

  { type: "section", name: "Transport Management" },
  { name: "Student Transport", href: "/office/transport", icon: Bus },

  { type: "section", name: "People Management" },
  { name: "Admin Management", href: "/office/admin-management", icon: UserCog },
  { name: "Teacher Management", href: "/office/school-management/teachers", icon: Users },
  { name: "Principal Management", href: "/office/school-management/principal", icon: UserCog },

  { type: "section", name: "Access Module Management" },
  { name: "Access UI Management", href: "/office/access-management", icon: Lock },

  { type: "section", name: "Committee Management" },
  { name: "Manage Committees", href: "/office/committees", icon: Users2 },
];

const teacherItems = [
  { name: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  { type: "section", name: "Class Management" },
  { name: "My Classes", href: "/office/academy-management/classes", icon: School },
  { name: "Attendance", href: "/office/academy-management/attendance", icon: CalendarCheck },
  { name: "Lesson Plans", href: "/office/academy-management/lesson-plan", icon: BookOpen },
  { name: "My Homework Review", href: "/office/academy-management/homework", icon: ClipboardCheck },
  { type: "section", name: "Incident Management" },
  { name: "My Logged Incidents", href: "/teacher/incident-management", icon: AlertCircle },
  { type: "section", name: "Admission Management" },
  { name: "Inquiries", href: "/office/inquiries", icon: FileText },
  { name: "Admissions Progress", href: "/office/admissions-progress", icon: UserCheck },
  { name: "Doc Verification & Affidavit", href: "/office/document-verification", icon: Eye },
  { name: "Entrance Tests", href: "/office/entrance-tests", icon: ClipboardCheck },
  { name: "Home Visits", href: "/office/home-visits", icon: Users },
];

const studentItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Admission Form & Summary", href: "/student/admission", icon: FileText },
  { name: "Doc Verification & Affidavit Upload", href: "/student/admission?step=10", icon: UserCheck },
  { name: "Entrance Test", href: "/student/entrance-test", icon: ClipboardCheck },
  { name: "Home Visit", href: "/student/home-visit", icon: Users },
  { name: "My Scholarship", href: "/student/scholarship", icon: GraduationCap },
  { name: "My Logged Incidents", href: "/student/incident-management", icon: AlertCircle },
  { name: "My Homework", href: "/student/homework", icon: ClipboardList },
  { name: "My Attendance", href: "/student/attendance", icon: CalendarCheck },
  { name: "Apply Leave", href: "/student/leave", icon: ClipboardCheck },
];

interface SidebarProps {
  role: "OFFICE" | "STUDENT_PARENT" | "TEACHER" | "PRINCIPAL" | "ADMIN";
  onClose?: () => void;
}

export function Sidebar({ role, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStep = searchParams.get("step");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [permissions, setPermissions] = useState<any>(null);

  React.useEffect(() => {
    if (role === "TEACHER") {
      fetch("/api/teacher/profile")
        .then(res => res.json())
        .then(data => {
          setTeacherProfile(data);
        })
        .catch(err => console.error(err));
    }
  }, [role]);

  React.useEffect(() => {
    fetch("/api/sidebar-permissions")
      .then(res => res.json())
      .then(data => {
        if (data && data.permissions) {
          setPermissions(data.permissions);
        }
      })
      .catch(err => console.error("Error loading sidebar permissions:", err));
  }, []);

  const MASTER_STRUCTURE = [
    // Dashboards
    { href: "/office/dashboard", icon: LayoutDashboard, roleNames: { OFFICE: "Dashboard", PRINCIPAL: "Dashboard" } },
    { href: "/teacher/dashboard", icon: LayoutDashboard, roleNames: { TEACHER: "Dashboard" } },
    { href: "/student/dashboard", icon: LayoutDashboard, roleNames: { STUDENT_PARENT: "Dashboard" } },

    // Admissions Category
    { type: "section", name: "Admissions" },
    { href: "/office/inquiries", icon: FileText, roleNames: { OFFICE: "Inquiries", PRINCIPAL: "Inquiries", TEACHER: "Inquiries" } },
    { href: "/office/admissions-progress", icon: UserCheck, roleNames: { OFFICE: "Admissions Progress", PRINCIPAL: "Admissions Progress", TEACHER: "Admissions Progress" } },
    { href: "/office/document-verification", icon: FileText, roleNames: { OFFICE: "Doc Verification & Affidavit Upload", PRINCIPAL: "Doc Verification & Affidavit Upload", TEACHER: "Doc Verification & Affidavit" } },
    { href: "/office/entrance-tests", icon: ClipboardCheck, roleNames: { OFFICE: "Entrance Tests", PRINCIPAL: "Entrance Tests", TEACHER: "Entrance Tests" } },
    { href: "/office/home-visits", icon: Users, roleNames: { OFFICE: "Home Visits", PRINCIPAL: "Home Visits", TEACHER: "Home Visits" } },
    { href: "/office/final-admissions", icon: ClipboardCheck, roleNames: { OFFICE: "Final Approvals", PRINCIPAL: "Final Approvals" } },
    { href: "/student/admission", icon: FileText, roleNames: { STUDENT_PARENT: "Admission Form & Summary" } },
    { href: "/student/admission?step=10", icon: UserCheck, roleNames: { STUDENT_PARENT: "Doc Verification & Affidavit Upload" } },
    { href: "/student/entrance-test", icon: ClipboardCheck, roleNames: { STUDENT_PARENT: "Entrance Test" } },
    { href: "/student/home-visit", icon: Users, roleNames: { STUDENT_PARENT: "Home Visit" } },

    // Scholarship Category
    { type: "section", name: "Scholarship" },
    { href: "/office/scholarship/award", icon: Award, roleNames: { OFFICE: "Award Scholarship", PRINCIPAL: "Award Scholarship" } },
    { href: "/office/scholarship/students", icon: GraduationCap, roleNames: { OFFICE: "Student Scholarships", PRINCIPAL: "Student Scholarships" } },
    { href: "/office/scholarship/reports", icon: FileText, roleNames: { OFFICE: "Monthly Reports", PRINCIPAL: "Monthly Reports" } },
    { href: "/office/scholarship/settings", icon: Settings, roleNames: { OFFICE: "Criteria Settings", PRINCIPAL: "Criteria Settings" } },
    { href: "/student/scholarship", icon: GraduationCap, roleNames: { STUDENT_PARENT: "My Scholarship" } },

    // Academy Management Category
    { type: "section", name: "Academy Management" },
    { href: "/office/academy-management/attendance", icon: CalendarCheck, roleNames: { OFFICE: "Attendance Management", PRINCIPAL: "Attendance Management", TEACHER: "Attendance" } },
    { href: "/office/academy-management/classes", icon: School, roleNames: { OFFICE: "Class Management", PRINCIPAL: "Class Management", TEACHER: "My Classes" } },
    { href: "/office/academy-management/lesson-plan", icon: BookOpen, roleNames: { OFFICE: "Lesson Plan Management", PRINCIPAL: "Lesson Plan Management", TEACHER: "Lesson Plans" } },
    { href: "/office/academy-management/lesson-plan/review", icon: ClipboardList, roleNames: { OFFICE: "Lesson Plan Review", PRINCIPAL: "Lesson Plan Review", TEACHER: "Review Lesson Plans" } },
    { href: "/office/academy-management/homework", icon: ClipboardCheck, roleNames: { OFFICE: "Homework Management", PRINCIPAL: "Homework Management", TEACHER: "My Homework Review" } },
    { href: "/office/academy-management/exams", icon: ScrollText, roleNames: { OFFICE: "Test & Exam Management", PRINCIPAL: "Test & Exam Management" } },
    { href: "/student/homework", icon: ClipboardList, roleNames: { STUDENT_PARENT: "My Homework" } },
    { href: "/student/attendance", icon: CalendarCheck, roleNames: { STUDENT_PARENT: "My Attendance" } },

    // Time Table Management Category
    { type: "section", name: "Time Table Management" },
    { href: "/office/timetable", icon: Clock, roleNames: { OFFICE: "Manage Timetable", PRINCIPAL: "Manage Timetable" } },

    // Leave Management Category
    { type: "section", name: "Leave Management" },
    { href: "/office/academy-management/leaves", icon: ClipboardList, roleNames: { OFFICE: "Student Leaves", PRINCIPAL: "Student Leaves" } },
    { href: "/office/leaver-management/tc", icon: FileText, roleNames: { OFFICE: "TC Generation", PRINCIPAL: "TC Generation" } },
    { href: "/student/leave", icon: ClipboardCheck, roleNames: { STUDENT_PARENT: "Apply Leave" } },

    // Lab, Library & Resource Management Category
    { type: "section", name: "Lab, Library & Resource Management" },
    { href: "/office/labs", icon: FlaskConical, roleNames: { OFFICE: "Labs", PRINCIPAL: "Labs" } },
    { href: "/office/library", icon: BookOpen, roleNames: { OFFICE: "Library", PRINCIPAL: "Library" } },
    { href: "/office/resources", icon: FolderOpen, roleNames: { OFFICE: "Resources", PRINCIPAL: "Resources" } },

    // Incident Management Category
    { type: "section", name: "Incident Management" },
    { href: "/office/incident-management", icon: AlertCircle, roleNames: { OFFICE: "Manage Incidents", PRINCIPAL: "Manage Incidents" } },
    { href: "/teacher/incident-management", icon: AlertCircle, roleNames: { TEACHER: "My Logged Incidents" } },
    { href: "/student/incident-management", icon: AlertCircle, roleNames: { STUDENT_PARENT: "My Logged Incidents" } },

    // School Health Program Category
    { type: "section", name: "School Health Program" },
    { href: "/office/school-health/dashboard", icon: LayoutDashboard, roleNames: { OFFICE: "Health Dashboard", PRINCIPAL: "Health Dashboard" } },
    { href: "/office/school-health/records", icon: Heart, roleNames: { OFFICE: "Student Health Records", PRINCIPAL: "Student Health Records" } },
    { href: "/office/school-health/daily-check", icon: Activity, roleNames: { OFFICE: "Daily Health Check", PRINCIPAL: "Daily Health Check" } },
    { href: "/office/school-health/wellness", icon: Brain, roleNames: { OFFICE: "Wellness & Nutrition", PRINCIPAL: "Wellness & Nutrition" } },
    { href: "/office/school-health/settings", icon: Settings, roleNames: { OFFICE: "Settings & Committee", PRINCIPAL: "Settings & Committee" } },

    // Transport Management Category
    { type: "section", name: "Transport Management" },
    { href: "/office/transport", icon: Bus, roleNames: { OFFICE: "Student Transport", PRINCIPAL: "Student Transport" } },
    { href: "/student/transport", icon: Bus, roleNames: { STUDENT_PARENT: "My Transit Bus" } },

    // People Management Category
    { type: "section", name: "People Management" },
    { href: "/office/admin-management", icon: UserCog, roleNames: { OFFICE: "Admin Management", PRINCIPAL: "Admin Management" } },
    { href: "/office/school-management/teachers", icon: Users, roleNames: { OFFICE: "Teacher Management", PRINCIPAL: "Teacher Management" } },
    { href: "/office/school-management/principal", icon: UserCog, roleNames: { OFFICE: "Principal Management", PRINCIPAL: "Principal Management" } },

    // Access Module Category
    { type: "section", name: "Access Module Management" },
    { href: "/office/access-management", icon: Lock, roleNames: { OFFICE: "Access UI Management", PRINCIPAL: "Access UI Management" } },

    // Committee Management Category
    { type: "section", name: "Committee Management" },
    { href: "/office/committees", icon: Users2, roleNames: { OFFICE: "Manage Committees", PRINCIPAL: "Manage Committees" } },
  ];

  const isDefaultSectionForRole = (r: string, name: string): boolean => {
    if (r === "OFFICE" || r === "PRINCIPAL" || r === "ADMIN") {
      return [
        "Admissions", "Scholarship", "Academy Management", "Leave Management",
        "Lab, Library & Resource Management", "Incident Management", "School Health Program", "Time Table Management",
        "Transport Management", "People Management", "Access Module Management",
        "Committee Management"
      ].includes(name);
    }
    if (r === "TEACHER") {
      return ["Admissions", "Academy Management", "Incident Management"].includes(name);
    }
    if (r === "STUDENT_PARENT") {
      return ["Admissions", "Scholarship", "Academy Management", "Leave Management", "Incident Management", "Transport Management"].includes(name);
    }
    return false;
  };

  const isDefaultForItem = (r: string, href: string): boolean => {
    if (r === "OFFICE" || r === "PRINCIPAL" || r === "ADMIN") {
      return [
        "/office/dashboard",
        "/office/inquiries",
        "/office/admissions-progress",
        "/office/document-verification",
        "/office/entrance-tests",
        "/office/home-visits",
        "/office/final-admissions",
        "/office/scholarship/award",
        "/office/scholarship/students",
        "/office/scholarship/reports",
        "/office/scholarship/settings",
        "/office/academy-management/attendance",
        "/office/academy-management/classes",
        "/office/academy-management/lesson-plan",
        "/office/academy-management/lesson-plan/review",
        "/office/academy-management/homework",
        "/office/academy-management/exams",
        "/office/academy-management/leaves",
        "/office/labs",
        "/office/library",
        "/office/resources",
        "/office/leaver-management/tc",
        "/office/incident-management",
        "/office/school-health/dashboard",
        "/office/school-health/records",
        "/office/school-health/daily-check",
        "/office/school-health/wellness",
        "/office/school-health/settings",
        "/office/timetable",
        "/office/transport",
        "/office/admin-management",
        "/office/school-management/teachers",
        "/office/school-management/principal",
        "/office/access-management",
        "/office/committees"
      ].includes(href);
    }
    if (r === "TEACHER") {
      return [
        "/teacher/dashboard",
        "/office/academy-management/classes",
        "/office/academy-management/attendance",
        "/office/academy-management/lesson-plan",
        "/office/academy-management/homework",
        "/office/academy-management/lesson-plan/review",
        "/teacher/incident-management",
        "/office/inquiries",
        "/office/admissions-progress",
        "/office/document-verification",
        "/office/entrance-tests",
        "/office/home-visits"
      ].includes(href);
    }
    if (r === "STUDENT_PARENT") {
      return [
        "/student/dashboard",
        "/student/admission",
        "/student/admission?step=10",
        "/student/entrance-test",
        "/student/home-visit",
        "/student/scholarship",
        "/student/incident-management",
        "/student/homework",
        "/student/attendance",
        "/student/leave",
        "/student/transport"
      ].includes(href);
    }
    return false;
  };

  const filteredItems = React.useMemo(() => {
    let isCurrentSectionVisible = true;
    const results: any[] = [];

    for (const item of MASTER_STRUCTURE) {
      if (item.type === "section") {
        const isDefaultSec = isDefaultSectionForRole(role, item.name);
        const isSecVisible = permissions?.sections?.[item.name] !== undefined
          ? permissions.sections[item.name]
          : isDefaultSec;

        isCurrentSectionVisible = isSecVisible;
        if (isSecVisible) {
          results.push(item);
        }
      } else {
        const isDefaultBtn = isDefaultForItem(role, item.href || "");
        const isBtnVisible = permissions?.items?.[item.href || ""] !== undefined
          ? permissions.items[item.href || ""]
          : isDefaultBtn;

        if (isCurrentSectionVisible && isBtnVisible) {
          // Resolve name
          let nameToUse = "";
          const activeRole = role === "ADMIN" ? "OFFICE" : role;
          if (item.roleNames && (item.roleNames as any)[activeRole]) {
            nameToUse = (item.roleNames as any)[activeRole];
          } else {
            const keys = Object.keys(item.roleNames || {});
            nameToUse = keys.length > 0 ? (item.roleNames as any)[keys[0]] : "Module";
          }

          results.push({
            name: nameToUse,
            href: item.href,
            icon: item.icon
          });
        }
      }
    }

    return results;
  }, [role, permissions]);

  const schoolName = teacherProfile?.institute || "DPS Dhanpuri";

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  return (
    <div className="flex h-full flex-col bg-white text-slate-800 w-72 md:w-64 border-r border-slate-100 shadow-sm shadow-slate-100/10">
      <div className="p-6 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
            <GraduationCap className="text-blue-600" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-none">{schoolName}</h1>
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
          return filteredItems.map((item, idx) => {
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

            let isActive = false;
            
            if (regularItem.href.includes("step=10")) {
              // Doc verification step (student side)
              isActive = pathname === "/student/admission" && currentStep === "10";
            } else if (regularItem.href === "/student/admission") {
              // Generic admission form (steps 1-9, or 11)
              isActive = pathname === "/student/admission" && currentStep !== "10";
            } else if (regularItem.href === "/office/document-verification") {
              // Office side verification highlight
              isActive = pathname === "/office/document-verification" || (pathname.startsWith("/office/admissions/") && currentStep === "10");
            } else if (regularItem.href === "/office/admissions-progress") {
              // Generic admissions progress (office)
              isActive = pathname === "/office/admissions-progress" || (pathname.startsWith("/office/admissions/") && currentStep !== "10");
            } else {
              isActive = pathname === regularItem.href;
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
