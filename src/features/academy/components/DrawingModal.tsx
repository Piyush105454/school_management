"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { X, Save, Eraser, Trash2 } from "lucide-react";

// Dynamically import Excalidraw to prevent SSR issues
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

const exportToBlob = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.exportToBlob),
  { ssr: false }
);

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64Image: string, elements: any[]) => void;
  initialData?: any[];
}

export default function DrawingModal({ isOpen, onClose, onSave, initialData }: DrawingModalProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!excalidrawAPI) return;
    setIsSaving(true);
    
    try {
      const elements = excalidrawAPI.getSceneElements();
      if (!elements || elements.length === 0) {
        alert("Please draw something before saving.");
        setIsSaving(false);
        return;
      }

      // Convert drawing to a blob image with white background
      // Since it is dynamically imported, we must call it safely
      const { exportToBlob: exportFn } = await import("@excalidraw/excalidraw");
      
      const blob = await exportFn({
        elements,
        mimeType: "image/png",
        appState: {
          ...excalidrawAPI.getAppState(),
          exportWithDarkMode: false,
        },
        files: excalidrawAPI.getFiles(),
        exportPadding: 20,
      });

      if (blob) {
        // Convert Blob to Base64 String so we can insert it natively into Quill
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onSave(base64data, elements);
          onClose();
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error("Failed to save drawing:", error);
      alert("Failed to save drawing.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-2xl">🖌️</span> Diagram Whiteboard
            </h2>
            <p className="text-sm font-medium text-slate-500">Draw triangles, shapes, and formulas to insert into your lesson plan.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save & Insert</>}
            </button>
          </div>
        </div>

        {/* Excalidraw Canvas Area */}
        <div className="flex-1 w-full h-full relative bg-slate-50">
          <Excalidraw 
            initialData={{ elements: initialData || [] }}
            excalidrawAPI={(api) => setExcalidrawAPI(api)} 
            UIOptions={{
              canvasActions: {
                loadScene: false,
                export: false,
                saveToActiveFile: false,
                toggleTheme: false,
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
