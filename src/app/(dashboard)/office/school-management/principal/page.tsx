"use client";

import React from "react";

export default function PrincipalManagementPage() {
  return (
    <div className="p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">Principal Management</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">Manage administrative principal operations tools setup layout.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
         <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-black">👔</span>
         </div>
         <p className="text-sm font-black text-slate-800 uppercase tracking-wide">Under Construction</p>
         <p className="text-xs text-slate-400 font-medium max-w-sm">This page of Principal management is coming soon accurately.</p>
      </div>
    </div>
  );
}
