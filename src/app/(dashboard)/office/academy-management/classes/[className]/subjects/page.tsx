import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus, FolderPlus } from "lucide-react";

interface SubjectPageProps {
  params: {
    className: string;
  };
}

export default function SubjectPage({ params }: SubjectPageProps) {
  const decodedClassName = decodeURIComponent(params.className);

  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Link 
          href="/office/academy-management/classes"
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
            Subjects - {decodedClassName === "Nursery" || decodedClassName === "LKG" || decodedClassName === "UKG" ? decodedClassName : `Class ${decodedClassName}`}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Manage and organize subjects for this class.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[400px] shadow-sm">
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-blue-500/5 animate-pulse">
          <BookOpen className="h-8 w-8" />
        </div>
        
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold text-slate-800">No Subjects Added Yet</h2>
          <p className="text-sm text-slate-500">
            You haven't defined any subjects for this class. Create subjects to start managing curriculum.
          </p>
        </div>

        <button 
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-weight-bold rounded-2xl hover:bg-blue-700 transition-all font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Your First Subject
        </button>
      </div>
    </div>
  );
}
