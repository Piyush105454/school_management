"use client";

import React from "react";
import { Bell, Search, User, Menu } from "lucide-react";
import { GlobalInstituteFilter } from "./GlobalInstituteFilter";

interface NavbarProps {
  onMenuClick?: () => void;
}

import { useSession } from "next-auth/react";

export function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession();
  const [teacherInstitute, setTeacherInstitute] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (session?.user?.role === "TEACHER") {
      fetch("/api/teacher/profile")
        .then(res => res.json())
        .then(data => {
          if (data.institute) setTeacherInstitute(data.institute);
        })
        .catch(err => console.error(err));
    }
  }, [session]);

  const schoolName = teacherInstitute || "DPS Dhanpuri";
  return (
    <header className="h-14 md:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="relative w-96 max-w-full hidden md:flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
          <GlobalInstituteFilter />
        </div>
        
        {/* Mobile School Name */}
        <span className="md:hidden font-bold text-slate-900 text-sm truncate uppercase tracking-tight">
            {schoolName}
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="h-6 md:h-8 w-px bg-slate-200 mx-1"></div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 md:h-9 md:w-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-sm">
            ST
          </div>
        </div>
      </div>
    </header>
  );
}
