"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { BookOpen, Calendar, ChevronRight, Search, ClipboardList, Filter, Upload, CheckCircle2, Eye, Clock, AlertCircle } from "lucide-react";
import { submitHomeworkAction } from "@/features/academy/actions/homeworkActions";

interface HomeworkItem {
  id: string;
  date: string;
  subjectName: string;
  homework: string;
  teacherName: string;
  unit: string;
  status: string;
  submittedDescription?: string;
  submittedImage?: string;
}

export default function HomeworkClient({ 
  initialItems, 
  className,
  studentId,
  studentRoll
}: { 
  initialItems: HomeworkItem[], 
  className: string,
  studentId: number,
  studentRoll: string
}) {
  const [items, setItems] = useState<HomeworkItem[]>(initialItems);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('en-US', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Available dates for the selected month/year
  const availableDates = useMemo(() => {
    return Array.from(new Set(items.map(item => item.date)))
      .filter(date => {
        const d = new Date(date);
        return d.toLocaleString('en-US', { month: 'long' }) === selectedMonth && 
               d.getFullYear().toString() === selectedYear;
      })
      .sort((a, b) => b.localeCompare(a));
  }, [items, selectedMonth, selectedYear]);

  const [selectedDate, setSelectedDate] = useState<string | null>(
    availableDates.length > 0 ? availableDates[0] : (items.length > 0 ? items[0].date : null)
  );

  // Sync selectedDate when month/year changes
  useEffect(() => {
    if (selectedDate && !availableDates.includes(selectedDate) && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    } else if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  // Filter items by selected date
  const filteredItemsByDate = useMemo(() => {
    return items.filter(item => item.date === selectedDate);
  }, [items, selectedDate]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    filteredItemsByDate.length > 0 ? filteredItemsByDate[0].id : null
  );

  // Sync selectedSubjectId when date changes
  useEffect(() => {
    if (filteredItemsByDate.length > 0 && (!selectedSubjectId || !filteredItemsByDate.some(i => i.id === selectedSubjectId))) {
      setSelectedSubjectId(filteredItemsByDate[0].id);
    }
  }, [filteredItemsByDate]);

  const selectedItem = filteredItemsByDate.find(item => item.id === selectedSubjectId);

  // Load existing submission data into form when subject changes
  useEffect(() => {
    if (selectedItem) {
        setDescription(selectedItem.submittedDescription || "");
        setUploadUrl(selectedItem.submittedImage || null);
        setSelectedFile(null);
    }
  }, [selectedSubjectId]);

  const handleSubmit = async () => {
    if (!selectedSubjectId || !selectedItem) return;
    setSubmitting(true);
    
    try {
      let finalImageUrl = uploadUrl;

      // 1. If file selected but not uploaded yet, upload it
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("rollNumber", studentRoll);
        formData.append("date", selectedDate || new Date().toISOString().split('T')[0]);

        const uploadRes = await fetch("/api/upload/homework", {
          method: "POST",
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          finalImageUrl = uploadData.url;
          setUploadUrl(finalImageUrl);
        } else if (uploadData.error) {
            throw new Error(uploadData.error);
        }
      }

      // 2. Submit to database
      const dbFormData = new FormData();
      dbFormData.append("lessonPlanId", selectedItem.id);
      dbFormData.append("studentId", studentId.toString());
      dbFormData.append("description", description);
      if (finalImageUrl) dbFormData.append("imagePath", finalImageUrl);

      const res = await submitHomeworkAction(dbFormData);
      if (res.success) {
        alert("Homework submitted successfully!");
        // Update local state to reflect submission
        setItems(prev => prev.map(item => 
            item.id === selectedItem.id 
            ? { ...item, status: "PENDING", submittedDescription: description, submittedImage: finalImageUrl || undefined } 
            : item
        ));
      } else {
        alert("Submission failed: " + res.error);
      }
    } catch (error: any) {
      console.error(error);
      alert("An error occurred during submission: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = ["2024", "2025", "2026", "2027"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Filter size={20} />
            </div>
            <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Archive Filter</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select month to view old homework</p>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 hidden md:block mx-2"></div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full md:max-w-[400px]">
            {availableDates.length === 0 ? (
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">No records found</span>
            ) : (
              availableDates.slice(0, 5).map(date => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                    selectedDate === date 
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {new Date(date).getDate()} {new Date(date).toLocaleString('en-US', { month: 'short' })}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subject List Side */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Subjects</h3>
                <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full">{filteredItemsByDate.length}</span>
            </div>
            <div className="p-3 space-y-1">
                {filteredItemsByDate.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                    <Search size={24} className="mx-auto text-slate-200" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select a valid date</p>
                </div>
                ) : (
                filteredItemsByDate.map(item => (
                    <button
                    key={item.id}
                    onClick={() => setSelectedSubjectId(item.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-left group ${
                        selectedSubjectId === item.id 
                        ? "bg-slate-900 text-white shadow-lg" 
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                    >
                    <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        selectedSubjectId === item.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                        }`}>
                        <BookOpen size={14} />
                        </div>
                        <div>
                            <h4 className="font-bold uppercase text-xs truncate">{item.subjectName}</h4>
                            <div className="flex items-center gap-1 mt-0.5">
                                <div className={`h-1 w-1 rounded-full ${
                                    item.status === 'COMPLETED' ? 'bg-emerald-500' :
                                    item.status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-300'
                                }`}></div>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${
                                    selectedSubjectId === item.id ? "text-slate-400" : "text-slate-400"
                                }`}>
                                    {item.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>
                    {selectedSubjectId === item.id && <ChevronRight size={14} className="text-blue-400" />}
                    </button>
                ))
                )}
            </div>
          </div>
        </div>

        {/* Details View Side */}
        <div className="lg:col-span-9">
          {selectedItem ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-1 bg-slate-900"></div>
              
              <div className="border-b-2 border-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-200 md:border-b-0">
                  <div className="md:col-span-6 p-6 border-b border-slate-200 md:border-b-0 md:border-r-2 md:border-slate-900 flex items-center bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">1B. TODAY'S HOMEWORK</h3>
                  </div>
                  <div className="md:col-span-2 p-4 border-b border-slate-200 md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center">
                    <span className="text-[9px] font-black uppercase text-slate-400">Class</span>
                    <span className="text-xs font-bold text-slate-900 truncate underline decoration-slate-200 underline-offset-4">{className}</span>
                  </div>
                  <div className="md:col-span-2 p-4 border-b border-slate-200 md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center">
                    <span className="text-[9px] font-black uppercase text-slate-400">Subject</span>
                    <span className="text-xs font-bold text-slate-900 truncate underline decoration-slate-200 underline-offset-4">{selectedItem.subjectName}</span>
                  </div>
                  <div className="md:col-span-2 p-4 flex flex-col justify-center">
                    <span className="text-[9px] font-black uppercase text-slate-400">Date</span>
                    <span className="text-xs font-bold text-slate-900">{formatDate(selectedItem.date)}</span>
                  </div>
                </div>
              </div>

              {/* Homework Content Area */}
              <div className="p-8 md:p-12 min-h-[300px] bg-white relative border-b-2 border-slate-900">
                <div className="absolute top-4 left-6 text-[10px] font-black text-slate-100 uppercase tracking-[0.6em] select-none">Assignment Content</div>
                <div className="text-slate-800 text-lg md:text-xl font-medium whitespace-pre-wrap leading-relaxed italic relative z-10">
                  {selectedItem.homework}
                </div>
              </div>

              {/* Submission Section */}
              <div className="p-8 md:p-12 bg-slate-50">
                  <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                <ClipboardList size={18} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Your Submission</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload proof of your notebook work</p>
                            </div>
                        </div>
                        {selectedItem.status !== 'NOT_SUBMITTED' && (
                             <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${
                                 selectedItem.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                             }`}>
                                 <CheckCircle2 size={14} /> {selectedItem.status.replace('_', ' ')}
                             </div>
                        )}
                  </div>

                  <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Description / Answer</label>
                              <textarea 
                                  value={description}
                                  onChange={(e) => setDescription(e.target.value)}
                                  disabled={selectedItem.status === 'COMPLETED'}
                                  placeholder="Write your notes or homework summary here..."
                                  className="w-full h-48 p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Image Upload (Max 5MB)</label>
                              <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="hidden" 
                                accept="image/*"
                                disabled={selectedItem.status === 'COMPLETED'}
                              />
                              <div 
                                onClick={() => selectedItem.status !== 'COMPLETED' && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-2 transition-all cursor-pointer h-48 relative overflow-hidden ${
                                    selectedFile || uploadUrl ? "border-emerald-300 bg-emerald-50/10" : "border-slate-200 bg-white hover:border-blue-300"
                                } ${selectedItem.status === 'COMPLETED' ? 'cursor-default opacity-80' : ''}`}
                              >
                                  {selectedFile || uploadUrl ? (
                                      <div className="absolute inset-0 group">
                                          <img 
                                            src={selectedFile ? URL.createObjectURL(selectedFile) : uploadUrl || ""} 
                                            className="w-full h-full object-contain p-2" 
                                            alt="Preview" 
                                          />
                                          {selectedItem.status !== 'COMPLETED' && (
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                  <Upload size={24} className="text-white" />
                                              </div>
                                          )}
                                      </div>
                                  ) : (
                                      <>
                                          <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                              <Upload size={16} />
                                          </div>
                                          <span className="text-[9px] font-black uppercase tracking-widest leading-tight text-slate-400">
                                              Click to upload photo of your notebook
                                          </span>
                                      </>
                                  )}
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200/60 mt-4">
                          {selectedItem.status === 'NOT_SUBMITTED' ? (
                               <button 
                                    type="button"
                                    disabled={submitting || (!description && !selectedFile)}
                                    onClick={handleSubmit}
                                    className="px-10 py-4 bg-blue-600 disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {submitting && <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {submitting ? "Submitting..." : "Submit Homework Now"}
                                </button>
                          ) : (
                               <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</p>
                                        <p className={`text-xs font-black uppercase tracking-tighter ${
                                            selectedItem.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-500'
                                        }`}>
                                            {selectedItem.status.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <button 
                                        type="button"
                                        disabled={submitting || selectedItem.status === 'COMPLETED'}
                                        onClick={handleSubmit}
                                        className="px-10 py-4 bg-slate-900 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
                                    >
                                        Update Submission
                                    </button>
                               </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Teacher Info Footer */}
              <div className="bg-white p-8 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-lg font-black italic border border-slate-200">
                    {selectedItem.teacherName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Assigned By</span>
                    <span className="text-sm font-black uppercase text-slate-900 tracking-tight">{selectedItem.teacherName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                    <div className="hidden md:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic mb-1">Academic Session</p>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">2026-2027</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 border border-blue-100">
                        <BookOpen size={18} />
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center text-slate-100 shadow-sm border border-slate-50">
                <AlertCircle size={40} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Homework Selected</p>
                <p className="text-[10px] text-slate-300 font-bold uppercase mt-2 tracking-[0.2em]">Select a subject from the sidebar to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
