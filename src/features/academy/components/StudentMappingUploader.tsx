"use client";

import React, { useState } from "react";
import { Link2, X, Loader2, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export default function StudentMappingUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSummary(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/students/bulk-map", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mapping failed");

      setSummary(data.message);
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
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm border border-slate-200"
      >
        <Link2 className="h-4 w-4" />
        Sync with Admissions
      </button>

      <Modal isOpen={isOpen} onClose={closeAndReset} title="Sync Students with Admission Data">
        <div className="p-1 space-y-4">
          {!summary ? (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[11px] font-bold text-amber-700 uppercase">How it works:</p>
                <p className="text-xs text-amber-600 mt-1">
                  Upload an Excel file with <b>Aadhar Card</b>, <b>Roll No</b>, and <b>Scholar No</b>. 
                  The system will find students in Admission using Aadhar and update their Academy records.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Excel File (.xlsx)</label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300'}`}
                  onClick={() => document.getElementById('mapping-file-upload')?.click()}
                >
                  <Upload className={`h-8 w-8 ${file ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <p className="text-sm text-slate-500 font-medium">
                    {file ? file.name : "Click to select mapping file"}
                  </p>
                  <input
                    id="mapping-file-upload"
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
                    Matching & Syncing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Run Sync
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
                <h3 className="text-lg font-bold text-slate-900">Sync Finished</h3>
                <p className="text-sm text-slate-600 whitespace-pre-line">{summary}</p>
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
