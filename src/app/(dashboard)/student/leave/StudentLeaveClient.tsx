"use client";

import React, { useState, useTransition } from "react";
import { applyForLeaveAction } from "@/features/academy/actions/leaveActions";
import { FileText, Calendar, Clock, Image as ImageIcon, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
  const [singleDate, setSingleDate] = useState("");
  const [reason, setReason] = useState("");
  const [base64Image, setBase64Image] = useState<string>("");
  const [fileName, setFileName] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

    const sDate = type === "FULL_DAY" ? startDate : singleDate;
    const eDate = type === "FULL_DAY" ? endDate : singleDate;

    if (!sDate || !eDate) {
      setMessage({ type: "error", text: "Please select leave date(s)." });
      return;
    }

    if (type === "FULL_DAY" && new Date(sDate) > new Date(eDate)) {
      setMessage({ type: "error", text: "Start date cannot be after end date." });
      return;
    }

    if (!reason.trim()) {
      setMessage({ type: "error", text: "Please provide a reason for the leave." });
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
        setSingleDate("");
        setReason("");
        setBase64Image("");
        setFileName("");
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to submit leave application." });
      }
    });
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Leave Portal</h1>
        <p className="text-slate-500 text-sm">Apply for leave and monitor your previous applications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Standard Form */}
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
                  {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Leave Type */}
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

              {/* Date Pickers */}
              {type === "FULL_DAY" ? (
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
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Leave Date</label>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
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

        {/* Right Side: Simple List/Table */}
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
                      const dateDisplay = start === end ? start : `${start} - ${end}`;

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
