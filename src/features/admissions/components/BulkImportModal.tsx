"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import * as xlsx from "xlsx";
import { importBulkStudentData } from "@/app/(dashboard)/office/admissions-progress/actions";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; processed?: number; skipped?: number; error?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: "array" });

      // Find sheet case-insensitively
      const actualSheetName = workbook.SheetNames.find(s => s.trim().toLowerCase() === 'all');
      if (!actualSheetName) {
        setResult({ success: false, error: "The Excel file must contain a sheet named 'All'." });
        setIsProcessing(false);
        return;
      }

      const worksheet = workbook.Sheets[actualSheetName];

      // Auto-detect header row (some sheets have a title row before the actual headers)
      let headerRowIndex = 0;
      const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const rowArray: any = rawData[i];
        if (Array.isArray(rowArray) && rowArray.some((val: any) => typeof val === 'string' && (val.toLowerCase().includes('aadhar') || val.toLowerCase().includes('name')))) {
          headerRowIndex = i;
          break;
        }
      }

      const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: "", range: headerRowIndex });

      if (jsonData.length === 0) {
        setResult({ success: false, error: "The 'All' sheet is empty." });
        setIsProcessing(false);
        return;
      }

      // Ensure data is purely plain objects (Next.js server actions require this)
      const plainJsonData = JSON.parse(JSON.stringify(jsonData));

      // Call Server Action
      const response = await importBulkStudentData(plainJsonData);
      
      setResult({
        success: true,
        processed: response.processed,
        skipped: response.skipped
      });
      
      if (response.success) {
        onSuccess();
      }

    } catch (error: any) {
      console.error("Error processing excel file:", error);
      setResult({ success: false, error: error.message || "An error occurred while processing the file." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600">
            <FileSpreadsheet className="h-5 w-5" />
            <h2 className="font-bold text-slate-800">Bulk Import Students</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {!result ? (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center gap-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Click to upload Excel file</p>
                  <p className="text-xs text-slate-500 mt-1">.xlsx or .xls</p>
                </div>
                {file && (
                  <div className="mt-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    Selected: {file.name}
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
              </div>

              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Ensure the file has a sheet named <strong>All</strong>. Existing student data will be updated based on matching <strong>Aadhar Card</strong>. Blank cells will not overwrite existing data.</p>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-xl flex flex-col items-center text-center space-y-3 ${result.success ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              {result.success ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="font-bold">Import Successful</p>
                    <p className="text-sm mt-1">Processed: {result.processed} students</p>
                    <p className="text-sm">Skipped (No Aadhar/Not Found): {result.skipped}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-rose-500" />
                  <div>
                    <p className="font-bold">Import Failed</p>
                    <p className="text-sm mt-1">{result.error}</p>
                  </div>
                </>
              )}
              
              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                }}
                className="mt-2 text-xs font-semibold underline hover:no-underline"
              >
                Import another file
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            disabled={isProcessing}
          >
            Cancel
          </button>
          {!result && (
            <button
              onClick={handleProcessFile}
              disabled={!file || isProcessing}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isProcessing ? "Processing..." : "Import Data"}
            </button>
          )}
          {result?.success && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-sm transition-all"
            >
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
