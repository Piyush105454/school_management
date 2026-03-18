"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Download
} from "lucide-react";
import { generateHomeVisitPDF } from "@/features/admissions/utils/generateHomeVisitPDF";
import { cn } from "@/lib/utils";
import { scheduleHomeVisit, updateHomeVisitStatus, getHomeVisitData } from "@/features/admissions/actions/homeVisitActions";
// Remove finalize component imports to avoid unused warnings


const compressImage = (base64Str: string, maxWidth = 1000, maxHeight = 1000): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
  });
};

export function OfficeHomeVisitManager({ applicant, teachers = [] }: { applicant: any, teachers?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [visitData, setVisitData] = useState((applicant as any).homeVisit || {
    visitDate: "",
    visitTime: "",
    teacherName: "",
    remarks: "",
    visitImage: "",
    status: "NOT_SCHEDULED"
  });

  useEffect(() => {
    if (isOpen && !visitData.visitImage) {
      getHomeVisitData(applicant.id).then((res: any) => {
        if (res.success && res.data?.visitImage) {
          setVisitData((prev: any) => ({ ...prev, visitImage: res.data.visitImage }));
        }
      });
    }
  }, [isOpen, applicant.id, visitData.visitImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string);
        setVisitData({ ...visitData, visitImage: compressed });
      } catch (e) {
        console.error("Compression error:", e);
        alert("Error compressing image.");
      }
    };
    reader.readAsDataURL(file);
  };


  const studentName = applicant.inquiry?.studentName || "Unknown Applicant";
  const status = visitData.status;

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { status: currentStatus, ...dataWithoutStatus } = visitData;
    const res = await scheduleHomeVisit(applicant.id, dataWithoutStatus);
    setLoading(false);
    if (res.success) {
      alert("Home Visit Scheduled Successfully!");
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleStatusChange = async (newStatus: "PASS" | "FAIL") => {
    if (!confirm(`Mark ${studentName}'s Home Visit as ${newStatus === "PASS" ? "COMPLETED" : "FAILED"}?`)) return;
    setLoading(true);
    const res = await updateHomeVisitStatus(applicant.id, newStatus, visitData.remarks, visitData.visitImage);
    setLoading(false);

    if (res.success) {
      setVisitData({ ...visitData, status: newStatus });
      alert(`Status Updated to ${newStatus === "PASS" ? "COMPLETED" : "FAILED"}`);
    } else {
      alert("Error updating status: " + res.error);
    }
  };


  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50">
      <div 
        className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-6">
            <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <User size={28} />
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-900 font-outfit uppercase tracking-tight italic">{studentName}</h3>
                <div className="flex items-center gap-4 mt-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry: {applicant.entryNumber}</p>
                    <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                        status === "PASS" ? "bg-emerald-100 text-emerald-700" :
                        status === "FAIL" ? "bg-red-100 text-red-700" :
                        status === "PENDING" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                    )}>
                        {status === "PASS" ? "COMPLETED" : status === "FAIL" ? "FAILED" : status}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
            <button 
                type="button" 
                onClick={async (e) => { 
                    e.stopPropagation(); 
                    setDownloadingPdf(true);
                    try { await generateHomeVisitPDF(applicant); } 
                    finally { setDownloadingPdf(false); }
                }} 
                disabled={downloadingPdf}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center gap-1.5 border border-blue-100/30 transition-all select-none disabled:opacity-50"
                title="Download Visit Report"
            >
                {downloadingPdf ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                <span className="text-[10px] font-black uppercase tracking-wider">{downloadingPdf ? "Loading..." : "Report"}</span>
            </button>
            {isOpen ? <ChevronUp className="text-slate-300" /> : <ChevronDown className="text-slate-300" />}
        </div>
      </div>

      {isOpen && (
        <div className="px-6 pb-6 md:px-8 md:pb-8 animate-in slide-in-from-top-2 duration-300">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
              <form onSubmit={handleSaveSchedule} className="space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> Scheduling Details
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                        <input 
                            type="date"
                            value={visitData.visitDate || ""}
                            onChange={(e) => setVisitData({ ...visitData, visitDate: e.target.value })}
                            className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Time</label>
                        <input 
                            type="time"
                            value={visitData.visitTime || ""}
                            onChange={(e) => setVisitData({ ...visitData, visitTime: e.target.value })}
                            className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teacher Assigned</label>
                        <select 
                            value={visitData.teacherName || ""}
                            onChange={(e) => setVisitData({ ...visitData, teacherName: e.target.value })}
                            className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                        >
                            <option value="">Select Teacher</option>
                            {teachers.map((t: any) => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                 </div>

                 <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-50"
                 >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Update Visit Schedule"}
                 </button>
              </form>

              <div className="space-y-6 lg:border-l lg:pl-8 border-slate-50">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle size={12} /> Visit Completion
                 </h4>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Remarks / Feedback</label>
                    <textarea 
                        value={visitData.remarks || ""}
                        onChange={(e) => setVisitData({ ...visitData, remarks: e.target.value })}
                        placeholder="Enter visit summary or feedback..."
                        className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-3 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 transition-all font-medium italic"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FileText size={12} /> Upload Visit Report/Image
                    </label>
                    <input 
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {visitData.visitImage && (
                        <div className="mt-2 rounded-xl border border-slate-100 overflow-hidden max-w-[150px] relative group">
                            <img src={visitData.visitImage} alt="Visit Report" className="h-24 w-full object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[8px] font-black text-white bg-red-600 px-2 py-1 rounded-md cursor-pointer" onClick={() => setVisitData({ ...visitData, visitImage: "" })}>REMOVE</span>
                            </div>
                        </div>
                    )}
                 </div>


                  <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => handleStatusChange("PASS")}
                        disabled={loading || status === "PASS"}
                        className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-30"
                    >
                        <CheckCircle size={14} /> MARK AS COMPLETED
                    </button>
                    <button
                        type="button"
                        onClick={() => handleStatusChange("FAIL")}
                        disabled={loading || status === "FAIL"}
                        className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-30"
                    >
                        <XCircle size={14} /> MARK AS FAILED
                    </button>
                 </div>

                 {/* Finalize components removed as per request */}
              </div>

           </div>
        </div>
      )}
    </div>
  );
}
