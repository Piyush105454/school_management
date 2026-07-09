"use client";
import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface ClassItem {
  id: number;
  name: string;
  grade: number;
  institute: string | null;
}

interface AttendanceRecord {
  classId: number | null;
  status: string | null;
}

interface AttendanceGridCardProps {
  classesList: ClassItem[];
  attendanceRecords: AttendanceRecord[];
  schoolName?: string;
  dateStr?: string;
}

export default function AttendanceGridCard({
  classesList,
  attendanceRecords,
  schoolName = "Dhanpuri Public School",
  dateStr
}: AttendanceGridCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (newDate) {
      params.set("date", newDate);
    } else {
      params.delete("date");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Determine current date value for the input
  const currentDateValue = dateStr || new Date().toISOString().split('T')[0];

  // Map each classId to its attendance counts
  const classAttendanceMap: Record<number, { p: number; l: number; a: number; ml: number; na: number; hd: number; h: number; isSaved: boolean; isHoliday: boolean }> = {};

  classesList.forEach(c => {
    classAttendanceMap[c.id] = { p: 0, l: 0, a: 0, ml: 0, na: 0, hd: 0, h: 0, isSaved: false, isHoliday: false };
  });

  // Filter attendance records to count statuses
  attendanceRecords.forEach(record => {
    if (record.classId && classAttendanceMap[record.classId]) {
      const stats = classAttendanceMap[record.classId];
      stats.isSaved = true;

      const status = record.status;
      if (status === 'P') stats.p += 1;
      else if (status === 'L') stats.l += 1;
      else if (status === 'A') stats.a += 1;
      else if (status === 'ML') stats.ml += 1;
      else if (status === 'NA') stats.na += 1;
      else if (status === 'HD') stats.hd += 1;
      else if (status === 'H') stats.h += 1;
    }
  });

  // Also determine if the class was marked as full holiday (all records are 'H')
  classesList.forEach(c => {
    const stats = classAttendanceMap[c.id];
    if (stats.isSaved) {
      const classRecords = attendanceRecords.filter(r => r.classId === c.id);
      if (classRecords.length > 0 && classRecords.every(r => r.status === 'H')) {
        stats.isHoliday = true;
      }
    }
  });

  // Group classes by grade
  const primaryClasses = classesList.filter(c => c.grade >= 1);
  const prePrimaryClasses = classesList.filter(c => c.grade < 1);

  // Initialize total counters
  let totalPresent = 0;
  let totalLeave = 0;
  let totalAbsent = 0;
  let totalML = 0;
  let totalNA = 0;
  let totalHD = 0;
  let totalH = 0;
  let hasSavedAttendance = false;

  let primaryPresent = 0;
  let primaryLeave = 0;
  let primaryAbsent = 0;
  let primaryML = 0;
  let primaryNA = 0;
  let primaryHD = 0;
  let primaryH = 0;
  let primarySavedCount = 0;

  let prePrimaryPresent = 0;
  let prePrimaryLeave = 0;
  let prePrimaryAbsent = 0;
  let prePrimaryML = 0;
  let prePrimaryNA = 0;
  let prePrimaryHD = 0;
  let prePrimaryH = 0;
  let prePrimarySavedCount = 0;

  // Aggregate Primary
  primaryClasses.forEach(c => {
    const att = classAttendanceMap[c.id];
    if (att.isSaved && !att.isHoliday) {
      primaryPresent += att.p;
      primaryLeave += att.l;
      primaryAbsent += att.a;
      primaryML += att.ml;
      primaryNA += att.na;
      primaryHD += att.hd;
      primaryH += att.h;
      primarySavedCount++;
      hasSavedAttendance = true;
    }
  });

  // Aggregate Pre-Primary
  prePrimaryClasses.forEach(c => {
    const att = classAttendanceMap[c.id];
    if (att.isSaved && !att.isHoliday) {
      prePrimaryPresent += att.p;
      prePrimaryLeave += att.l;
      prePrimaryAbsent += att.a;
      prePrimaryML += att.ml;
      prePrimaryNA += att.na;
      prePrimaryHD += att.hd;
      prePrimaryH += att.h;
      prePrimarySavedCount++;
      hasSavedAttendance = true;
    }
  });

  totalPresent = primaryPresent + prePrimaryPresent;
  totalLeave = primaryLeave + prePrimaryLeave;
  totalAbsent = primaryAbsent + prePrimaryAbsent;
  totalML = primaryML + prePrimaryML;
  totalNA = primaryNA + prePrimaryNA;
  totalHD = primaryHD + prePrimaryHD;
  totalH = primaryH + prePrimaryH;

  // Calculate overall percentage (including ML and HD as present for calculation parity if needed, or based on previous logic)
  const totalActive = (totalPresent + totalML + totalHD) + totalLeave + totalAbsent;
  const percentage = totalActive > 0 ? ((totalPresent + totalML + totalHD) / totalActive) * 100 : 0;

  const displayClass = (name: string) => {
    if (name.startsWith("Class") || name.startsWith("KG")) {
      return name.startsWith("KG") ? `Class ${name}` : name;
    }
    return `Class ${name}`;
  };

  return (
    <div className="w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm select-none overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs font-medium text-slate-700">
          <thead>
            {/* Header row 1: Attendance - Dhanpuri Public School */}
            <tr>
              <th colSpan={8} className="bg-slate-100 py-2.5 text-center text-sm font-black text-slate-800 border-b border-slate-200 uppercase tracking-tight">
                Attendance - {schoolName}
              </th>
            </tr>
            {/* Header row 2: Date | Total P | % */}
            <tr className="h-12 border-b border-slate-200">
              <th colSpan={4} className="bg-white py-2 px-4 text-base font-black text-center text-slate-800 border-r border-slate-200">
                <input 
                  type="date" 
                  value={currentDateValue}
                  onChange={handleDateChange}
                  className="bg-transparent border-none outline-none focus:ring-0 text-center font-black text-slate-800 w-[140px] md:w-[160px] cursor-pointer hover:text-indigo-600 transition-colors"
                />
              </th>
              <th colSpan={2} className="bg-emerald-50/50 py-2 text-base font-black text-center text-emerald-700 border-r border-slate-200">
                {hasSavedAttendance ? (totalPresent + totalML + totalHD) : ""}
              </th>
              <th colSpan={2} className="bg-indigo-50/50 py-2 text-base font-black text-center text-indigo-700">
                {hasSavedAttendance ? `${percentage.toFixed(1)}%` : ""}
              </th>
            </tr>
            {/* Header row 3: All Total Row */}
            <tr className="font-bold text-center bg-slate-50 border-b border-slate-200 text-slate-800">
              <td className="py-2 px-3 bg-slate-100 border-r border-slate-200 uppercase tracking-wider text-[11px] text-slate-600">All Total</td>
              <td className="py-2 bg-emerald-50 text-emerald-700 border-r border-slate-200">{hasSavedAttendance ? totalPresent : ""}</td>
              <td className="py-2 bg-rose-50 text-rose-700 border-r border-slate-200">{hasSavedAttendance ? totalLeave : ""}</td>
              <td className="py-2 bg-red-50 text-red-700 border-r border-slate-200">{hasSavedAttendance ? totalAbsent : ""}</td>
              <td className="py-2 bg-blue-50 text-blue-700 border-r border-slate-200">{hasSavedAttendance ? totalML : ""}</td>
              <td className="py-2 bg-slate-100 text-slate-500 border-r border-slate-200">{hasSavedAttendance ? totalNA : ""}</td>
              <td className="py-2 bg-amber-50 text-amber-700 border-r border-slate-200">{hasSavedAttendance ? totalHD : ""}</td>
              <td className="py-2 bg-slate-200 text-slate-700">{hasSavedAttendance ? totalH : ""}</td>
            </tr>
            {/* Header row 4: Column Titles */}
            <tr className="font-bold text-center bg-white border-b border-slate-200">
              <td className="w-[120px] md:w-[140px] py-2 px-3 border-r border-slate-200 text-left text-slate-500 uppercase text-[10px] tracking-widest">Class</td>
              <td className="w-[10%] py-2 border-r border-slate-200 text-slate-500 uppercase text-[10px] tracking-widest">P</td>
              <td className="w-[10%] py-2 border-r border-slate-200 text-slate-500 uppercase text-[10px] tracking-widest">L</td>
              <td className="w-[10%] py-2 border-r border-slate-200 text-slate-500 uppercase text-[10px] tracking-widest">A</td>
              <td className="w-[10%] py-2 border-r border-slate-200 text-slate-500 uppercase text-[10px] tracking-widest">ML</td>
              <td className="w-[10%] py-2 border-r border-slate-200 text-slate-500 uppercase text-[10px] tracking-widest">NA</td>
              <td className="w-[10%] py-2 border-r border-slate-200 text-slate-500 uppercase text-[10px] tracking-widest">HD</td>
              <td className="w-[10%] py-2 text-slate-500 uppercase text-[10px] tracking-widest">H</td>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Primary Section */}
            {primaryClasses.map(c => {
              const att = classAttendanceMap[c.id];
              return (
                <tr key={c.id} className="text-center hover:bg-slate-50/80 transition-colors">
                  <td className="text-left py-1.5 px-3 font-bold text-slate-700 border-r border-slate-100">
                    {displayClass(c.name)}
                  </td>
                  <td className="py-1.5 border-r border-slate-100 text-emerald-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.p) : ""}</td>
                  <td className="py-1.5 border-r border-slate-100 text-rose-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.l) : ""}</td>
                  <td className="py-1.5 border-r border-slate-100 text-red-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.a) : ""}</td>
                  <td className="py-1.5 border-r border-slate-100 text-blue-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.ml) : ""}</td>
                  <td className="py-1.5 border-r border-slate-100 text-slate-500 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.na) : ""}</td>
                  <td className="py-1.5 border-r border-slate-100 text-amber-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.hd) : ""}</td>
                  <td className="py-1.5 text-slate-700 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.h) : ""}</td>
                </tr>
              );
            })}
            {/* Primary Total Row */}
            <tr className="font-bold text-center bg-slate-50/80 border-y border-slate-200">
              <td className="text-left py-2 px-3 border-r border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider">Primary Total</td>
              <td className="py-2 border-r border-slate-200 text-emerald-700">{primarySavedCount > 0 ? primaryPresent : ""}</td>
              <td className="py-2 border-r border-slate-200 text-rose-700">{primarySavedCount > 0 ? primaryLeave : ""}</td>
              <td className="py-2 border-r border-slate-200 text-red-700">{primarySavedCount > 0 ? primaryAbsent : ""}</td>
              <td className="py-2 border-r border-slate-200 text-blue-700">{primarySavedCount > 0 ? primaryML : ""}</td>
              <td className="py-2 border-r border-slate-200 text-slate-600">{primarySavedCount > 0 ? primaryNA : ""}</td>
              <td className="py-2 border-r border-slate-200 text-amber-700">{primarySavedCount > 0 ? primaryHD : ""}</td>
              <td className="py-2 text-slate-800">{primarySavedCount > 0 ? primaryH : ""}</td>
            </tr>

            {/* Empty spacer row */}
            <tr className="h-2 bg-slate-100/50">
              <td colSpan={8}></td>
            </tr>

            {/* Pre-Primary Section */}
            {prePrimaryClasses.map(c => {
              const att = classAttendanceMap[c.id];
              return (
                <tr key={c.id} className="text-center hover:bg-slate-50/80 transition-colors border-y border-slate-100">
                  <td className="text-left py-1.5 px-3 font-bold text-slate-700 border-r border-slate-100">
                    {displayClass(c.name)}
                  </td>
                  <td className="py-1.5 border-r border-slate-100 text-emerald-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.p) : ""}</td>
                  <td className="py-1.5 border-r border-slate-100 text-rose-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.l) : ""}</td>
                  <td className="py-1.5 border-r border-slate-100 text-red-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.a) : ""}</td>
                  <td className="py-1.5 border-r border-slate-100 text-blue-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.ml) : ""}</td>
                  <td className="py-1.5 border-r border-slate-100 text-slate-500 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.na) : ""}</td>
                  <td className="py-1.5 border-r border-slate-100 text-amber-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.hd) : ""}</td>
                  <td className="py-1.5 text-slate-700 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.h) : ""}</td>
                </tr>
              );
            })}
            {/* Pre-Primary Total Row */}
            <tr className="font-bold text-center bg-slate-50/80 border-y border-slate-200">
              <td className="text-left py-2 px-3 border-r border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider">Pre-Primary Total</td>
              <td className="py-2 border-r border-slate-200 text-emerald-700">{prePrimarySavedCount > 0 ? prePrimaryPresent : ""}</td>
              <td className="py-2 border-r border-slate-200 text-rose-700">{prePrimarySavedCount > 0 ? prePrimaryLeave : ""}</td>
              <td className="py-2 border-r border-slate-200 text-red-700">{prePrimarySavedCount > 0 ? prePrimaryAbsent : ""}</td>
              <td className="py-2 border-r border-slate-200 text-blue-700">{prePrimarySavedCount > 0 ? prePrimaryML : ""}</td>
              <td className="py-2 border-r border-slate-200 text-slate-600">{prePrimarySavedCount > 0 ? prePrimaryNA : ""}</td>
              <td className="py-2 border-r border-slate-200 text-amber-700">{prePrimarySavedCount > 0 ? prePrimaryHD : ""}</td>
              <td className="py-2 text-slate-800">{prePrimarySavedCount > 0 ? prePrimaryH : ""}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
