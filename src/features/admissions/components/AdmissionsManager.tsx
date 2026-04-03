"use client";

import React from "react";
import { AdmissionProcessList } from "@/features/admissions/components/AdmissionProcessList";

export function AdmissionsManager({ 
  admissions 
}: { 
  admissions: any[] 
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Admission Progress</h1>
          <p className="text-slate-500 font-medium">Track students through the different admission stages.</p>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AdmissionProcessList admissions={admissions} />
      </div>
    </div>
  );
}
