"use client";

import React, { useState, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  Eye,
  Trash2,
  Lock,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadAffidavit, removeAffidavit, submitAffidavit, getAffidavitContent } from "@/features/admissions/actions/documentActions";
import { SmartUploader } from "./SmartUploader";
import { saveAdmissionStep } from "@/features/admissions/actions/admissionActions";
import { useRouter } from "next/navigation";

interface DocumentVerificationCardProps {
  docData: any;
  checklistData: any;
  admissionId: string;
  studentName: string;
  officeRemarks?: string | null;
  admissionStep?: number;
}

export function DocumentVerificationCard({ 
  docData, 
  checklistData, 
  admissionId, 
  studentName,
  officeRemarks,
  admissionStep
}: DocumentVerificationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Local state for instant feedback
  const [currentDocData, setCurrentDocData] = useState(docData);
  const [currentChecklistData, setCurrentChecklistData] = useState(checklistData);

  // Sync state when props change (from background router.refresh())
  useEffect(() => {
    setCurrentDocData(docData);
  }, [docData]);

  useEffect(() => {
    setCurrentChecklistData(checklistData);
  }, [checklistData]);

  const isFinalized = currentChecklistData?.parentAffidavit === "SUBMITTED" || currentChecklistData?.parentAffidavit === "VERIFIED";
  const hasUploaded = !!currentDocData?.affidavit;



  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this document?")) return;
    
    setLoading(true);
    const res = await removeAffidavit(admissionId);

    if (res.success) {
      // Instant feedback
      setCurrentDocData((prev: any) => ({
        ...prev,
        affidavit: null
      }));
      setLoading(false);
      router.refresh(); // Sync with server in background
    } else {
      setLoading(false);
      alert("Error removing document: " + res.error);
    }
  };

  const handleSubmitFinal = async () => {
    if (!confirm("Once submitted, you cannot edit or remove this document. Proceed?")) return;

    setLoading(true);
    const res = await submitAffidavit(admissionId);

    if (res.success) {
      // Instant feedback
      setCurrentChecklistData((prev: any) => ({
        ...prev,
        parentAffidavit: "SUBMITTED"
      }));
      setLoading(false);
      router.refresh(); // Sync with server in background
    } else {
      setLoading(false);
      alert("Error submitting document: " + res.error);
    }
  };

  const handleViewPdf = () => {
    window.open(`/api/view-doc?id=${admissionId}&field=affidavit&type=affidavit`, "_blank");
  };

  const handleDownload = () => {
    window.open(`/api/view-doc?id=${admissionId}&field=affidavit&type=affidavit`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* OFFICE REMARK / CORRECTION NEEDED BANNER */}
      {officeRemarks && !hasUploaded && admissionStep === 8 && (
        <div className="max-w-4xl mx-auto mb-2 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-red-50 border-2 border-red-200 rounded-[32px] p-6 flex items-start gap-5 shadow-xl shadow-red-100/50">
            <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0 border border-red-200 shadow-inner">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <div className="space-y-1.5 flex-1 pt-1">
              <h4 className="text-[10px] font-black text-red-900 uppercase tracking-[0.2em]">Correction Required by Office</h4>
              <p className="text-sm font-bold text-red-700 leading-tight italic">
                "{officeRemarks}"
              </p>
              <p className="text-[10px] font-bold text-red-400 pt-1 uppercase tracking-widest leading-relaxed">
                Please follow the instructions above and re-submit your documents.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LOCKED STATUS BANNER */}
      {isFinalized && (
        <div className="bg-slate-900 text-white p-6 rounded-[32px] border border-slate-800 flex items-center gap-4 shadow-xl shadow-slate-900/10 animate-in slide-in-from-top duration-500">
          <div className="h-12 w-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Lock size={24} />
          </div>
          <div>
            <h4 className="text-lg font-black uppercase italic tracking-tight">Document Finalized & Locked</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Your affidavit has been officially submitted and cannot be modified.</p>
          </div>
        </div>
      )}

      {/* UPLOAD SECTION (Visible only if not uploaded AND not finalized) */}
      {!hasUploaded && !isFinalized && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Step 1: Upload Affidavit</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              Scan and upload your document. PDF format recommended.
            </p>
          </div>

          <div className="max-w-xl mx-auto md:mx-0">
            <SmartUploader
              admissionId={admissionId}
              fieldName="affidavit"
              label="Legal Affidavit"
              hindiLabel="कानूनी शपथ पत्र"
              maxSizeMB={1}
              onUploadComplete={async (url) => {
                setLoading(true);
                // We use saveAdmissionStep to update the DB table student_documents.affidavit
                const res = await saveAdmissionStep(admissionId, 10, { documents: { affidavit: url } });
                if (res.success) {
                  setCurrentDocData((prev: any) => ({ ...prev, affidavit: url }));
                  router.refresh();
                } else {
                  const errorMsg = (res as any).error || "Unknown error";
                  alert("Error saving record: " + errorMsg);
                }
                setLoading(false);
              }}
              accept="application/pdf,image/*"
            />
          </div>
        </div>
      )}

      {/* REVIEW & SUBMIT SECTION (Visible if uploaded) */}
      {hasUploaded && (
        <div className={cn(
          "p-8 rounded-[32px] border shadow-xl transition-all duration-500 animate-in fade-in zoom-in-95",
          isFinalized ? "bg-slate-50 border-slate-100 opacity-80" : "bg-emerald-50/50 border-emerald-100/50"
        )}>
          <div className="flex items-center gap-5 mb-8">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg",
              isFinalized ? "bg-slate-800 text-white shadow-slate-800/20" : "bg-emerald-500 text-white shadow-emerald-500/20"
            )}>
              {isFinalized ? <CheckCircle size={28} /> : <FileText size={28} />}
            </div>
            <div>
              <h4 className={cn("text-xl font-black uppercase italic tracking-tight", isFinalized ? "text-slate-800" : "text-emerald-800")}>
                {isFinalized ? "Documents Verified" : "Review & Submit"}
              </h4>
              <p className={cn("text-[9px] font-bold uppercase tracking-[0.2em]", isFinalized ? "text-slate-500" : "text-emerald-600")}>
                {isFinalized ? "No further action needed" : "Verify details before locking submission"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleViewPdf}
              disabled={loading}
              className="py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={14}/> : <><Eye size={16} /> View Document</>}
            </button>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={14}/> : <><Download size={16} /> Download Copy</>}
            </button>
          </div>

          {!isFinalized && (
            <div className="pt-6 mt-6 border-t border-emerald-100/50 space-y-4">
               <button
                onClick={handleSubmitFinal}
                disabled={loading}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Final Submit & Lock</>}
              </button>

              <button
                onClick={handleRemove}
                disabled={loading}
                className="w-full py-3 text-red-400 font-bold uppercase tracking-[0.2em] text-[8px] hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={12} /> Remove and start over
              </button>
            </div>
          )}
        </div>
      )}

      {/* WARNING BOX (Visible only if not uploaded) */}
      {!hasUploaded && !isFinalized && (
        <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 flex items-start gap-4 shadow-sm">
          <AlertCircle className="text-amber-500 shrink-0 mt-1" size={24} />
          <div className="space-y-1">
            <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Submission Required</p>
            <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-widest">
              You must upload AND submit your affidavit to proceed. Max file size: 1 MB.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
