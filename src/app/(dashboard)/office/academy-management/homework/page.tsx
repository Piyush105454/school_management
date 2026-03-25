import React from "react";
import { ClipboardEdit, Plus } from "lucide-react";

export default function HomeworkPage() {
  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
          Homework Management
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Assign, track, and evaluate student homework.</p>
      </div>

      <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px] shadow-sm">
        <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-purple-500/5">
          <ClipboardEdit className="h-8 w-8" />
        </div>
        
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold text-slate-800">No Homework Assigned</h2>
          <p className="text-sm text-slate-500">
            You haven't assigned any homework yet. Create simple tasks to started managing curriculum updates.
          </p>
        </div>

        <button 
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-weight-bold rounded-2xl hover:bg-purple-700 transition-all font-bold text-sm shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Create Homework
        </button>
      </div>
    </div>
  );
}
