"use client";

import React, { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { bulkImportStudentsAction } from "../actions/bulkImportActions";

export function BulkImportButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await bulkImportStudentsAction(formData);
      if (result.success) {
        alert(result.message);
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("An unexpected error occurred during import.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".xlsx, .xls" 
        className="hidden" 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isImporting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            Bulk Import Excel
          </>
        )}
      </button>
    </>
  );
}
