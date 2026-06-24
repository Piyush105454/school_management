"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { assignTeacherToSubject, assignReviewerToSubject, getTeachers } from "@/features/academy/actions/assignTeacherActions";
import { Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Teacher {
  id: string;
  name: string;
  specialization?: string | null;
}

interface Subject {
  id: number;
  name: string;
  assignedTeacherId?: string | null;
  reviewerId1?: string | null;
  reviewerId2?: string | null;
}

interface AssignTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  role?: "teacher" | "reviewer1" | "reviewer2";
}

export default function AssignTeacherModal({ isOpen, onClose, subject, role = "teacher" }: AssignTeacherModalProps) {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTeachers();
      if (role === "reviewer1") {
        setSelectedTeacherId(subject?.reviewerId1 || "");
      } else if (role === "reviewer2") {
        setSelectedTeacherId(subject?.reviewerId2 || "");
      } else {
        setSelectedTeacherId(subject?.assignedTeacherId || "");
      }
      setIsOpenDropdown(false);
    }
  }, [isOpen, subject, role]);

  const loadTeachers = async () => {
    setIsLoading(true);
    const result = await getTeachers();
    setIsLoading(false);
    
    if (result.success) {
      setTeachers(result.data || []);
    } else {
      setError(result.error || "Failed to load teachers");
    }
  };

  const handleAssign = async () => {
    if (!subject) return;

    setIsLoading(true);
    setError(null);

    let result;
    if (role === "reviewer1") {
      result = await assignReviewerToSubject(subject.id, selectedTeacherId || null, 1);
    } else if (role === "reviewer2") {
      result = await assignReviewerToSubject(subject.id, selectedTeacherId || null, 2);
    } else {
      result = await assignTeacherToSubject(subject.id, selectedTeacherId || null);
    }

    setIsLoading(false);

    if (result.success) {
      onClose();
      router.refresh();
    } else {
      setError(result.error || "Failed to assign");
    }
  };

  if (!subject) return null;

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) {
          onClose();
          setError(null);
        }
      }}
      title={
        role === "reviewer1"
          ? `Assign Reviewer 1 - ${subject.name}`
          : role === "reviewer2"
          ? `Assign Reviewer 2 - ${subject.name}`
          : `Assign Teacher - ${subject.name}`
      }
    >
      <div className="space-y-5 p-1">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
            Select Teacher
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => !isLoading && setIsOpenDropdown(!isOpenDropdown)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 text-left flex items-center justify-between disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <span className="truncate">
                {selectedTeacherId && selectedTeacher
                  ? `${selectedTeacher.name}${selectedTeacher.specialization ? ` (${selectedTeacher.specialization})` : ""}`
                  : "-- Not Assigned --"}
              </span>
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpenDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpenDropdown && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 py-1">
                <button
                  type="button"
                  className="w-full text-left px-5 py-3 hover:bg-slate-50 cursor-pointer text-slate-900 font-medium transition-colors text-sm"
                  onClick={() => {
                    setSelectedTeacherId("");
                    setIsOpenDropdown(false);
                  }}
                >
                  -- Not Assigned --
                </button>
                {teachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    type="button"
                    className="w-full text-left px-5 py-3 hover:bg-slate-50 cursor-pointer text-slate-900 font-medium transition-colors text-sm truncate"
                    onClick={() => {
                      setSelectedTeacherId(teacher.id);
                      setIsOpenDropdown(false);
                    }}
                  >
                    {teacher.name} {teacher.specialization ? `(${teacher.specialization})` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={() => onClose()}
            className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-wider"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={isLoading}
            className="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? "Assigning..." : role === "reviewer1" || role === "reviewer2" ? "Assign Reviewer" : "Assign Teacher"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
