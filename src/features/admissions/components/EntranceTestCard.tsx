"use client";

import React from "react";
import { 
  Calendar, 
  Clock, 
  MapPinned, 
  Users, 
  Phone, 
  Trophy, 
  AlertCircle, 
  Loader2,
  CheckCircle,
  XCircle,
  ClipboardList
} from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";

interface EntranceTestCardProps {
  testData: any;
  studentName: string;
}

export function EntranceTestCard({ testData, studentName }: EntranceTestCardProps) {
  if (!testData || testData.status === "NOT_SCHEDULED") {
    return (
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center space-y-4">
        <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Loader2 className="animate-spin" size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-900 uppercase italic">Next Step: Entrance Test</h3>
        <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
          The school office will schedule your entrance test shortly. Please check back later for date and time.
        </p>
      </div>
    );
  }

  const { status, testDate, testTime, location, teacherName, contactNumber, remarks } = testData;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* NEUTRAL TEST HEADER */}
      <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl shadow-slate-200 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl md:text-2xl font-black font-outfit tracking-wider uppercase italic border-b border-blue-500 pb-2 inline-block">Entrance Test Schedule</h2>
          <p className="text-[10px] md:text-xs font-bold opacity-60 uppercase tracking-[0.2em] leading-relaxed">
            Please Review Date, Time & Location Below
          </p>
        </div>
        <div className="absolute -right-6 -bottom-6 opacity-5 rotate-12">
          <ClipboardList size={180} />
        </div>
      </div>

      {/* TEST DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem icon={<Calendar size={20} />} label="Date" value={formatDate(testDate)} />
        <DetailItem icon={<Clock size={20} />} label="Time" value={formatTime(testTime)} />
        <DetailItem icon={<MapPinned size={20} />} label="Location" value={location || "School Premises"} className="md:col-span-2" />
        <DetailItem icon={<Users size={20} />} label="Teacher" value={teacherName || "-"} />
        <DetailItem icon={<Phone size={20} />} label="Contact" value={contactNumber || "-"} />
      </div>

      {/* RESULT SECTION */}
      {status !== "PENDING" && (
        <div className={cn(
          "p-8 rounded-[32px] border-2 space-y-4 transition-all duration-300",
          status === "PASS" ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
        )}>
          <div className="flex items-center gap-4">
             <div className={cn(
               "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
               status === "PASS" ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-red-500 text-white shadow-red-500/20"
             )}>
                {status === "PASS" ? <CheckCircle size={24} /> : <XCircle size={24} />}
             </div>
             <div>
                <h4 className={cn("text-lg font-black uppercase italic", status === "PASS" ? "text-emerald-700" : "text-red-700")}>
                    Test Result: {status}
                </h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Released on {testData.resultDate ? formatDate(new Date(testData.resultDate).toISOString().split('T')[0]) : 'recently'}</p>
             </div>
          </div>
          
          {remarks && (
            <div className="p-4 bg-white/50 rounded-2xl border border-white/50 backdrop-blur-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teacher Remarks</p>
                <p className="text-sm font-medium text-slate-700 italic">"{remarks}"</p>
            </div>
          )}
        </div>
      )}

      {status === "PENDING" && (
        <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-start gap-4">
          <AlertCircle className="text-blue-500 shrink-0 mt-1" size={24} />
          <div className="space-y-1">
             <p className="text-sm font-black text-blue-900 uppercase">Preparation Tip</p>
             <p className="text-xs font-medium text-blue-700 leading-relaxed">
                Please arrive at the location at least 15 minutes before the scheduled time. Bring all your original documents for final verification.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value, className }: { icon: React.ReactNode, label: string, value: string, className?: string }) {
  return (
    <div className={cn("bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-100 transition-all duration-300", className)}>
      <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg font-black text-slate-900 font-outfit truncate">{value}</p>
      </div>
    </div>
  );
}
