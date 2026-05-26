"use client";

import React, { useState, useTransition } from "react";
import { updateLeaveStatusAction, getAllStudentLeavesForManagementAction } from "@/features/academy/actions/leaveActions";
import { Calendar, Clock, Check, X, Filter, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface LeaveManagementClientProps {
  classes: any[];
  initialLeaves: any[];
}

export default function LeaveManagementClient({ classes, initialLeaves }: LeaveManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [leaves, setLeaves] = useState<any[]>(initialLeaves);

  // Quick helper to refetch/refresh client-side filtered leaves
  const handleClassFilterChange = async (classId: string) => {
    setSelectedClassId(classId);

    const filterObj = classId === "ALL" ? {} : { classId: parseInt(classId) };
    const res = await getAllStudentLeavesForManagementAction(filterObj);
    if (res.success) {
      setLeaves(res.leaves || []);
    }
  };

  const handleStatusUpdate = (leaveId: number, status: "APPROVED" | "REJECTED") => {
    startTransition(async () => {
      const res = await updateLeaveStatusAction(leaveId, status);
      if (res.success) {
        // Optimistic / clean local updates
        setLeaves((prev) =>
          prev.map((leave) => (leave.id === leaveId ? { ...leave, status } : leave))
        );
        router.refresh();
      } else {
        alert(res.error || "Failed to update leave status.");
      }
    });
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Leave Requests</h1>
          <p className="text-slate-500 text-sm">Review, filter, and approve or reject student leave requests.</p>
        </div>

        {/* Simple Class Filter Dropdown */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 py-1.5 px-3 rounded-xl shadow-sm self-start">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Filter:</span>
          <select
            value={selectedClassId}
            onChange={(e) => handleClassFilterChange(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none focus:ring-0 cursor-pointer"
          >
            <option value="ALL">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simple List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {leaves.length === 0 ? (
          <div className="py-12 text-center text-slate-400 italic text-sm">
            No student leave requests found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-black text-slate-400">
                  <th className="pb-3 pr-2">Student</th>
                  <th className="pb-3 px-2">Class</th>
                  <th className="pb-3 px-2">Dates</th>
                  <th className="pb-3 px-2">Type</th>
                  <th className="pb-3 px-2">Reason</th>
                  <th className="pb-3 px-2">Attachment</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                {leaves.map((leave) => {
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
                      {/* Student Info */}
                      <td className="py-4 pr-2">
                        <div className="font-bold text-slate-900">{leave.student?.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          Roll: {leave.student?.rollNumber || "N/A"}
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-4 px-2 font-semibold text-slate-600">
                        {leave.class?.name || "N/A"}
                      </td>

                      {/* Date Display */}
                      <td className="py-4 px-2 font-semibold text-slate-800">{dateDisplay}</td>

                      {/* Leave Type */}
                      <td className="py-4 px-2">
                        <span className="inline-flex items-center gap-1">
                          {leave.type === "FULL_DAY" ? (
                            <Calendar size={14} className="text-blue-500" />
                          ) : (
                            <Clock size={14} className="text-amber-500" />
                          )}
                          {leave.type === "FULL_DAY" ? "Full Day" : "Half Day"}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-2 max-w-[200px] truncate" title={leave.reason}>
                        {leave.reason}
                      </td>

                      {/* Attachment URL */}
                      <td className="py-4 px-2">
                        {leave.imageUrl ? (
                          <a
                            href={leave.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                          >
                            <ImageIcon size={14} />
                            <span>View File</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 font-normal italic">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-2">
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

                      {/* Inline Actions */}
                      <td className="py-4 pl-2 text-right">
                        {leave.status === "PENDING" ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(leave.id, "APPROVED")}
                              disabled={isPending}
                              title="Approve"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(leave.id, "REJECTED")}
                              disabled={isPending}
                              title="Reject"
                              className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Decided
                          </span>
                        )}
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
  );
}
