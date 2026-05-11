"use client";

import React from "react";
import { School, Check, ChevronDown } from "lucide-react";
import { useInstitute } from "@/providers/InstituteProvider";
import { useSession } from "next-auth/react";

export function GlobalInstituteFilter() {
  const { selectedInstitute, setSelectedInstitute, institutes, loading } = useInstitute();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = React.useState(false);

  // Only show for ADMIN (OFFICE) role
  if (session?.user?.role !== "OFFICE") return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:border-blue-500 hover:bg-blue-50/30 transition-all shadow-sm active:scale-95"
      >
        <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <School className="h-3.5 w-3.5" />
        </div>
        <span className="hidden sm:inline">
          {selectedInstitute === "ALL" ? "Global Institute Filter" : selectedInstitute}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
            <div className="p-2 border-b border-slate-50 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1">Select Institute</span>
            </div>
            <div className="max-h-64 overflow-y-auto p-1.5">
              <button
                onClick={() => {
                  setSelectedInstitute("ALL");
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  selectedInstitute === "ALL" 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>All Institutes</span>
                {selectedInstitute === "ALL" && <Check className="h-4 w-4" />}
              </button>
              
              {institutes.map((inst) => (
                <button
                  key={inst}
                  onClick={() => {
                    setSelectedInstitute(inst);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors mt-1 ${
                    selectedInstitute === inst 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{inst}</span>
                  {selectedInstitute === inst && <Check className="h-4 w-4" />}
                </button>
              ))}
              
              {loading && (
                <div className="py-4 flex justify-center">
                  <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
