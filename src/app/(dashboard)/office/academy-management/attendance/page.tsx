import React from "react";
import { CalendarCheck, Plus } from "lucide-react";

export default function AttendancePage() {
  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
          Attendance Management
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Track and manage student attendance.</p>
      </div>

      <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px] shadow-sm">
        <div className="h-16 w-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-green-500/5">
          <CalendarCheck className="h-8 w-8" />
        </div>
        
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold text-slate-800">No Attendance Records</h2>
          <p className="text-sm text-slate-500">
            Attendance tracking hasn't been initialized for today. Select a class to start marking attendance.
          </p>
        </div>

        <button 
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-weight-bold rounded-2xl hover:bg-green-700 transition-all font-bold text-sm shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Mark Attendance
        </button>
      </div>
    </div>
  );
}
