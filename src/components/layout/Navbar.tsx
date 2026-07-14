"use client";

import React from "react";
import { Bell, Search, User, Menu, LogOut, Settings, Edit, ChevronDown } from "lucide-react";
import { GlobalInstituteFilter } from "./GlobalInstituteFilter";
import Link from "next/link";

interface NavbarProps {
  onMenuClick?: () => void;
}

import { useSession, signOut } from "next-auth/react";

export function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession();
  const [teacherInstitute, setTeacherInstitute] = React.useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

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

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".profile-dropdown-container")) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const schoolName = teacherInstitute || "DPS Dhanpuri";
  const userInitials = session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : "ST";
  const userEmail = session?.user?.email || "demo-fellow@gmail.com";

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
        <div className="relative profile-dropdown-container">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="h-8 w-8 md:h-9 md:w-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
              <User className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden py-2 animate-in slide-in-from-top-2 duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900">Logged In</p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              </div>
              <div className="py-2">
                <Link 
                  href="/profile" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  {session?.user?.role === "STUDENT" ? (
                    <>
                      <User className="h-4 w-4 mr-3 text-slate-400" />
                      Profile View
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-3 text-slate-400" />
                      Edit Profile
                    </>
                  )}
                </Link>
              </div>
              <div className="border-t border-slate-100 py-2 pb-0">
                <button 
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
