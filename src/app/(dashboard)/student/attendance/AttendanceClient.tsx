"use client";

import React, { useState, useMemo } from "react";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Umbrella,
  Info
} from "lucide-react";

interface AttendanceRecord {
  id: number;
  date: Date | string;
  status: string;
  day: string;
  month: string;
  year: number;
}

export default function AttendanceClient({ initialData }: { initialData: AttendanceRecord[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthAttendance = useMemo(() => {
    return initialData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentDate.getMonth() && recordDate.getFullYear() === currentDate.getFullYear();
    });
  }, [initialData, currentDate]);

  const stats = useMemo(() => {
    const total = monthAttendance.filter(r => !["H", "NA"].includes(r.status)).length;
    const present = monthAttendance.filter(r => ["P", "ML", "HD"].includes(r.status)).length;
    const absent = monthAttendance.filter(r => r.status === "A").length;
    const leaves = monthAttendance.filter(r => r.status === "L").length;
    
    return {
      total,
      present,
      absent,
      leaves,
      percentage: total > 0 ? ((present / total) * 100).toFixed(1) : "0.0"
    };
  }, [monthAttendance]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    
    const days = [];
    for (let d = 1; d <= end.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    
    // Add padding for start of week (assuming week starts on Sunday)
    const startPadding = Array.from({ length: start.getDay() }).map((_, i) => null);
    return [...startPadding, ...days];
  }, [currentDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "P": return "bg-emerald-500 text-white shadow-emerald-500/20";
      case "A": return "bg-rose-500 text-white shadow-rose-500/20";
      case "L": return "bg-amber-500 text-white shadow-amber-500/20";
      case "ML": return "bg-blue-500 text-white shadow-blue-500/20";
      case "HD": return "bg-orange-400 text-white shadow-orange-400/20";
      case "H": return "bg-slate-200 text-slate-500";
      default: return "bg-slate-50 text-slate-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "P": return <CheckCircle2 size={12} />;
      case "A": return <XCircle size={12} />;
      case "L": return <Umbrella size={12} />;
      case "H": return <Calendar size={12} />;
      default: return null;
    }
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Calendar className="text-blue-600 h-8 w-8" />
            My Attendance
          </h1>
          <p className="text-slate-500 font-medium mt-1">Track your daily presence and monthly scholarship eligibility.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-black text-slate-900 uppercase tracking-widest min-w-[140px] text-center">
            {monthName} {currentDate.getFullYear()}
          </span>
          <button 
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Card */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden p-8 space-y-8">
          <div className="grid grid-cols-7 gap-2 md:gap-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {day}
              </div>
            ))}
            {calendarDays.map((date, i) => {
              if (!date) return <div key={`pad-${i}`} />;
              
              const record = monthAttendance.find(r => {
                const rDate = new Date(r.date);
                return rDate.getDate() === date.getDate() && rDate.getMonth() === date.getMonth() && rDate.getFullYear() === date.getFullYear();
              });
              const status = record?.status || "";
              
              return (
                <div 
                  key={date.toISOString()}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl md:rounded-3xl border transition-all ${
                    status 
                      ? "border-transparent " + getStatusColor(status) 
                      : "border-slate-100 hover:border-blue-200 bg-white"
                  } shadow-lg`}
                >
                  <span className={`text-sm md:text-lg font-black ${status ? "text-white" : "text-slate-700"}`}>
                    {date.getDate()}
                  </span>
                  {status && (
                    <div className="absolute bottom-2 md:bottom-3 opacity-80">
                      {getStatusIcon(status)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-8 border-t border-slate-100 grid grid-cols-3 md:grid-cols-6 gap-4">
             {[
               { label: "Present", code: "P", color: "bg-emerald-500" },
               { label: "Absent", code: "A", color: "bg-rose-500" },
               { label: "Leave", code: "L", color: "bg-amber-500" },
               { label: "Medical", code: "ML", color: "bg-blue-500" },
               { label: "Half Day", code: "HD", color: "bg-orange-400" },
               { label: "Holiday", code: "H", color: "bg-slate-200" },
             ].map(item => (
               <div key={item.code} className="flex items-center gap-2">
                 <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Stats Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Monthly Performance</p>
              <h2 className="text-4xl font-black italic">{stats.percentage}%</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Present</p>
                <p className="text-xl font-black">{stats.present}</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Absent</p>
                <p className="text-xl font-black text-rose-400">{stats.absent}</p>
              </div>
            </div>

            <div className="p-6 bg-blue-600 rounded-3xl shadow-xl shadow-blue-600/20 space-y-3">
              <div className="flex items-center gap-3">
                <Info size={16} className="text-blue-100" />
                <p className="text-xs font-bold text-blue-100">Scholarship Status</p>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {Number(stats.percentage) >= 90 
                  ? "Congratulations! You have maintained 90%+ attendance. You are eligible for this month's scholarship reward."
                  : "Attention: Your attendance is below 90%. Please maintain regular attendance to qualify for the monthly scholarship reward."}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <Clock className="text-slate-400 h-5 w-5" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Activity</h3>
             </div>
             <div className="space-y-4">
               {monthAttendance.slice(-5).reverse().map((record, idx) => {
                 const rDate = new Date(record.date);
                 return (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xs font-bold text-slate-600">{rDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: '2-digit' })}</span>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                        record.status === 'P' ? "bg-emerald-50 text-emerald-600" : 
                        record.status === 'A' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
                      }`}>
                        {record.status === 'P' ? "Present" : record.status === 'A' ? "Absent" : record.status}
                      </span>
                  </div>
                 );
               })}
               {monthAttendance.length === 0 && <p className="text-xs text-slate-400 font-medium italic text-center py-4">No attendance marked yet.</p>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
