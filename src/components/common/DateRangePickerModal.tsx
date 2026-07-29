"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from "lucide-react";

interface DateRangePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate: string) => Promise<void>;
  initialStartDate?: string | null; // YYYY-MM-DD
  initialEndDate?: string | null;   // YYYY-MM-DD
  month: string;                    // e.g. "July"
  year: string;                     // e.g. "2026"
  title?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DateRangePickerModal({
  isOpen,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
  month,
  year,
  title = "Schedule Date Range"
}: DateRangePickerModalProps) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(() => {
    const idx = MONTH_NAMES.indexOf(month);
    return idx >= 0 ? idx : new Date().getMonth();
  });
  const [currentYearNum, setCurrentYearNum] = useState<number>(() => {
    const y = parseInt(year);
    return isNaN(y) ? new Date().getFullYear() : y;
  });

  const [startDate, setStartDate] = useState<string | null>(initialStartDate || null);
  const [endDate, setEndDate] = useState<string | null>(initialEndDate || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const idx = MONTH_NAMES.indexOf(month);
    if (idx >= 0) setCurrentMonthIndex(idx);
    const y = parseInt(year);
    if (!isNaN(y)) setCurrentYearNum(y);

    setStartDate(initialStartDate || null);
    setEndDate(initialEndDate || null);
  }, [month, year, initialStartDate, initialEndDate, isOpen]);

  if (!isOpen) return null;

  // Calendar math
  const daysInMonth = new Date(currentYearNum, currentMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYearNum, currentMonthIndex, 1).getDay(); // 0 = Sunday

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYearNum(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYearNum(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const formatDateStr = (dayNum: number) => {
    const mStr = String(currentMonthIndex + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    return `${currentYearNum}-${mStr}-${dStr}`;
  };

  const handleDateClick = (dayNum: number) => {
    const clickedStr = formatDateStr(dayNum);

    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedStr);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (clickedStr < startDate) {
        setStartDate(clickedStr);
        setEndDate(startDate);
      } else {
        setEndDate(clickedStr);
      }
    }
  };

  const isSelectedStart = (dayNum: number) => {
    return startDate === formatDateStr(dayNum);
  };

  const isSelectedEnd = (dayNum: number) => {
    return endDate === formatDateStr(dayNum);
  };

  const isInRange = (dayNum: number) => {
    if (!startDate || !endDate) return false;
    const cur = formatDateStr(dayNum);
    return cur > startDate && cur < endDate;
  };

  const formatDisplayRange = () => {
    if (!startDate) return "No range selected";

    const formatSingle = (s: string) => {
      const parts = s.split("-");
      if (parts.length !== 3) return s;
      const d = parseInt(parts[2]);
      const mIdx = parseInt(parts[1]) - 1;
      return `${d} ${SHORT_MONTHS[mIdx] || ""}`;
    };

    if (startDate && !endDate) {
      return formatSingle(startDate);
    }

    if (startDate && endDate) {
      return `${formatSingle(startDate)} – ${formatSingle(endDate)}`;
    }

    return "";
  };

  const handleSave = async () => {
    if (!startDate) return;
    const finalEnd = endDate || startDate;
    setSaving(true);
    try {
      await onSave(startDate, finalEnd);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <CalendarIcon size={18} className="text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-wider">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between px-2">
            <button 
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-black text-slate-800 font-outfit">
              {MONTH_NAMES[currentMonthIndex]} {currentYearNum}
            </span>
            <button 
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center gap-1">
            {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map(d => (
              <span key={d} className="text-[10px] font-black text-slate-400">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 text-center gap-y-1">
            {/* Empty slots for first week */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isStart = isSelectedStart(dayNum);
              const isEnd = isSelectedEnd(dayNum);
              const inRange = isInRange(dayNum);
              const isSingleSelected = isStart && isEnd;

              return (
                <div key={dayNum} className="flex items-center justify-center p-0.5">
                  <button
                    type="button"
                    onClick={() => handleDateClick(dayNum)}
                    className={`h-9 w-9 text-xs font-bold transition-all flex items-center justify-center ${
                      isStart || isEnd
                        ? "bg-amber-500 text-white rounded-full shadow-md font-black ring-2 ring-amber-300"
                        : inRange
                        ? "bg-amber-100 text-amber-950 rounded-none w-full font-bold"
                        : "hover:bg-slate-100 text-slate-700 rounded-full"
                    }`}
                  >
                    {dayNum}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <span className="text-xs font-black text-slate-700">
            {formatDisplayRange()}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={!startDate || saving}
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {saving ? "Saving..." : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
