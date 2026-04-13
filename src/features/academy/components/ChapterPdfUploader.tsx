"use client";

import React, { useState, useRef } from "react";
import { uploadChapterPdf, deleteChapterPdf } from "@/features/academy/actions/chapterActions";
import { Upload, X, FileText, Loader2, CheckCircle2, Eye } from "lucide-react";

interface ChapterPdfUploaderProps {
  chapterId: number;
  existingPdfUrl?: string;
  className?: string;
}

export default function ChapterPdfUploader({
  chapterId,
  existingPdfUrl,
  className = "",
}: ChapterPdfUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chapterId", chapterId.toString());
    formData.append("uploadedBy", "Teacher"); // could pass actual user later

    try {
      const result = await uploadChapterPdf(formData);
      if (result.success) {
        setSuccess(true);
        setFile(null);
      } else {
        setError(result.error || "Failed to upload PDF");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this PDF?")) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await deleteChapterPdf(chapterId);
      if (result.success) {
        setSuccess(false);
      } else {
        setError(result.error || "Failed to delete PDF");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [manualLink, setManualLink] = useState("");

  const handleLinkSubmit = async () => {
    if (!manualLink.trim()) return;
    
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("fileUrl", manualLink.trim()); // We'll handle this in the action
    formData.append("chapterId", chapterId.toString());
    formData.append("uploadedBy", "Teacher (Link)");

    try {
      const result = await uploadChapterPdf(formData);
      if (result.success) {
        setSuccess(true);
        setManualLink("");
        setShowLinkInput(false);
      } else {
        setError(result.error || "Failed to save link");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  // View Mode
  if (existingPdfUrl && !success && !file) {
    const isExternal = existingPdfUrl.startsWith("http") && !existingPdfUrl.includes("/api/academy/chapter-pdf");
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <button
          onClick={() => {
            window.open(existingPdfUrl, '_blank');
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white text-slate-700 hover:bg-slate-50 font-bold rounded-lg transition-all text-[10px] uppercase tracking-wider border border-slate-200 shadow-sm whitespace-nowrap group"
        >
          {isExternal ? (
            <Eye className="h-3 w-3 text-emerald-500 group-hover:scale-110 transition-transform" />
          ) : (
            <FileText className="h-3 w-3 text-blue-500 group-hover:scale-110 transition-transform" />
          )}
          {isExternal ? "Open Link" : "View PDF"}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 border border-slate-100"
          title="Delete"
        >
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        </button>
      </div>
    );
  }

  // Link Entry Mode
  if (showLinkInput) {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <div className="flex items-center gap-1">
          <input 
            type="url"
            placeholder="Paste Google Drive link..."
            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
            value={manualLink}
            onChange={(e) => setManualLink(e.target.value)}
            autoFocus
          />
          <button 
            onClick={() => setShowLinkInput(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <button
          onClick={handleLinkSubmit}
          disabled={isUploading || !manualLink.trim()}
          className="w-full py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"
        >
          {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          {isUploading ? "Saving..." : "Save Link"}
        </button>
      </div>
    );
  }

  // Upload/Choice Mode
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {!file ? (
        <div className="flex gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm group"
          >
            <Upload className="h-3 w-3 group-hover:-translate-y-0.5 transition-transform" />
            File
            <input 
              type="file" 
              accept="application/pdf"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
          </button>
          <button 
            onClick={() => setShowLinkInput(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm group"
          >
            <Eye className="h-3 w-3 group-hover:scale-110 transition-transform" />
            Link
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center gap-1.5 overflow-hidden truncate">
              <FileText className="h-3 w-3 text-blue-500 shrink-0" />
              <span className="text-[10px] font-bold text-slate-700 truncate">{file.name}</span>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
              disabled={isUploading}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm"
          >
            {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {error && <p className="text-[10px] text-red-500 font-bold text-center mt-1">{error}</p>}
      {success && (
        <p className="text-[10px] text-green-600 font-bold text-center flex items-center justify-center gap-1 mt-1">
          <CheckCircle2 className="h-3 w-3" /> Done!
        </p>
      )}
    </div>
  );
}
