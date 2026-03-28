"use client";

import React, { useState, useRef } from "react";
import { FileSpreadsheet, X, Loader2, Upload, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { bulkImportAcademyData, BulkImportRow } from "@/features/academy/actions/bulkActions";

interface ExcelImportModalProps {
  subjectId: number;
}

export default function ExcelImportModal({ subjectId }: ExcelImportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<BulkImportRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        // Map columns (fuzzy matching)
        const mapped = data.map(row => ({
          unitName: row["Unit Name"] || row["unit_name"] || row["Unit"] || "NA",
          unitOrder: parseInt(row["Unit Order"] || row["unit_order"] || row["Unit No"] || "0"),
          chapterName: row["Chapter Name"] || row["chapter_name"] || row["Chapter"] || "",
          chapterNo: parseInt(row["Chapter No"] || row["chapter_no"] || row["Chapter Number"] || "1"),
          pageStart: parseInt(row["Page Start"] || row["page_start"] || row["From"] || "0"),
          pageEnd: parseInt(row["Page End"] || row["page_end"] || row["To"] || "0"),
          pdfUrl: row["PDF Link"] || row["pdf_link"] || row["Google Drive Link"] || row["URL"],
        })).filter(row => row.chapterName);

        if (mapped.length === 0) {
          setError("No valid chapter data found in the file. Please check column names.");
        } else {
          setParsedRows(mapped);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setError("Failed to parse Excel file.");
    }
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    const result = await bulkImportAcademyData(subjectId, parsedRows);
    
    setIsSubmitting(false);
    if (result.success) {
      setIsOpen(false);
      setParsedRows([]);
      setFileName(null);
    } else {
      setError(result.error || "Failed to import data.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Import Excel
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Bulk Import</h2>
                  <p className="text-xs text-slate-500 font-medium">Upload Excel with Units & Chapters</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-sm font-medium flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  {error}
                </div>
              )}

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <div className="h-14 w-14 bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 rounded-2xl flex items-center justify-center transition-colors">
                  <Upload className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-700">
                    {fileName || "Click to select Excel file"}
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Expected columns: Unit Name, Unit No, Chapter Name, Chapter No, Page Start, Page End, PDF Link.
                  </p>
                </div>
              </div>

              {parsedRows.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">
                    Ready to import <span className="text-emerald-600">{parsedRows.length} Chapters</span>
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Import"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
