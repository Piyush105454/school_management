"use client";

import React, { useState } from "react";
import imageCompression from "browser-image-compression";
import { Upload, CheckCircle, Loader2, FileText, AlertCircle, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDirectUploadUrl } from "../actions/admissionActions";
import { compressPdf } from "@/lib/pdf-service";
import { ensureCompressed } from "@/lib/compression";

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

    // Strict validation for PDF-only fields
    if (accept === "application/pdf" && !selectedFile.type.includes("pdf")) {
      setError("Invalid format: Please upload a PDF for this document (e.g. Birth Certificate, Marksheet).");
      setStatus("idle");
      return;
    }

    setError(null);
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setStatus("compressing");

    try {
      setCompressionStatus("OPTIMIZING...");
      const finalFile = await ensureCompressed(selectedFile, maxSizeMB);
      setCompressedSize(finalFile.size);
      
      console.log(`[Uploader] Metadata: Name=${finalFile.name}, Type=${finalFile.type}, Size=${(finalFile.size/1024/1024).toFixed(2)}MB`);

      // 1.5. Memory Cooldown (Critical for mobile stability after heavy PDF compression)
      await new Promise(r => setTimeout(r, 400));

      // 2. Get Presigned URL
      setStatus("uploading");
      setUploading(true);
      const res = await getDirectUploadUrl(admissionId, selectedFile.name, finalFile.type, category);
      
      if (!res.success || !res.uploadUrl) {
        throw new Error(res.error || "Failed to get upload permission");
      }

      // 3. Direct S3 Upload (PUT)
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
          if (xhr.status === 200) {
            resolve(true);
          } else {
            console.error(`[S3 Error] Status: ${xhr.status}, Response: ${xhr.responseText}`);
            reject(new Error(`S3 Upload failed with status ${xhr.status}. Please check your connection.`));
          }
        };

        xhr.onerror = () => {
          console.error(`[S3 Network Error] XHR State: ${xhr.readyState}, Status: ${xhr.status}`);
          reject(new Error("Network error during S3 upload. If you are on an unstable mobile connection, please try again or use Wi-Fi."));
        };
        
        xhr.setRequestHeader("Content-Type", finalFile.type || "application/octet-stream");
        xhr.send(finalFile);
      });

      // 4. Success handling
      setStatus("success");
      setCurrentUrl(res.previewUrl!);
      onUploadComplete(res.publicUrl!);
    } catch (err: any) {
      console.error("Upload process failed:", err);
      // More descriptive error for mobile users
      let userError = err.message || "An unexpected error occurred during upload.";
      if (userError.includes("Failed to fetch") || userError.includes("Network error")) {
        userError = "Connection Error: Please check your mobile battery saver or data connection and try again.";
      }
      setError(userError);
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  const isExisting = currentUrl && currentUrl !== "__EXISTING__";

  return (
    <div className="group relative overflow-hidden bg-white border-2 border-dashed border-slate-200 rounded-[28px] p-5 md:p-6 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        
        {/* Label and Info */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
              isExisting ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-slate-50 border-slate-100 text-slate-400"
            )}>
              {category === "home-visits" ? <FileText size={20} /> : <Upload size={20} />}
            </div>
            <div className="min-w-0">
               <h4 className="font-black text-slate-900 font-outfit uppercase tracking-tight text-sm md:text-base truncate">
                 {label}
               </h4>
               <div className="flex flex-wrap items-center gap-2">
                 {hindiLabel && <p className="text-[10px] text-slate-400 font-hindi truncate font-medium">{hindiLabel}</p>}
                 {accept === "application/pdf" && !isExisting && (
                   <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-amber-100 shadow-sm animate-pulse">
                     <AlertCircle size={10} /> PDF ONLY
                   </span>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* Action Buttons & Thumbnail */}
        <div className="flex items-center gap-4 shrink-0">
          {isExisting ? (
            <div className="flex flex-wrap items-center gap-4">
              {/* Large Thumbnail Preview */}
              {currentUrl && (currentUrl.includes("image") || currentUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) || currentUrl.startsWith('data:image')) && (
                 <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-white shrink-0 group-hover:scale-110 transition-transform duration-500">
                    <img 
                      src={currentUrl} 
                      alt="Thumbnail" 
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                 </div>
              )}
              
              <div className="flex items-center gap-2">
                <a 
                  href={`/api/view-doc?id=${admissionId}&field=${fieldName}&type=${
                    category === "student-documents" ? "standard" : 
                    category === "entrance-tests" ? "test" : 
                    category === "home-visits" ? "visit" : "standard"
                  }&v=${Date.now()}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95 shrink-0"
                  id={`view-doc-${fieldName}`}
                >
                  <FileText className="w-4 h-4" />
                  View
                </a>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this file?")) {
                        setCurrentUrl(null);
                        setStatus("idle");
                        onDelete();
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-3.5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all active:scale-95 shrink-0 border border-rose-100 font-black text-[10px] uppercase tracking-widest"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ) : (
            <label className={cn(
              "relative flex items-center justify-center gap-3 cursor-pointer transition-all duration-300",
              "bg-blue-600 text-white px-8 py-4 rounded-2xl text-[11px] font-black tracking-widest uppercase shadow-xl shadow-blue-600/25",
              "hover:bg-blue-700 hover:scale-[1.02] active:scale-95",
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
