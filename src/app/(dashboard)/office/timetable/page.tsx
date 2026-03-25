import React from "react";
import { Clock, Plus } from "lucide-react";

export default function TimetablePage() {
  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
          Time Table Management
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Manage and organize class schedules and timing tables.</p>
      </div>

      <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px] shadow-sm">
        <div className="h-16 w-16 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-pink-500/5">
          <Clock className="h-8 w-8" />
        </div>
        
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold text-slate-800">No Timetables Generated</h2>
          <p className="text-sm text-slate-500">
            You haven't defined schedules for any class yet. Define lecture periods and breaks to organize timings.
          </p>
        </div>

        <button 
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-pink-600 text-white font-weight-bold rounded-2xl hover:bg-pink-700 transition-all font-bold text-sm shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Create Timetable
        </button>
      </div>
    </div>
  );
}
