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

  // View Mode
  if (existingPdfUrl && !success && !file) {
    const isExternal = existingPdfUrl.startsWith("http");
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => {
            window.open(existingPdfUrl, '_blank');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 font-bold rounded-xl transition-colors text-xs uppercase tracking-wider ${
            isExternal 
              ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" 
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {isExternal ? (
            <>
              <Eye className="h-4 w-4" />
              Open Drive Link
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              View Server PDF
            </>
          )}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          title="Delete"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  // Upload Mode
  return (
    <div className={`space-y-2 ${className}`}>
      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all text-center group"
        >
          <div className="h-8 w-8 bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 rounded-full flex items-center justify-center transition-colors">
            <Upload className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700">
            Click to upload Chapter PDF
          </span>
          <input 
            type="file" 
            accept="application/pdf"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-700 truncate">{file.name}</span>
          </div>
          <button 
            onClick={() => setFile(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {file && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload PDF
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
      {success && (
        <p className="text-xs text-green-600 font-medium text-center flex items-center justify-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Upload successful!
        </p>
      )}
    </div>
  );
}
