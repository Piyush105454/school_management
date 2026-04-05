"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  Clock, 
  MapPinned, 
  User, 
  Phone,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { scheduleEntranceTest, updateTestResult } from "@/features/admissions/actions/testActions";
import { finalizeFinalAdmission } from "@/features/admissions/actions/admissionActions";

export function OfficeTestManager({ applicant, teachers = [] }: { applicant: any, teachers?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    testDate: applicant.entranceTest?.testDate || "",
    testTime: applicant.entranceTest?.testTime || "",
    location: applicant.entranceTest?.location || "",
    teacherName: applicant.entranceTest?.teacherName || "",
    contactNumber: applicant.entranceTest?.contactNumber || "",
    status: applicant.entranceTest?.status || "NOT_SCHEDULED",
    remarks: applicant.entranceTest?.remarks || "",
    marksObtained: applicant.entranceTest?.marksObtained || "",
    graceMarks: applicant.entranceTest?.graceMarks || "",
    totalMarks: "100", // Fixed Total Marks
    reportLink: applicant.entranceTest?.reportLink || ""
  });

  const studentName = applicant.inquiry?.studentName || "Unknown Applicant";
  
  // LIVE STATUS PREVIEW
  const marks = parseFloat(testData.marksObtained?.toString() || "0");
  const grace = parseFloat(testData.graceMarks?.toString() || "0");
  const totalGained = marks + grace;
  const calculatedStatus = totalGained >= 33 ? "PASS" : "FAIL";
  const currentStatus = testData.status;

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!testData.testDate || !testData.testTime || !testData.location || !testData.teacherName) {
      alert("Please fill all mandatory fields: Date, Time, Location, and Teacher.");
      return;
    }

    setLoading(true);
    // Don't pass status - let the action set it to PENDING
    const { status, ...dataWithoutStatus } = testData;
    const res = await scheduleEntranceTest(applicant.id, dataWithoutStatus);
    setLoading(false);
    if (res.success) {
      alert("Test Scheduled Successfully!");
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleSubmitResult = async () => {
    if (testData.marksObtained === "") {
      alert("Please fill Marks Obtained before submitting.");
      return;
    }
    
    const confirmMsg = `Submit result for ${studentName}?\nTotal Gained: ${totalGained} (Marks: ${marks}, Grace: ${grace})\nStatus: ${calculatedStatus}`;
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    const res = await updateTestResult(
      applicant.id, 
      testData.remarks,
      testData.marksObtained,
      testData.graceMarks,
      testData.reportLink
    );
    setLoading(false);
    
    if (res.success) {
      setTestData({ ...testData, status: calculatedStatus });
      alert(`Result Submitted: ${calculatedStatus}`);
    } else {
      alert("Error updating result: " + res.error);
    }
  };


  const handleFinalizeAdmission = async () => {
    if (!confirm(`Are you sure you want to officially ADMIT ${studentName}?`)) return;
    setLoading(true);
    const res = await finalizeFinalAdmission(applicant.id);
    setLoading(false);
    if (res.success) {
      alert("Student Admitted Successfully!");
      window.location.reload();
    } else {
      alert("Error finalizing admission: " + ("error" in res ? res.error : "Unknown Error"));
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
                      {testData.testDate ? `${formatDate(testData.testDate)} | ${formatTime(testData.testTime)}` : "NOT SCHEDULED"}
                    </p>
                    <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ml-auto",
                        currentStatus === "PASS" ? "bg-emerald-100 text-emerald-700" :
                        currentStatus === "FAIL" ? "bg-red-100 text-red-700" :
                        currentStatus === "PENDING" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                    )}>
                        {currentStatus}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
            {isOpen ? <ChevronUp className="text-slate-300" /> : <ChevronDown className="text-slate-300" />}
        </div>
      </div>

      {isOpen && (
        <div className="px-6 pb-6 md:px-8 md:pb-8 animate-in slide-in-from-top-2 duration-300">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
              <form onSubmit={handleSaveSchedule} className="space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> Schedule Details
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                        <input 
                            type="date"
                            value={testData.testDate || ""}
                            onChange={(e) => setTestData({ ...testData, testDate: e.target.value })}
                            className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Time</label>
                        <input 
                            type="time"
                            value={testData.testTime || ""}
                            onChange={(e) => setTestData({ ...testData, testTime: e.target.value })}
                            className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Location</label>
                        <input 
                            placeholder="e.g. Room 104, Second Floor"
                            value={testData.location || ""}
                            onChange={(e) => setTestData({ ...testData, location: e.target.value })}
                            className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teacher</label>
                        <select 
                            value={testData.teacherName || ""}
                            onChange={(e) => {
                                const selectedName = e.target.value;
                                const teacher = teachers.find(t => t.name === selectedName);
                                setTestData({ 
                                    ...testData, 
                                    teacherName: selectedName,
                                    contactNumber: teacher?.contactNumber || testData.contactNumber
                                });
                            }}
                            className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                        >
                            <option value="">Select Teacher</option>
                            {teachers.map((t: any) => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact</label>
                        <input 
                            placeholder="Phone Number"
                            value={testData.contactNumber || ""}
                            onChange={(e) => setTestData({ ...testData, contactNumber: e.target.value })}
                            className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>
                 </div>

                 <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-50"
                 >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Update Schedule"}
                 </button>
              </form>

              <div className="space-y-6 lg:border-l lg:pl-8 border-slate-50">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle size={12} /> Result Management
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Marks Obtained</label>
                         <input 
                             placeholder="e.g. 45"
                             type="number"
                             step="0.01"
                             value={testData.marksObtained || ""}
                             onChange={(e) => setTestData({ ...testData, marksObtained: e.target.value })}
                             className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                         />
                     </div>
                     <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grace Marks</label>
                         <input 
                             placeholder="e.g. 3"
                             type="number"
                             step="0.01"
                             value={testData.graceMarks || ""}
                             onChange={(e) => setTestData({ ...testData, graceMarks: e.target.value })}
                             className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                         />
                     </div>
                     <div className="col-span-2 space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-outfit">Total Marks (Fixed at 100)</label>
                         <input 
                             type="number"
                             value="100"
                             disabled
                             className="w-full bg-slate-100 border-slate-100 text-slate-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed font-black"
                         />
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Report Link (Optional)</label>
                     <input 
                         placeholder="Drive Link"
                         value={testData.reportLink || ""}
                         onChange={(e) => setTestData({ ...testData, reportLink: e.target.value })}
                         className="w-full bg-slate-50 border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                     />
                  </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Remarks / Feedback</label>
                    <textarea 
                        value={testData.remarks || ""}
                        onChange={(e) => setTestData({ ...testData, remarks: e.target.value })}
                        placeholder="Enter test observation or feedback..."
                        className="w-full bg-slate-50 border-slate-100 rounded-2xl px-4 py-3 text-sm h-32 resize-none focus:ring-2 focus:ring-blue-500 transition-all font-medium italic"
                    />
                 </div>

                  {testData.marksObtained !== "" && (
                    <div className={cn(
                        "p-4 rounded-2xl flex items-center justify-between border animate-in fade-in zoom-in-95 duration-500",
                        calculatedStatus === "PASS" ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                    )}>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Calculated Result</p>
                            <p className={cn("text-lg font-black italic uppercase italic tracking-tighter", calculatedStatus === "PASS" ? "text-emerald-700" : "text-red-700")}>
                                {calculatedStatus} ({totalGained}/100)
                            </p>
                        </div>
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                            calculatedStatus === "PASS" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-red-500 shadow-red-500/20"
                        )}>
                            {calculatedStatus === "PASS" ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={handleSubmitResult}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle size={20} /> SUBMIT RESULT</>}
                    </button>
                 </div>

                  {/* Finalize Admission Button Removed */}


                 {applicant.studentProfile?.isFullyAdmitted && (
                    <div className="pt-4 text-center">
                        <span className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black uppercase tracking-widest text-[10px]">
                           <CheckCircle size={14} /> ADMISSION COMPLETED
                        </span>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
