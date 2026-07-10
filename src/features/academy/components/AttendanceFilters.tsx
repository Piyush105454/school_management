"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

export interface AttendanceFiltersState {
  months: string[]; // array of months
  year: number;
  classes: number[]; // array of class IDs, empty means ALL
  studentIds: { id: string; name: string }[]; // selected students
  gender: string;
  religion: string;
  occupation: string;
}

interface Props {
  filters: AttendanceFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<AttendanceFiltersState>>;
  classesList: { id: number; name: string }[];
}

export default function AttendanceFilters({ filters, setFilters, classesList }: Props) {
  const [isClassesOpen, setIsClassesOpen] = useState(false);
  const [isMonthsOpen, setIsMonthsOpen] = useState(false);
  
  // Student Search State
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentResults, setStudentResults] = useState<{ id: string; name: string }[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [isStudentSearchFocused, setIsStudentSearchFocused] = useState(false);

  const monthsList = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const years = [2024, 2025, 2026, 2027];

  const handleClassToggle = (classId: number) => {
    setFilters(prev => {
      const current = prev.classes;
      if (current.includes(classId)) {
        return { ...prev, classes: current.filter(id => id !== classId) };
      } else {
        return { ...prev, classes: [...current, classId] };
      }
    });
  };

  const handleMonthToggle = (month: string) => {
    setFilters(prev => {
      const current = prev.months;
      if (current.includes(month)) {
        // Prevent deselecting all months, must have at least 1
        if (current.length === 1) return prev;
        return { ...prev, months: current.filter(m => m !== month) };
      } else {
        return { ...prev, months: [...current, month] };
      }
    });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Fetch if typing, OR if focused and a class is selected (to show class students)
      if (studentSearchTerm.length >= 2 || (isStudentSearchFocused && filters.classes.length > 0)) {
        setIsSearchingStudents(true);
        const classQuery = filters.classes.length > 0 ? `&classes=${filters.classes.join(",")}` : "";
        fetch(`/api/students/search?q=${encodeURIComponent(studentSearchTerm)}${classQuery}`)
          .then(res => res.json())
          .then(data => {
            setStudentResults(data);
          })
          .catch(err => console.error(err))
          .finally(() => setIsSearchingStudents(false));
      } else {
        setStudentResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [studentSearchTerm, filters.classes, isStudentSearchFocused]);

  const addStudent = (student: { id: string; name: string }) => {
    setFilters(prev => {
      if (!prev.studentIds.find(s => s.id === student.id)) {
        return { ...prev, studentIds: [...prev.studentIds, student] };
      }
      return prev;
    });
    setStudentSearchTerm("");
    setStudentResults([]);
  };

  const removeStudent = (studentId: string) => {
    setFilters(prev => ({
      ...prev,
      studentIds: prev.studentIds.filter(s => s.id !== studentId)
    }));
  };

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-bold text-slate-800 uppercase">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Months (Multi-select) */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Months</label>
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setIsMonthsOpen(!isMonthsOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 flex items-center justify-between outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <span className="truncate">
                {filters.months.length === 1 ? filters.months[0] : `${filters.months.length} Months`}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isMonthsOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {isMonthsOpen && (
              <div className="absolute z-20 top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2">
                {monthsList.map(m => (
                  <button 
                    key={m}
                    onClick={() => handleMonthToggle(m)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${filters.months.includes(m) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${filters.months.includes(m) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                      {filters.months.includes(m) && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Year */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Year</label>
          <select 
            value={filters.year} 
            onChange={(e) => setFilters(prev => ({ ...prev, year: Number(e.target.value) }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Gender */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Gender</label>
          <select 
            value={filters.gender} 
            onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="ALL">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="COMPARE">Compare Male vs Female</option>
          </select>
        </div>

        {/* Religion */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Religion</label>
          <select 
            value={filters.religion} 
            onChange={(e) => setFilters(prev => ({ ...prev, religion: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="ALL">All Religions</option>
            <option value="Hindu">Hindu</option>
            <option value="Muslim">Muslim</option>
            <option value="Christian">Christian</option>
            <option value="Sikh">Sikh</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Occupation */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Occupation</label>
          <select 
            value={filters.occupation} 
            onChange={(e) => setFilters(prev => ({ ...prev, occupation: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="ALL">All Occupations</option>
            <option value="Business">Business</option>
            <option value="Service">Service</option>
            <option value="Farmer">Farmer</option>
            <option value="Labour">Labour</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
        
        {/* Classes Multi-select Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Classes Filter</label>
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setIsClassesOpen(!isClassesOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 flex items-center justify-between outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <span className="truncate">
                {filters.classes.length === 0 ? "All Classes" : `${filters.classes.length} Class${filters.classes.length > 1 ? 'es' : ''} Selected`}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isClassesOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            
            {isClassesOpen && (
              <div className="absolute z-20 top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2">
                <button 
                  onClick={() => { setFilters(prev => ({ ...prev, classes: [] })); setIsClassesOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all mb-1 ${filters.classes.length === 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  All Classes
                </button>
                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                {classesList.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => handleClassToggle(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${filters.classes.includes(c.id) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${filters.classes.includes(c.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                      {filters.classes.includes(c.id) && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Student Search */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Individual Students</label>
          <div className="relative w-full">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <Search className="h-4 w-4 text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder={filters.classes.length > 0 ? "Search or select students..." : "Search students..."}
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                onFocus={() => setIsStudentSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsStudentSearchFocused(false), 200)}
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
              />
              {isSearchingStudents && <div className="h-4 w-4 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>}
            </div>
            
            {isStudentSearchFocused && studentResults.length > 0 && (
              <div className="absolute z-20 top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2">
                {studentResults.map(s => (
                  <button 
                    key={s.id}
                    onMouseDown={(e) => { e.preventDefault(); addStudent(s); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            {isStudentSearchFocused && studentSearchTerm.length >= 2 && studentResults.length === 0 && !isSearchingStudents && (
              <div className="absolute z-20 top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-4 text-center">
                <p className="text-sm font-medium text-slate-500">No students found.</p>
              </div>
            )}
          </div>
          
          {/* Selected Students Pills */}
          {filters.studentIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.studentIds.map(s => (
                <div key={s.id} className="flex items-center bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                  <span className="truncate max-w-[120px]">{s.name.split(' (')[0]}</span>
                  <button onClick={() => removeStudent(s.id)} className="ml-2 hover:bg-indigo-200 rounded-full p-0.5 transition-all">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setFilters(prev => ({ ...prev, studentIds: [] }))}
                className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600 underline ml-2"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
