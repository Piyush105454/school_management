"use client";

import React, { useState } from "react";
import { ScrollText, Calendar, Clock, BookOpen, ChevronRight, AlertTriangle } from "lucide-react";

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
  WEEKLY_TEST: "bg-blue-100 text-blue-700",
  MONTHLY_TEST: "bg-cyan-100 text-cyan-700",
  UNIT_TEST: "bg-violet-100 text-violet-700",
  QUARTERLY: "bg-amber-100 text-amber-700",
  HALF_YEARLY: "bg-orange-100 text-orange-700",
  ANNUAL: "bg-red-100 text-red-700",
  PRACTICE_TEST: "bg-slate-100 text-slate-600",
};

const BIG_EXAMS = ["QUARTERLY", "HALF_YEARLY", "ANNUAL"];

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

  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const renderExamCard = (exam: any, highlight = false) => {
    const dateObj = new Date(exam.examDate + "T00:00:00");
    const days = daysUntil(exam.examDate);
    const isBig = BIG_EXAMS.includes(exam.examType);

    return (
      <div key={exam.id}
        className={`rounded-2xl border p-5 transition-all hover:shadow-md ${
          highlight ? "border-amber-400 bg-amber-50/30 ring-2 ring-amber-100" :
          isBig ? "border-red-200 bg-red-50/20" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black mb-2 ${TYPE_COLORS[exam.examType] || "bg-slate-100 text-slate-600"}`}>
              {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
            </span>
            <div className="font-black text-slate-900 text-sm leading-tight">{exam.title}</div>
            {exam.subjectName && (
              <div className="text-xs text-slate-500 mt-0.5 font-semibold flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> {exam.subjectName}
              </div>
            )}
          </div>
          {days > 0 && days <= 7 && (
            <div className={`text-center rounded-xl px-2.5 py-1.5 flex-shrink-0 ${days <= 2 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
              <div className="text-lg font-black leading-none">{days}</div>
              <div className="text-[8px] font-black uppercase">days</div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-800">
                {dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div className="text-[9px] text-slate-400">{dateObj.toLocaleDateString("en-IN", { weekday: "long" })}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-800">{exam.startTime} – {exam.endTime}</div>
              {exam.timetablePeriod && <div className="text-[9px] text-slate-400">{exam.timetablePeriod}</div>}
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-3 text-xs">
          <div className="bg-slate-100 rounded-lg px-3 py-1.5 font-bold text-slate-700">
            Max Marks: <span className="text-slate-900">{exam.maxMarks}</span>
          </div>
          <div className="bg-slate-100 rounded-lg px-3 py-1.5 font-bold text-slate-700">
            Pass: <span className="text-slate-900">{exam.passingMarks}</span>
          </div>
          {exam.venue && exam.venue !== "Classroom" && (
            <div className="bg-blue-50 rounded-lg px-3 py-1.5 font-bold text-blue-700">
              📍 {exam.venue}
            </div>
          )}
        </div>

        {exam.instructions && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-semibold flex items-start gap-1.5">
            <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
            {exam.instructions}
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
          <ScrollText className="h-7 w-7 text-amber-600" /> My Exam Schedule
        </h1>
        <p className="text-slate-500 text-sm mt-1">View all your upcoming tests and examinations</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "WEEKLY_TEST", "MONTHLY_TEST", "UNIT_TEST", "QUARTERLY", "HALF_YEARLY", "ANNUAL"].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              filterType === t ? "bg-amber-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}>
            {t === "ALL" ? "All Exams" : EXAM_TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>

      {/* TODAY section */}
      {todayExams.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm font-black text-red-700 uppercase tracking-wider">📅 Today's Exams</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayExams.map(e => renderExamCard(e, true))}
          </div>
        </div>
      )}

      {/* Big Exams (Quarterly, Half Yearly, Annual) */}
      {bigExams.length > 0 && filterType === "ALL" && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-red-800 uppercase tracking-wider flex items-center gap-2">
            🏆 Major Examinations
            <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-full">{bigExams.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bigExams.map(e => renderExamCard(e))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.map(e => renderExamCard(e))}
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
