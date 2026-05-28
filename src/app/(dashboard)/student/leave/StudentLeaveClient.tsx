"use client";
 
import React, { useState, useTransition } from "react";
import { applyForLeaveAction } from "@/features/academy/actions/leaveActions";
import { FileText, Calendar, Clock, Image as ImageIcon, CheckCircle, XCircle, AlertCircle, Sparkles, Award } from "lucide-react";
import { useRouter } from "next/navigation";
 
interface StudentLeaveClientProps {
  initialLeaves: any[];
}
 
export default function StudentLeaveClient({ initialLeaves }: StudentLeaveClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
 
  // Form State
  const [type, setType] = useState<"HALF_DAY" | "FULL_DAY">("FULL_DAY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [base64Image, setBase64Image] = useState<string>("");
  const [fileName, setFileName] = useState("");
 
  // Half-Day session variables
  const [halfDaySession, setHalfDaySession] = useState<"MORNING" | "AFTERNOON" | "CUSTOM">("MORNING");
  const [customStartTime, setCustomStartTime] = useState("08:00");
  const [customEndTime, setCustomEndTime] = useState("12:00");
 
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
 
  // 1. Calculate dynamic leave stats for the current calendar year
  const currentYear = new Date().getFullYear();
  const yearlyLeaves = initialLeaves.filter(leave => {
    const leaveYear = new Date(leave.startDate).getFullYear();
    return leaveYear === currentYear;
  });
 
  const approvedLeaves = yearlyLeaves.filter(leave => leave.status === "APPROVED");
  const pendingLeaves = yearlyLeaves.filter(leave => leave.status === "PENDING");
 
  let approvedDays = 0;
  approvedLeaves.forEach(leave => {
    if (leave.type === "HALF_DAY") {
      approvedDays += 0.5;
    } else {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      approvedDays += diffDays;
    }
  });
 
  let pendingDays = 0;
  pendingLeaves.forEach(leave => {
    if (leave.type === "HALF_DAY") {
      pendingDays += 0.5;
    } else {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      pendingDays += diffDays;
    }
  });
 
  const yearlyQuota = 10;
  const remainingLeaves = Math.max(0, yearlyQuota - approvedDays);
 
  // File to base64 helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
 
    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit.");
      return;
    }
 
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64Image(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
 
  const handleClearFile = () => {
    setBase64Image("");
    setFileName("");
  };
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
 
    let sDate = "";
    let eDate = "";
 
    if (type === "FULL_DAY") {
      sDate = startDate;
      eDate = endDate;
 
      if (!sDate || !eDate) {
        setMessage({ type: "error", text: "Please select leave date range." });
        return;
      }
 
      const start = new Date(sDate);
      const end = new Date(eDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
 
      if (start > end) {
        setMessage({ type: "error", text: "Start date cannot be after end date." });
        return;
      }
 
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
 
      if (diffDays > 2) {
        setMessage({ type: "error", text: "Full day leaves cannot be requested for more than 2 days." });
        return;
      }
    } else {
      // Half Day: use local today's date YYYY-MM-DD
      const localDate = new Date();
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
 
      let startTime = "08:00";
      let endTime = "12:00";
 
      if (halfDaySession === "MORNING") {
        startTime = "08:00";
        endTime = "12:00";
      } else if (halfDaySession === "AFTERNOON") {
        startTime = "12:00";
        endTime = "16:00";
      } else {
        startTime = customStartTime;
        endTime = customEndTime;
 
        if (!startTime || !endTime) {
          setMessage({ type: "error", text: "Please specify custom time range." });
          return;
        }
        if (startTime >= endTime) {
          setMessage({ type: "error", text: "Start time must be before end time." });
          return;
        }
      }
 
      sDate = `${todayStr}T${startTime}:00`;
      eDate = `${todayStr}T${endTime}:00`;
    }
 
    if (!reason.trim()) {
      setMessage({ type: "error", text: "Please provide a reason for the leave." });
      return;
    }
 
    // Double check quota limit before sending
    let newDuration = 0.5;
    if (type === "FULL_DAY") {
      const start = new Date(sDate);
      const end = new Date(eDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - start.getTime();
      newDuration = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
 
    if (approvedDays + newDuration > yearlyQuota) {
      setMessage({
        type: "error",
        text: `Leave application exceeds your yearly quota of ${yearlyQuota} days. You have already taken ${approvedDays} approved days.`,
      });
      return;
    }
 
    startTransition(async () => {
      const result = await applyForLeaveAction({
        startDate: sDate,
        endDate: eDate,
        type,
        reason,
        imageUrl: base64Image || undefined,
      });
 
      if (result.success) {
        setMessage({ type: "success", text: "Leave application submitted successfully!" });
        // Reset Form
        setStartDate("");
        setEndDate("");
        setReason("");
        setBase64Image("");
        setFileName("");
        setHalfDaySession("MORNING");
        setCustomStartTime("08:00");
        setCustomEndTime("12:00");
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to submit leave application." });
      }
    });
  };
 
  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Leave Portal</h1>
          <p className="text-slate-500 text-sm">Apply for leave and monitor your annual leave quota.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 py-1.5 px-3 rounded-full text-xs font-black uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Academic Year {currentYear}</span>
        </div>
      </div>
 
      {/* Leave Quota Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Yearly Quota */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[1.75rem] p-5 text-white border border-slate-700/30 shadow-md relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <Award size={140} />
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-300">Annual Quota</span>
            <div className="h-7 w-7 bg-white/10 rounded-xl flex items-center justify-center">
              <Award size={14} className="text-slate-200" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black">{yearlyQuota}</span>
            <span className="text-xs text-slate-400 font-bold">Days</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-2">Maximum allowed per calendar year</p>
        </div>
 
        {/* Card 2: Approved Leaves */}
        <div className="bg-white rounded-[1.75rem] p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-5 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
            <CheckCircle size={140} />
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Approved Leaves</span>
            <div className="h-7 w-7 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle size={14} className="text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900">{approvedDays}</span>
            <span className="text-xs text-slate-500 font-bold">Days</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (approvedDays / yearlyQuota) * 100)}%` }}
            />
          </div>
        </div>
 
        {/* Card 3: Pending Requests */}
        <div className="bg-white rounded-[1.75rem] p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-5 text-amber-600 group-hover:scale-110 transition-transform duration-300">
            <Clock size={140} />
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Pending Requests</span>
            <div className="h-7 w-7 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock size={14} className="text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900">{pendingDays}</span>
            <span className="text-xs text-slate-500 font-bold">Days</span>
          </div>
          <p className="text-[10px] text-amber-600 font-bold mt-2">Awaiting administrator approval</p>
        </div>
 
        {/* Card 4: Remaining Balance */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-[1.75rem] p-5 border border-blue-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-5 text-blue-600 group-hover:scale-110 transition-transform duration-300">
            <Sparkles size={140} />
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-blue-600/80">Remaining Balance</span>
            <div className="h-7 w-7 bg-blue-100/50 rounded-xl flex items-center justify-center">
              <Sparkles size={14} className="text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-blue-700">{remainingLeaves}</span>
            <span className="text-xs text-blue-600 font-bold">Days</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500" 
              style={{ width: `${(remainingLeaves / yearlyQuota) * 100}%` }}
            />
          </div>
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Apply Leave Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Apply for Leave
            </h2>
 
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div
                  className={`p-4 rounded-xl text-xs font-bold flex items-start gap-2 ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message.type === "success" ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}
 
              {/* Leave Type Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Leave Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("FULL_DAY")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      type === "FULL_DAY"
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Full Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("HALF_DAY")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      type === "HALF_DAY"
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Half Day
                  </button>
                </div>
              </div>
 
              {/* Date Pickers (Shown for FULL DAY only) */}
              {type === "FULL_DAY" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-wider">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 py-2 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <AlertCircle size={12} className="text-blue-500" />
                    <span>Maximum leave range is capped at 2 days.</span>
                  </div>
                </div>
              ) : (
                /* Time Selector Panel (Shown for HALF DAY only, completely hides Date picker) */
                <div className="space-y-3 bg-slate-50/50 p-4 border border-slate-200/60 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-600 tracking-wider pb-1 border-b border-slate-200">
                    <Clock size={14} className="text-amber-500" />
                    <span>Absence Time Range</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Select Session</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "MORNING", label: "Morning" },
                        { id: "AFTERNOON", label: "Afternoon" },
                        { id: "CUSTOM", label: "Custom" }
                      ].map((sess) => (
                        <button
                          key={sess.id}
                          type="button"
                          onClick={() => setHalfDaySession(sess.id as any)}
                          className={`py-1.5 px-2 text-[10px] font-black rounded-lg border text-center uppercase tracking-wider transition-all ${
                            halfDaySession === sess.id
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {sess.label}
                        </button>
                      ))}
                    </div>
                  </div>
 
                  {/* Predefined Session Info */}
                  {halfDaySession === "MORNING" && (
                    <div className="text-[10px] bg-white border border-slate-200 rounded-lg p-2.5 text-slate-500 font-bold flex justify-between items-center">
                      <span>Standard Morning Session</span>
                      <span className="font-extrabold text-slate-800">08:00 AM - 12:00 PM</span>
                    </div>
                  )}
                  {halfDaySession === "AFTERNOON" && (
                    <div className="text-[10px] bg-white border border-slate-200 rounded-lg p-2.5 text-slate-500 font-bold flex justify-between items-center">
                      <span>Standard Afternoon Session</span>
                      <span className="font-extrabold text-slate-800">12:00 PM - 04:00 PM</span>
                    </div>
                  )}
 
                  {/* Custom Time Selectors */}
                  {halfDaySession === "CUSTOM" && (
                    <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 rounded-lg p-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wide">Start Time</label>
                        <input
                          type="time"
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                          className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wide">End Time</label>
                        <input
                          type="time"
                          value={customEndTime}
                          onChange={(e) => setCustomEndTime(e.target.value)}
                          className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-amber-50/50 border border-amber-200/50 py-2 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold text-amber-700">
                    <AlertCircle size={12} className="flex-shrink-0" />
                    <span>Automatically schedules for today (current date).</span>
                  </div>
                </div>
              )}
 
              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you are requesting leave..."
                  rows={4}
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                  required
                />
              </div>
 
              {/* Attachment Image Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider block">
                  Application Image <span className="text-slate-400 font-bold lowercase">(optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all">
                    <ImageIcon size={16} />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {fileName && (
                    <div className="flex items-center gap-1.5 bg-slate-100 py-1.5 px-3 rounded-lg max-w-[180px]">
                      <span className="text-[10px] font-bold text-slate-700 truncate">{fileName}</span>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-semibold mt-1">Accepts images up to 2MB.</p>
              </div>
 
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-55"
              >
                {isPending ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>
        </div>
 
        {/* Right Side: Requests List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-5 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" /> Past Leave Requests
            </h2>
 
            {initialLeaves.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-sm">
                No leave requests found. They will appear here once submitted.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-400">
                      <th className="pb-3 pr-2">Date / Duration</th>
                      <th className="pb-3 px-2">Type</th>
                      <th className="pb-3 px-2">Reason</th>
                      <th className="pb-3 px-2">Attachment</th>
                      <th className="pb-3 pl-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                    {initialLeaves.map((leave) => {
                      const start = new Date(leave.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const end = new Date(leave.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      
                      let dateDisplay = start === end ? start : `${start} - ${end}`;
 
                      if (leave.type === "HALF_DAY") {
                        const timeStart = new Date(leave.startDate).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const timeEnd = new Date(leave.endDate).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        dateDisplay = `${start} (${timeStart} - ${timeEnd})`;
                      }
 
                      return (
                        <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pr-2 font-bold text-slate-900">{dateDisplay}</td>
                          <td className="py-3.5 px-2">
                            <span className="inline-flex items-center gap-1">
                              {leave.type === "FULL_DAY" ? (
                                <Calendar size={14} className="text-blue-500" />
                              ) : (
                                <Clock size={14} className="text-amber-500" />
                              )}
                              {leave.type === "FULL_DAY" ? "Full Day" : "Half Day"}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 max-w-[200px] truncate" title={leave.reason}>
                            {leave.reason}
                          </td>
                          <td className="py-3.5 px-2">
                            {leave.imageUrl ? (
                              <a
                                href={leave.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 font-bold hover:underline"
                              >
                                View Image
                              </a>
                            ) : (
                              <span className="text-slate-400 font-normal italic">None</span>
                            )}
                          </td>
                          <td className="py-3.5 pl-2">
                            <span
                              className={`inline-flex py-1 px-2.5 rounded-full text-[9px] uppercase tracking-wider font-black ${
                                leave.status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : leave.status === "REJECTED"
                                  ? "bg-red-50 text-red-700 border border-red-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}
                            >
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
