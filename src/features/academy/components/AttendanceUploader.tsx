"use client";

import React, { useState } from "react";
import { Upload, X, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface AttendanceUploaderProps {
  onSuccess?: (summary: any) => void;
}

export default function AttendanceUploader({ onSuccess }: AttendanceUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSummary(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/attendance/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSummary(data.summary);
      if (onSuccess) onSuccess(data.summary);
      
      // Keep summary visible for a bit longer if multiple sheets
      setTimeout(() => {
        // We don't auto-close if user wants to see the sheet list
      }, 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const closeAndReset = () => {
    setIsOpen(false);
    setFile(null);
    setSummary(null);
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm shadow-lg shadow-indigo-500/20"
      >
        <Upload className="h-4 w-4" />
        Global Import
      </button>

      <Modal isOpen={isOpen} onClose={closeAndReset} title="Global Attendance Import">
        <div className="p-1 space-y-4">
          {!summary ? (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Excel File (.xlsx)</label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300'}`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className={`h-8 w-8 ${file ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <p className="text-sm text-slate-500 font-medium">
                    {file ? file.name : "Click to select or drag and drop"}
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading || !file}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/10"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading & Parsing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Start Import
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="py-2 flex flex-col items-center text-center gap-4 animate-in zoom-in duration-300">
              <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Import Successful</h3>
                <p className="text-sm text-slate-500">Attendance data has been synchronized</p>
              </div>
              
              <div className="w-full grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xl font-black text-indigo-600">{summary.overall}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Days</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xl font-black text-indigo-600">{summary.students}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Students</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xl font-black text-indigo-600">{summary.attendance}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Records</p>
                </div>
              </div>

              <div className="w-full space-y-2 text-left">
                <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Processed Sheets</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {summary.sheetNames?.map((sheet: string) => (
                    <div key={sheet} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[11px] font-bold text-slate-600 truncate">{sheet}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={closeAndReset}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm mt-2"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
