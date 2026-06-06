"use client";

import React, { useState } from "react";
import { ScrollText, Calendar, Clock, BookOpen } from "lucide-react";

const EXAM_TYPE_LABELS: Record<string, string> = {
  WEEKLY_TEST: "📝 Weekly Test",
  MONTHLY_TEST: "📅 Monthly Test",
  UNIT_TEST: "📖 Unit Test",
  QUARTERLY: "🗓️ Quarterly Exam",
  HALF_YEARLY: "📋 Half Yearly Exam",
  ANNUAL: "🏆 Annual Exam",
  PRACTICE_TEST: "✏️ Practice Test",
};

const TYPE_COLORS: Record<string, string> = {
  WEEKLY_TEST: "bg-slate-100 text-slate-700 border border-slate-200",
  MONTHLY_TEST: "bg-slate-100 text-slate-700 border border-slate-200",
  UNIT_TEST: "bg-slate-100 text-slate-700 border border-slate-200",
  QUARTERLY: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  HALF_YEARLY: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  ANNUAL: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  PRACTICE_TEST: "bg-slate-100 text-slate-700 border border-slate-200",
};

const BIG_EXAMS = ["QUARTERLY", "HALF_YEARLY", "ANNUAL"];

const formatExamDate = (dateStr: string, formatOpts: Intl.DateTimeFormatOptions) => {
  if (!dateStr) return "—";
  try {
    const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const d = new Date(cleanDate + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", formatOpts);
  } catch (e) {
    return dateStr || "—";
  }
};

interface StudentExamClientProps {
  exams: any[];
  studentClassName: string | null;
}

export default function StudentExamClient({ exams, studentClassName }: StudentExamClientProps) {
  const [filterType, setFilterType] = useState("ALL");
  const today = new Date().toISOString().split("T")[0];

  const relevant = exams.filter(e => {
    if (e.status === "CANCELLED") return false;
    if (filterType !== "ALL" && e.examType !== filterType) return false;
    return true;
  });

  const todayExams = relevant.filter(e => e.examDate === today);
  const upcoming = relevant.filter(e => e.examDate > today && e.status === "SCHEDULED");
  const bigExams = upcoming.filter(e => BIG_EXAMS.includes(e.examType));
  const tests = upcoming.filter(e => !BIG_EXAMS.includes(e.examType));

  const renderExamTimetable = (exam: any) => {
    let papers: any[] = [];
    try {
      if (exam.papers) {
        const parsed = JSON.parse(exam.papers);
        if (Array.isArray(parsed)) {
          papers = parsed;
        }
      }
    } catch (e) {
      // fallback
    }

    // If no papers array, wrap the single exam details into a 1-row table array
    if (papers.length === 0) {
      papers = [{
        subjectName: exam.subjectName || exam.title || "Examination",
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        maxMarks: exam.maxMarks,
        syllabusUnits: []
      }];
    }

    return (
      <div key={exam.id} className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-1.5 ${TYPE_COLORS[exam.examType] || "bg-slate-100 text-slate-600"}`}>
              {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
            </span>
            <h3 className="font-black text-slate-900 text-base leading-tight">{exam.title}</h3>
            {exam.description && <p className="text-xs text-slate-400 font-medium mt-0.5">{exam.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {exam.venue && exam.venue !== "Classroom" && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                📍 {exam.venue}
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
              {exam.status}
            </span>
          </div>
        </div>

        {/* Timetable Table */}
        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white max-w-full overflow-x-auto select-text">
          <table className="w-full text-left border-collapse text-xs min-w-[500px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                <th className="p-3 pl-4">Subject</th>
                <th className="p-3">Date</th>
                <th className="p-3">Time</th>
                <th className="p-3 text-center">Max Marks</th>
                <th className="p-3 pr-4">Syllabus / Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {papers.map((p: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-3 pl-4 font-black text-slate-900">{p.subjectName}</td>
                  <td className="p-3 text-slate-600 font-bold">
                    {formatExamDate(p.examDate, { day: "numeric", month: "short", weekday: "short" })}
                  </td>
                  <td className="p-3 text-slate-600 font-semibold">{p.startTime} – {p.endTime}</td>
                  <td className="p-3 text-center text-slate-700 font-bold">{p.maxMarks}</td>
                  <td className="p-3 pr-4">
                    {p.syllabusUnits && p.syllabusUnits.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {p.syllabusUnits.map((unit: string, uIdx: number) => (
                          <span key={uIdx} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[8px] font-bold" title={unit}>
                            {unit.includes(" – Ch ") ? unit.split(" – Ch ")[1] || unit : unit}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">Full Syllabus</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {exam.instructions && (
          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-600 font-semibold flex items-start gap-1.5">
            <span className="text-xs">ℹ️</span>
            <div>
              <span className="font-bold text-slate-700 uppercase text-[9px] tracking-wider block mb-0.5">Instructions</span>
              {exam.instructions}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ScrollText className="h-7 w-7 text-indigo-600" /> My Exam Schedule
        </h1>
        <p className="text-slate-500 text-sm mt-1">View all your upcoming tests and examinations</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "WEEKLY_TEST", "MONTHLY_TEST", "UNIT_TEST", "QUARTERLY", "HALF_YEARLY", "ANNUAL"].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              filterType === t ? "bg-slate-800 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}>
            {t === "ALL" ? "All Exams" : EXAM_TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>

      {/* TODAY section */}
      {todayExams.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-sm font-black text-indigo-800 uppercase tracking-wider">📅 Today's Exams</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {todayExams.map(e => renderExamTimetable(e))}
          </div>
        </div>
      )}

      {/* Big Exams (Quarterly, Half Yearly, Annual) */}
      {bigExams.length > 0 && filterType === "ALL" && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            🏆 Major Examinations
            <span className="bg-slate-200 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded-full">{bigExams.length}</span>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {bigExams.map(e => renderExamTimetable(e))}
          </div>
        </div>
      )}

      {/* Weekly/Monthly Tests */}
      {tests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            📝 Upcoming Tests
            <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">{tests.length}</span>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {tests.map(e => renderExamTimetable(e))}
          </div>
        </div>
      )}

      {relevant.length === 0 && todayExams.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <ScrollText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="font-bold text-slate-400">No upcoming exams</p>
          <p className="text-xs text-slate-300 mt-1">You're all clear! Check back later.</p>
        </div>
      )}
    </div>
  );
}
