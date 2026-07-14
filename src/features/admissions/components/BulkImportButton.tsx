"use client";

import React, { useRef, useState, useEffect } from "react";
import { Upload, Loader2, BookOpen } from "lucide-react";
import { bulkImportStudentsAction } from "../actions/bulkImportActions";
import { Modal } from "@/components/ui/Modal";
import { useInstitute } from "@/providers/InstituteProvider";

export function BulkImportButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const { institutes, selectedInstitute: globalSelectedInstitute } = useInstitute();
  const [importInstitute, setImportInstitute] = useState<string>("");
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Initialize with the globally selected institute if it's not "ALL"
  useEffect(() => {
    if (globalSelectedInstitute && globalSelectedInstitute !== "ALL" && !importInstitute) {
      setImportInstitute(globalSelectedInstitute);
    } else if (institutes.length > 0 && !importInstitute) {
      setImportInstitute(institutes[0]);
    }
  }, [globalSelectedInstitute, institutes, importInstitute]);

  // Fetch classes when the selected import institute changes
  useEffect(() => {
    if (!importInstitute || importInstitute === "ALL") {
      setAvailableClasses([]);
      return;
    }
    
    setLoadingClasses(true);
    fetch(`/api/classes?institute=${encodeURIComponent(importInstitute)}`)
      .then(res => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const uniqueClasses = Array.from(new Set(data.map((c) => c.name)));
          setAvailableClasses(uniqueClasses);
        }
      })
      .catch(err => console.error("Failed to fetch classes:", err))
      .finally(() => setLoadingClasses(false));
  }, [importInstitute]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!importInstitute || importInstitute === "ALL") {
      alert("Please select a school first.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("institute", importInstitute);

    try {
      const result = await bulkImportStudentsAction(formData);
      if (result.success) {
        alert(result.message);
        setIsModalOpen(false);
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
      <div className="flex flex-col gap-2">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/10 active:scale-95"
        >
          <Upload className="h-5 w-5" />
          Bulk Import Excel
        </button>
        <a 
          href="/student_import_sample.csv" 
          download 
          className="text-[10px] text-center font-bold text-emerald-700 hover:underline uppercase tracking-wider"
        >
          Download Enquiry Sample CSV
        </a>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Bulk Import Students"
      >
        <div className="space-y-6">
          <p className="text-slate-600 text-sm">
            Please select the target school for these students before uploading the Excel file. 
            All students in the uploaded file will be assigned to this school.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Select School</label>
            <select
              value={importInstitute}
              onChange={(e) => setImportInstitute(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            >
              <option value="" disabled>Select a school...</option>
              {institutes.filter(i => i !== "ALL").map(institute => (
                <option key={institute} value={institute}>{institute}</option>
              ))}
            </select>
          </div>

          {importInstitute && importInstitute !== "ALL" && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                <BookOpen className="h-4 w-4" />
                <span>Available Classes for {importInstitute}</span>
              </div>
              <p className="text-xs text-blue-600 mb-3">
                Use exactly these class names in the "Class" column of your Excel file:
              </p>
              {loadingClasses ? (
                <div className="text-sm text-blue-600 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading classes...
                </div>
              ) : availableClasses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableClasses.map(c => (
                    <span key={c} className="px-2 py-1 bg-white border border-blue-200 rounded-md text-xs font-medium text-slate-700 shadow-sm">
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-amber-600">
                  No classes found for this school. Please ensure classes are set up first.
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              disabled={isImporting}
            >
              Cancel
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || !importInstitute || importInstitute === "ALL"}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Choose File & Import
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".xlsx, .xls, .csv" 
          className="hidden" 
        />
      </Modal>
    </>
  );
}
