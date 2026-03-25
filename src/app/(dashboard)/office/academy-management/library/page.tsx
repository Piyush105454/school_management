import React from "react";
import { FolderOpen, Plus } from "lucide-react";

export default function LibraryPage() {
  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
          Library & Resources
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Manage book assignments, digital documents and learning materials.</p>
      </div>

      <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px] shadow-sm">
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-blue-500/5">
          <FolderOpen className="h-8 w-8" />
        </div>
        
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold text-slate-800">No Resources Found</h2>
          <p className="text-sm text-slate-500">
            The Digital Library is currently empty. Start uploading books, syllabi or resource links to expand the library catalog.
          </p>
        </div>

        <button 
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-weight-bold rounded-2xl hover:bg-blue-700 transition-all font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Resource
        </button>
      </div>
    </div>
  );
}
