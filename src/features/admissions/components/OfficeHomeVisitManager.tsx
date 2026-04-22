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
  Download,
  Eye
} from "lucide-react";
import { generateHomeVisitPDF } from "@/features/admissions/utils/generateHomeVisitPDF";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { scheduleHomeVisit, updateHomeVisitStatus, getHomeVisitData, syncHomeVisitField } from "@/features/admissions/actions/homeVisitActions";
import { SmartUploader } from "./SmartUploader";

export function OfficeHomeVisitManager({ applicant, teachers = [] }: { applicant: any, teachers?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [visitData, setVisitData] = useState({
    visitDate: applicant.homeVisit?.visitDate || "",
    visitTime: applicant.homeVisit?.visitTime || "",
    teacherName: applicant.homeVisit?.teacherName || "",
    remarks: applicant.homeVisit?.remarks || "",
    visitImage: applicant.homeVisit?.visitImage || "",
    homePhoto: (() => {
      try {
        return applicant.homeVisit?.homePhoto ? JSON.parse(applicant.homeVisit.homePhoto) : [];
      } catch (e) {
        return applicant.homeVisit?.homePhoto ? [applicant.homeVisit.homePhoto] : [];
      }
    })(),
    status: applicant.homeVisit?.status || "NOT_SCHEDULED"
  });
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);



  const [selectedTeacher1, setSelectedTeacher1] = useState("");
  const [selectedTeacher2, setSelectedTeacher2] = useState("");
  const [selectedTeacher3, setSelectedTeacher3] = useState("");

  useEffect(() => {
    if (visitData.teacherName) {
      try {
        const parsed = JSON.parse(visitData.teacherName);
        setSelectedTeacher1(parsed.teacher1 || "");
        setSelectedTeacher2(parsed.teacher2 || "");
        setSelectedTeacher3(parsed.teacher3 || "");
      } catch (e) {
        setSelectedTeacher1(visitData.teacherName);
      }
    } else {
      const classTeacher = teachers.find((t: any) => t.classAssigned === applicant.inquiry?.appliedClass);
      if (classTeacher) {
        setSelectedTeacher1(classTeacher.name);
      }
    }
  }, [visitData.teacherName, teachers, applicant.inquiry?.appliedClass]);


  useEffect(() => {
    if (isOpen && (!visitData.visitImage || (Array.isArray(visitData.homePhoto) && visitData.homePhoto.length === 0))) {
      getHomeVisitData(applicant.id).then((res: any) => {
        if (res.success && (res.data?.visitImage || res.data?.homePhoto)) {
          setVisitData((prev: any) => ({ 
            ...prev, 
            visitImage: res.data.visitImage || prev.visitImage,
            homePhoto: res.data.homePhoto ? 
              (() => { try { return JSON.parse(res.data.homePhoto); } catch (e) { return [res.data.homePhoto]; } })() : prev.homePhoto
          }));
        }
      });
    }

  }, [isOpen, applicant.id, visitData.visitImage]);

  const handleReportUpload = async (url: string) => {
    setVisitData({ ...visitData, visitImage: url });
    await syncHomeVisitField(applicant.id, "visitImage", url);
  };

  const handlePhotoUpload = async (url: string, idx: number) => {
    const updated = [...(visitData.homePhoto || [])];
    updated[idx] = url;
    setVisitData((prev: any) => ({
      ...prev,
      homePhoto: updated
    }));
    await syncHomeVisitField(applicant.id, `home_photo_${idx}`, url);
  };

  const removePhoto = async (idx: number) => {
    const updated = [...visitData.homePhoto];
    updated.splice(idx, 1);
    setVisitData({ ...visitData, homePhoto: updated });
    await syncHomeVisitField(applicant.id, `home_photo_${idx}`, null);
  };



  const studentName = applicant.inquiry?.studentName || "Unknown Applicant";
  const status = visitData.status;

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!visitData.visitDate || !visitData.visitTime || !selectedTeacher1) {
      alert("Please fill all mandatory fields: Date, Time, and Primary Teacher.");
      return;
    }

    setLoading(true);
    const { status: currentStatus, ...dataWithoutStatus } = visitData;
    
    // Add teacher data as JSON
    dataWithoutStatus.teacherName = JSON.stringify({
      teacher1: selectedTeacher1,
      teacher2: selectedTeacher2,
      teacher3: selectedTeacher3
    });

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
    const res = await updateHomeVisitStatus(
      applicant.id, 
      newStatus, 
      visitData.remarks, 
      visitData.visitImage,
      JSON.stringify(visitData.homePhoto)
    );
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
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-l-2 pl-3 border-slate-100">
                      {visitData.visitDate ? `${formatDate(visitData.visitDate)} | ${formatTime(visitData.visitTime)}` : "NOT SCHEDULED"}
                    </p>
                    <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ml-auto",
                        status === "PASS" ? "bg-emerald-100 text-emerald-700" :
                        status === "FAIL" ? "bg-red-100 text-red-700" :
                        status === "PENDING" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                    )}>
                        {status === "PASS" ? "COMPLETED" : status === "FAIL" ? "FAILED" : status}
                    </span>
                </div>
            </div>
        </div>

        <div className="ml-auto">
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
                    <div className="col-span-2 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teacher 1 (Class Teacher)</label>
                            <select 
                                value={selectedTeacher1}
                                onChange={(e) => setSelectedTeacher1(e.target.value)}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map((t: any) => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teacher 2 (Optional)</label>
                            <select 
                                value={selectedTeacher2 || ""}
                                onChange={(e) => setSelectedTeacher2(e.target.value)}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map((t: any) => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teacher 3 (Principal - Optional)</label>
                            <select 
                                value={selectedTeacher3 || ""}
                                onChange={(e) => setSelectedTeacher3(e.target.value)}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                            >
                                <option value="">Select Teacher</option>
                                {teachers.map((t: any) => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
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

                  <div className="space-y-4">
                     <SmartUploader
                         admissionId={applicant.id}
                         fieldName="visitImage"
                         label="Home Visit Report (PDF)"
                         hindiLabel="होम विजिट रिपोर्ट (केवल PDF)"
                         initialUrl={visitData.visitImage}
                         category="home-visits"
                         maxSizeMB={0.5}
                         onUploadComplete={handleReportUpload}
                         onDelete={() => setVisitData({ ...visitData, visitImage: "" })}
                         accept="application/pdf"
                     />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          Home Photos (Minimum 1 Required)
                      </label>
                      <button 
                        type="button"
                        onClick={() => setIsAddingPhoto(!isAddingPhoto)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border flex items-center gap-2",
                          isAddingPhoto 
                            ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100" 
                            : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                        )}
                      >
                        {isAddingPhoto ? "Cancel" : "+ Add Photo"}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {/* Map over existing photos */}
                        {(visitData.homePhoto || []).map((url: string, idx: number) => (
                           <SmartUploader
                             key={`photo-${idx}-${url.slice(-10)}`}
                             admissionId={applicant.id}
                             fieldName={`home_photo_${idx}`}
                             label={`Home Photo ${idx + 1}`}
                             initialUrl={url}
                             category="home-visits"
                             maxSizeMB={0.5}
                             onUploadComplete={(newUrl) => handlePhotoUpload(newUrl, idx)}
                             onDelete={() => removePhoto(idx)}
                             accept="image/*"
                           />
                        ))}
                        
                        {/* Show ONE empty slot only when button clicked */}
                        {isAddingPhoto && (
                           <SmartUploader
                             key={`photo-new-${visitData.homePhoto.length}`}
                             admissionId={applicant.id}
                             fieldName={`home_photo_${(visitData.homePhoto || []).length}`}
                             label="Capture / Select New Photo"
                             category="home-visits"
                             maxSizeMB={0.5}
                             onUploadComplete={(url) => {
                               handlePhotoUpload(url, (visitData.homePhoto || []).length);
                               setIsAddingPhoto(false);
                             }}
                             accept="image/*"
                           />
                        )}
                    </div>
                  </div>




                  <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => handleStatusChange("PASS")}
                        disabled={loading || status !== "PENDING" || !visitData.visitImage || (!Array.isArray(visitData.homePhoto) || visitData.homePhoto.length === 0)}
                        className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-30 disabled:grayscale transition-opacity"
                    >
                        <CheckCircle size={14} /> MARK AS COMPLETED
                    </button>
                    <button
                        type="button"
                        onClick={() => handleStatusChange("FAIL")}
                        disabled={loading || status !== "PENDING" || !visitData.visitImage || (!Array.isArray(visitData.homePhoto) || visitData.homePhoto.length === 0)}
                        className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-30 disabled:grayscale transition-opacity"
                    >
                        <XCircle size={14} /> MARK AS FAILED
                    </button>
                  </div>
                  
                  {(!visitData.visitImage || (Array.isArray(visitData.homePhoto) ? visitData.homePhoto.length === 0 : true)) && status === "PENDING" && (
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center mt-2 animate-pulse mb-6">
                        Report & Home Photos are required to finalize this visit.
                    </p>
                  )}

                 {/* Finalize components removed as per request */}
              </div>

           </div>
        </div>
      )}
      {previewImage && (
         <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 cursor-pointer" onClick={() => setPreviewImage(null)}>
             <img src={previewImage || undefined} className="max-h-[95vh] max-w-[95vw] object-contain rounded-2xl animate-in zoom-in duration-200" />
         </div>
      )}
    </div>
  );
}

