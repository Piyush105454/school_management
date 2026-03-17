"use client";

import React, { useState } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadAffidavit } from "@/features/admissions/actions/documentActions";

interface DocumentVerificationCardProps {
  docData: any;
  admissionId: string;
  studentName: string;
}

export function DocumentVerificationCard({ docData, admissionId, studentName }: DocumentVerificationCardProps) {
  const [loading, setLoading] = useState(false);
  const [affidavitFile, setAffidavitFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAffidavitFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!affidavitFile) {
      alert("Please select a file to upload");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", affidavitFile);
    formData.append("admissionId", admissionId);

    const res = await uploadAffidavit(formData);
    setLoading(false);

    if (res.success) {
      alert("Affidavit uploaded successfully!");
      setAffidavitFile(null);
      window.location.reload();
    } else {
      alert("Error uploading file: " + res.error);
    }
  };

  const handleViewPdf = () => {
    if (docData?.affidavit) {
      if (docData.affidavit.startsWith("data:application/pdf")) {
        const base64Data = docData.affidavit.split(",")[1];
        const byteCharacters = window.atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        window.open(docData.affidavit, "_blank");
      }
    }
  };

  return (

    <div className="space-y-6">
      {/* UPLOAD SECTION */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Affidavit Document</h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Upload the affidavit document (PDF format recommended)
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-300 transition-colors cursor-pointer group">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              id="affidavit-upload"
              disabled={loading}
            />
            <label htmlFor="affidavit-upload" className="cursor-pointer block">
              <Upload className="mx-auto mb-3 text-slate-300 group-hover:text-blue-400 transition-colors" size={32} />
              <p className="text-sm font-black text-slate-600 uppercase tracking-tight">
                {affidavitFile ? affidavitFile.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">
                PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !affidavitFile}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Uploading...
              </>
            ) : (
              <>
                <Upload size={16} /> Upload Affidavit
              </>
            )}
          </button>
        </div>
      </div>

      {/* STATUS SECTION */}
      {docData?.affidavit && (
        <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black text-emerald-700 uppercase italic">Document Uploaded</h4>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Pending office verification</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleViewPdf}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <Eye size={14} /> View Document
            </button>

            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = docData.affidavit;
                link.download = "affidavit.pdf";
                link.click();
              }}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <Download size={14} /> Download
            </button>
          </div>
        </div>
      )}

      {!docData?.affidavit && (
        <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 flex items-start gap-4 shadow-sm">
          <AlertCircle className="text-amber-500 shrink-0 mt-1" size={24} />
          <div className="space-y-1">
            <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Document Not Uploaded</p>
            <p className="text-xs font-medium text-amber-700 leading-relaxed uppercase tracking-wider">
              Please upload your affidavit document to proceed with the entrance test.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
