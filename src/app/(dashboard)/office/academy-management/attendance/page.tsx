"use client";

import React, { useState, useEffect } from "react";
import { CalendarCheck, ChevronRight, Users, Camera } from "lucide-react";
import AttendanceUploader from "@/features/academy/components/AttendanceUploader";
import StudentMappingUploader from "@/features/academy/components/StudentMappingUploader";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AttendanceFilters, { AttendanceFiltersState } from "@/features/academy/components/AttendanceFilters";
import AttendanceAnalyticsChart from "@/features/academy/components/AttendanceAnalyticsChart";

export default function AttendancePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role !== "TEACHER";
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  const currentDate = new Date();
  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const [filters, setFilters] = useState<AttendanceFiltersState>({
    months: [currentMonth],
    year: currentYear,
    classes: [],
    studentIds: [],
    gender: "ALL",
    religion: "ALL",
    occupation: "ALL"
  });

  const [classesList, setClassesList] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch classes list for filters
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes");
        const data = await res.json();
        setClassesList(data);
      } catch (err) {
        console.error("Failed to fetch classes", err);
      }
    };
    fetchClasses();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("months", filters.months.join(","));
      queryParams.append("year", filters.year.toString());
      if (filters.classes.length > 0) {
        queryParams.append("classes", filters.classes.join(","));
      }
      if (filters.studentIds.length > 0) {
        queryParams.append("studentIds", filters.studentIds.map(s => s.id).join(","));
      }
      if (filters.gender !== "ALL") queryParams.append("gender", filters.gender);
      if (filters.religion !== "ALL") queryParams.append("religion", filters.religion);
      if (filters.occupation !== "ALL") queryParams.append("occupation", filters.occupation);

      const res = await fetch(`/api/attendance/analytics?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
            Attendance Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Global tracking and school-wide metrics.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <StudentMappingUploader />
            <AttendanceUploader onSuccess={fetchAnalytics} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <Link href={`/office/academy-management/attendance/class/grid?month=${filters.months[0]}&year=${filters.year}`} className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-100 transition-all group">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-900">Class Wise</p>
              <p className="text-[10px] text-indigo-600 font-medium">View Grids</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-indigo-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link href="/office/academy-management/attendance/daily" className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-2xl hover:bg-amber-100 transition-all group">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Daily Register</p>
              <p className="text-[10px] text-amber-600 font-medium">Mark Today</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link href="/face-scanner" target="_blank" className="flex items-center justify-between p-3 bg-rose-50 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-all group">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-900">Kiosk Scanner</p>
              <p className="text-[10px] text-rose-600 font-medium">Face Attendance</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-rose-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <div className="flex items-center justify-center p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <div className="text-center">
            <p className="text-xs font-bold text-emerald-900">Avg. Attendance</p>
            <p className="text-xl font-black text-emerald-600">
              {analyticsData?.overall?.pct !== undefined ? `${analyticsData.overall.pct}%` : '--'}
            </p>
          </div>
        </div>
      </div>

      <AttendanceFilters filters={filters} setFilters={setFilters} classesList={classesList} />

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-20 flex flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500 italic">Crunching data...</p>
        </div>
      ) : !analyticsData || (analyticsData.type === 'classes' && analyticsData.classes.length === 0) || (analyticsData.type === 'students' && analyticsData.students.length === 0) ? (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-20 flex flex-col items-center justify-center text-center gap-4">
          <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center">
            <CalendarCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-slate-800">No records for {filters.months.join(", ")} {filters.year}</p>
            <p className="text-sm text-slate-500 max-w-xs">There is no attendance data matching the selected filters.</p>
          </div>
        </div>
      ) : (
        <AttendanceAnalyticsChart 
          data={analyticsData} 
          months={filters.months} 
          year={filters.year} 
          genderFilter={filters.gender}
          classesFilter={filters.classes}
          studentIdsFilter={filters.studentIds}
        />
      )}
    </div>
  );
}
