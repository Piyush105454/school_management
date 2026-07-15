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

  const currentDateValue = dateStr || new Date().toISOString().split('T')[0];

  const classAttendanceMap: Record<number, { p: number; l: number; a: number; ml: number; na: number; hd: number; h: number; isSaved: boolean; isHoliday: boolean }> = {};
  classesList.forEach(c => {
    classAttendanceMap[c.id] = { p: 0, l: 0, a: 0, ml: 0, na: 0, hd: 0, h: 0, isSaved: false, isHoliday: false };
  });

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

  classesList.forEach(c => {
    const stats = classAttendanceMap[c.id];
    if (stats.isSaved) {
      const classRecords = attendanceRecords.filter(r => r.classId === c.id);
      if (classRecords.length > 0 && classRecords.every(r => r.status === 'H')) {
        stats.isHoliday = true;
      }
    }
  });

  // Calculate Grand Totals
  let grandP = 0, grandL = 0, grandA = 0, grandML = 0, grandNA = 0, grandHD = 0, grandH = 0;
  let hasSavedAttendance = false;
  classesList.forEach(c => {
    const att = classAttendanceMap[c.id];
    if (att.isSaved && !att.isHoliday) {
      grandP += att.p; grandL += att.l; grandA += att.a; grandML += att.ml; grandNA += att.na; grandHD += att.hd; grandH += att.h;
      hasSavedAttendance = true;
    }
  });
  const grandActive = (grandP + grandML + grandHD) + grandL + grandA;
  const grandPercentage = grandActive > 0 ? ((grandP + grandML + grandHD) / grandActive) * 100 : 0;

  const displayClass = (name: string) => {
    if (name.startsWith("Class") || name.startsWith("KG") || name.startsWith("WESa")) {
      return name.startsWith("KG") ? `Class ${name}` : name;
    }
    return `Class ${name}`;
  };

  const renderClassRow = (c: ClassItem) => {
    const att = classAttendanceMap[c.id];
    return (
      <tr key={c.id} className="text-center hover:bg-slate-50/80 transition-colors border-y border-slate-100">
        <td className="text-left py-1.5 px-3 font-bold text-slate-700 border-r border-slate-100">{displayClass(c.name)}</td>
        <td className="py-1.5 border-r border-slate-100 text-emerald-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.p) : ""}</td>
        <td className="py-1.5 border-r border-slate-100 text-rose-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.l) : ""}</td>
        <td className="py-1.5 border-r border-slate-100 text-red-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.a) : ""}</td>
        <td className="py-1.5 border-r border-slate-100 text-blue-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.ml) : ""}</td>
        <td className="py-1.5 border-r border-slate-100 text-slate-500 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.na) : ""}</td>
        <td className="py-1.5 border-r border-slate-100 text-amber-600 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.hd) : ""}</td>
        <td className="py-1.5 text-slate-700 font-semibold">{att.isSaved ? (att.isHoliday ? "H" : att.h) : ""}</td>
      </tr>
    );
  };

  const renderTotalRow = (title: string, classes: ClassItem[]) => {
    let p=0, l=0, a=0, ml=0, na=0, hd=0, h=0, savedCount=0;
    classes.forEach(c => {
      const att = classAttendanceMap[c.id];
      if (att.isSaved && !att.isHoliday) { p += att.p; l += att.l; a += att.a; ml += att.ml; na += att.na; hd += att.hd; h += att.h; savedCount++; }
    });
    return (
      <tr className="font-bold text-center bg-slate-50/80 border-y border-slate-200">
        <td className="text-left py-2 px-3 border-r border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider">{title}</td>
        <td className="py-2 border-r border-slate-200 text-emerald-700">{savedCount > 0 ? p : ""}</td>
        <td className="py-2 border-r border-slate-200 text-rose-700">{savedCount > 0 ? l : ""}</td>
        <td className="py-2 border-r border-slate-200 text-red-700">{savedCount > 0 ? a : ""}</td>
        <td className="py-2 border-r border-slate-200 text-blue-700">{savedCount > 0 ? ml : ""}</td>
        <td className="py-2 border-r border-slate-200 text-slate-600">{savedCount > 0 ? na : ""}</td>
        <td className="py-2 border-r border-slate-200 text-amber-700">{savedCount > 0 ? hd : ""}</td>
        <td className="py-2 text-slate-800">{savedCount > 0 ? h : ""}</td>
      </tr>
    );
  };

  const renderInstituteSection = (instName: string, instClasses: ClassItem[]) => {
    if (instClasses.length === 0) return null;
    
    const isAcademy = instName === "WES Academy";
    const group1 = instClasses.filter(c => c.grade >= 1); // Primary or Juniors
    const group2 = instClasses.filter(c => c.grade < 1);  // Pre-Primary or Seniors

    const group1Title = isAcademy ? "Juniors Total" : "Primary Total";
    const group2Title = isAcademy ? "Seniors Total" : "Pre-Primary Total";
    const grandInstTitle = isAcademy ? "Academy Total" : "DPS Total";

    return (
      <React.Fragment key={instName}>
        {/* Section Header if there are multiple institutes */}
        {schoolName === "All Institutes" && (
          <tr className="bg-slate-200/50">
            <td colSpan={8} className="py-2.5 px-4 text-left text-xs font-black text-slate-700 uppercase tracking-widest border-y border-slate-200">
              {instName}
            </td>
          </tr>
        )}
        
        {group1.map(renderClassRow)}
        {group1.length > 0 && renderTotalRow(group1Title, group1)}
        
        {group1.length > 0 && group2.length > 0 && (
          <tr className="h-2 bg-slate-100/50"><td colSpan={8}></td></tr>
        )}

        {group2.map(renderClassRow)}
        {group2.length > 0 && renderTotalRow(group2Title, group2)}

        {/* Render an overall institute total if both groups exist */}
        {schoolName === "All Institutes" && (
          <React.Fragment>
             <tr className="h-1 bg-slate-200"><td colSpan={8}></td></tr>
             {renderTotalRow(grandInstTitle, instClasses)}
             <tr className="h-4"><td colSpan={8}></td></tr>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  // Group by institute
  const dpsClasses = classesList.filter(c => !c.institute || c.institute === "Dhanpuri Public School");
  const wesClasses = classesList.filter(c => c.institute === "WES Academy");
  // If there are other institutes, we can group them as well
  const otherInstitutes = Array.from(new Set(classesList.filter(c => c.institute && c.institute !== "Dhanpuri Public School" && c.institute !== "WES Academy").map(c => c.institute as string)));

  return (
    <div className="w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm select-none overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs font-medium text-slate-700">
          <thead>
            <tr>
              <th colSpan={8} className="bg-slate-100 py-2.5 text-center text-sm font-black text-slate-800 border-b border-slate-200 uppercase tracking-tight">
                Attendance - {schoolName}
              </th>
            </tr>
            <tr className="h-12 border-b border-slate-200">
              <th colSpan={4} className="bg-white py-2 px-4 text-base font-black text-center text-slate-800 border-r border-slate-200">
                <input type="date" value={currentDateValue} onChange={handleDateChange} className="bg-transparent border-none outline-none focus:ring-0 text-center font-black text-slate-800 w-[140px] md:w-[160px] cursor-pointer hover:text-indigo-600 transition-colors" />
              </th>
              <th colSpan={2} className="bg-emerald-50/50 py-2 text-base font-black text-center text-emerald-700 border-r border-slate-200">
                {hasSavedAttendance ? (grandP + grandML + grandHD) : ""}
              </th>
              <th colSpan={2} className="bg-indigo-50/50 py-2 text-base font-black text-center text-indigo-700">
                {hasSavedAttendance ? `${grandPercentage.toFixed(1)}%` : ""}
              </th>
            </tr>
            <tr className="font-bold text-center bg-slate-50 border-b border-slate-200 text-slate-800">
              <td className="py-2 px-3 bg-slate-100 border-r border-slate-200 uppercase tracking-wider text-[11px] text-slate-600">All Total</td>
              <td className="py-2 bg-emerald-50 text-emerald-700 border-r border-slate-200">{hasSavedAttendance ? grandP : ""}</td>
              <td className="py-2 bg-rose-50 text-rose-700 border-r border-slate-200">{hasSavedAttendance ? grandL : ""}</td>
              <td className="py-2 bg-red-50 text-red-700 border-r border-slate-200">{hasSavedAttendance ? grandA : ""}</td>
              <td className="py-2 bg-blue-50 text-blue-700 border-r border-slate-200">{hasSavedAttendance ? grandML : ""}</td>
              <td className="py-2 bg-slate-100 text-slate-500 border-r border-slate-200">{hasSavedAttendance ? grandNA : ""}</td>
              <td className="py-2 bg-amber-50 text-amber-700 border-r border-slate-200">{hasSavedAttendance ? grandHD : ""}</td>
              <td className="py-2 bg-slate-200 text-slate-700">{hasSavedAttendance ? grandH : ""}</td>
            </tr>
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
            {renderInstituteSection("Dhanpuri Public School", dpsClasses)}
            {renderInstituteSection("WES Academy", wesClasses)}
            {otherInstitutes.map(inst => renderInstituteSection(inst, classesList.filter(c => c.institute === inst)))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
