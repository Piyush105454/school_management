"use client";

import React, { useState } from "react";
import imageCompression from "browser-image-compression";
import { Upload, CheckCircle, Loader2, FileText, AlertCircle, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDirectUploadUrl } from "../actions/admissionActions";
import { compressPdf } from "@/lib/pdf-service";

interface SmartUploaderProps {
  admissionId: string;
  fieldName: string;
  label: string;
  hindiLabel?: string;
  initialUrl?: string | null;
  category?: string;
  onUploadComplete: (url: string) => void;
  onDelete?: () => void;
  accept?: string;
  maxSizeMB?: number; // Target size for compression (default 0.5 MB)
}

export function SmartUploader({
  admissionId,
  fieldName,
  label,
  hindiLabel,
  initialUrl,
  category = "student-documents",
  onUploadComplete,
  onDelete,
  accept = "image/*,application/pdf",
  maxSizeMB = 0.5
}: SmartUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "compressing" | "uploading" | "success" | "error">("idle");
  const [compressionStatus, setCompressionStatus] = useState<string>("COMPRESSING...");
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(initialUrl || null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setStatus("compressing");

    try {
      let finalFile = selectedFile;
      const limitBytes = maxSizeMB * 1024 * 1024;

      // 1. Compression logic
      // Only compress if the file is OVER the limit
      if (selectedFile.size > limitBytes) {
        if (selectedFile.type.startsWith("image/")) {
          setCompressionStatus("SHRINKING...");
          const options = {
            maxSizeMB: maxSizeMB,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedBlob = await imageCompression(selectedFile, options);
          finalFile = new File([compressedBlob], selectedFile.name, { type: selectedFile.type });
        } else if (selectedFile.type === "application/pdf") {
          setCompressionStatus("OPTIMIZING PDF...");
          try {
             finalFile = await compressPdf(selectedFile, maxSizeMB);
          } catch (e: any) {
             console.error("PDF compression failed:", e);
             setError(`PDF Optimization Failed: ${e.message || "File too complex"}`);
             setStatus("error");
             setUploading(false);
             return; // Stop the upload if compression failed but was required
          }
        }
      }
      
      setCompressedSize(finalFile.size);

      // 2. Get Presigned URL
      setStatus("uploading");
      setUploading(true);
      const res = await getDirectUploadUrl(admissionId, selectedFile.name, finalFile.type, category);
      
      if (!res.success || !res.uploadUrl) {
        throw new Error(res.error || "Failed to get upload permission");
      }

      // 3. Direct S3 Upload (PUT)
      // We use XHR to track progress as fetch doesn't support it easily for uploads yet
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", res.uploadUrl!);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) resolve(true);
          else reject(new Error(`S3 Upload failed with status ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error("Network error during S3 upload"));
        
        xhr.setRequestHeader("Content-Type", finalFile.type);
        xhr.send(finalFile);
      });

      // 4. Success handling
      setStatus("success");
      setCurrentUrl(res.previewUrl!);
      onUploadComplete(res.publicUrl!);
    } catch (err: any) {
      console.error("Upload process failed:", err);
      setError(err.message || "An unexpected error occurred during upload.");
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  const isExisting = currentUrl && currentUrl !== "__EXISTING__";

  return (
    <div className="group relative overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 md:p-6 transition-all duration-300 hover:border-slate-300 hover:bg-slate-100/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Label and Info */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-800 font-outfit uppercase tracking-tight text-sm md:text-base">
              {label}
            </h4>
            {isExisting && <CheckCircle className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-500" />}
          </div>
          {hindiLabel && <p className="text-xs text-slate-500 font-hindi">{hindiLabel}</p>}
          
          {/* Size Preview */}
          {status !== "idle" && originalSize && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-tight border border-slate-200">
                Source: {formatSize(originalSize)}
              </span>
              {compressedSize && compressedSize < originalSize ? (
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-tight border border-emerald-100 flex items-center gap-1 animate-pulse">
                  Fixed: {formatSize(compressedSize)} (-{Math.round((1 - compressedSize/originalSize) * 100)}%)
                </span>
              ) : compressedSize && compressedSize > (maxSizeMB * 1024 * 1024) ? (
                <span className="text-[10px] font-black bg-red-50 text-red-600 px-2.5 py-1 rounded-full uppercase tracking-tight border border-red-100 flex items-center gap-1">
                  <AlertCircle size={10} /> Over Limit
                </span>
              ) : (
                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full uppercase tracking-tight border border-blue-100 flex items-center gap-1">
                  <Star size={10} fill="currentColor" /> Perfect Quality
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {isExisting ? (
            <div className="flex items-center gap-2">
              <a 
                href={`/api/view-doc?id=${admissionId}&field=${fieldName}&type=${
                  category === "student-documents" ? "standard" : 
                  category === "entrance-tests" ? "test" : 
                  category === "home-visits" ? "visit" : "standard"
                }`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                id={`view-doc-${fieldName}`}
              >
                <FileText className="w-4 h-4" />
                View
              </a>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentUrl(null);
                    setStatus("idle");
                    onDelete();
                  }}
                  className="p-2 bg-white text-rose-500 rounded-xl hover:bg-rose-50 border border-slate-200 shadow-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <label className={cn(
              "relative flex items-center justify-center gap-2 cursor-pointer transition-all duration-300",
              "bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black tracking-tight uppercase shadow-lg shadow-slate-900/10",
              "hover:scale-[1.02] active:scale-95",
              uploading && "opacity-50 cursor-not-allowed pointer-events-none"
            )}>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileSelect} 
                accept={accept}
                disabled={uploading}
              />
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {status === "compressing" ? "Shrinking..." : `Uploading ${progress}%`}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Select File
                </>
              )}
            </label>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-semibold animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Progress Bar (Global for the component) */}
      {uploading && progress > 0 && progress < 100 && (
        <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${progress}%` }} />
      )}
    </div>
  );
}
