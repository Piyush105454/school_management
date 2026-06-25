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
        const wb = XLSX.read(bstr, { type: "binary", cellLinks: true } as any);
        
        const allValidRows: BulkImportRow[] = [];

        // Iterate through all sheets to find data
        wb.SheetNames.forEach(wsname => {
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          
          const sheetRows = data.map((row, index) => {
            // Normalize keys
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
              normalizedRow[key.trim().toLowerCase()] = row[key];
            });

            const getVal = (possibleKeys: string[]) => {
              for (const key of possibleKeys) {
                const val = normalizedRow[key.toLowerCase()];
                if (val !== undefined && val !== null) return String(val).trim();
              }
              return "";
            };

            const rawUnit = getVal(["Unit Name", "unit_name", "Unit"]) || "NA";
            const rawChapter = getVal(["Chapter Name", "chapter_name", "Chapter"]);
            
            if (!rawChapter) return null;

            const unitMatch = rawUnit.match(/(?:Unit|U)\s*[-:]?\s*(\d+)\s*[:.-]?\s*(.*)/i);
            let unitOrder = parseInt(getVal(["Unit Order", "unit_order", "Unit No"]) || "0");
            let unitName = rawUnit;
            
            if (unitMatch) {
              if (!unitOrder) unitOrder = parseInt(unitMatch[1]);
              unitName = unitMatch[2] || rawUnit;
            }

            const chapterMatch = rawChapter.match(/(?:Chapter|Ch|Chap)\s*[-:]?\s*(\d+)\s*[:.-]?\s*(.*)/i);
            let chapterNo = parseInt(getVal(["Chapter No", "chapter_no", "Chapter Number"]) || "0");
            let chapterName = rawChapter;

            if (chapterMatch) {
              if (!chapterNo) chapterNo = parseInt(chapterMatch[1]);
              chapterName = chapterMatch[2] || rawChapter;
            }

            if (!chapterNo) chapterNo = index + 1;

            let pdfUrl = getVal(["PDF Link", "pdf_link", "Google Drive Link", "URL"]);
            
            if (!pdfUrl) {
              const chapterKey = Object.keys(row).find(k => k.trim().toLowerCase().includes("chapter"));
              if (chapterKey) {
                const headers = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] as string[];
                const colIndex = headers.findIndex(h => h && String(h).trim() === chapterKey);
                if (colIndex !== -1) {
                  const cellRef = XLSX.utils.encode_cell({ r: index + 1, c: colIndex });
                  pdfUrl = ws[cellRef]?.l?.Target;
                }
              }
            }

            const res: BulkImportRow = {
              unitName: unitName.trim() || "NA",
              unitOrder: unitOrder || 1,
              chapterName: chapterName.trim(),
              chapterNo: chapterNo,
              pdfUrl,
            };

            const ps = parseInt(getVal(["Page Start", "page_start", "From"]) || "0");
            const pe = parseInt(getVal(["Page End", "page_end", "To"]) || "0");
            if (!isNaN(ps)) res.pageStart = ps;
            if (!isNaN(pe)) res.pageEnd = pe;

            return res;
          }).filter((r): r is BulkImportRow => r !== null);

          allValidRows.push(...sheetRows);
        });

        if (allValidRows.length === 0) {
          setError("No valid chapter data found in any sheet. Please ensure Chapter Name column exists.");
        } else {
          setParsedRows(allValidRows);
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
                    Expected columns: Chapter Name, Chapter No, Page Start, Page End, PDF Link.
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
