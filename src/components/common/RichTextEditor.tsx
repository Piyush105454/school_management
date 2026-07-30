"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import "@excalidraw/excalidraw/index.css";
import DrawingModal from "@/features/academy/components/DrawingModal";
import { Palette, RotateCcw, RotateCw } from "lucide-react";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-400 animate-pulse flex items-center justify-center">
      Loading editor...
    </div>
  ),
});

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
  enableWhiteboard?: boolean;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
  history: {
    delay: 500,
    maxStack: 100,
    userOnly: true,
  },
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "blockquote",
  "code-block",
  "align",
  "link",
  "image",
];

export default function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Write your text here...",
  disabled = false,
  minHeight = "140px",
  className = "",
  enableWhiteboard = true,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUndo = () => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor?.history?.undo();
    }
  };

  const handleRedo = () => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor?.history?.redo();
    }
  };

  const handleSaveDrawing = (base64Img: string) => {
    const imgHtml = `<p><img src="${base64Img}" alt="Whiteboard Drawing" style="max-width:100%; height:auto; border-radius:12px; margin:10px 0; border:1px solid #e2e8f0;" /></p><p><br></p>`;
    onChange((value || "") + imgHtml);
  };

  const adjustTextarea = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
    }
  };

  if (!mounted) {
    return (
      <textarea
        id={id}
        value={value || ""}
        onChange={(e) => {
          adjustTextarea(e.currentTarget);
          onChange(e.target.value);
        }}
        ref={adjustTextarea}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 resize-none overflow-hidden"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={`rich-text-editor-wrapper w-full space-y-1.5 ${className}`}>
      {/* Top Helper Toolbar (Whiteboard Canvas & Undo/Redo) */}
      {!disabled && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-t-xl text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              title="Undo"
              className="p-1 hover:bg-white hover:text-blue-600 rounded transition-colors text-slate-600"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              title="Redo"
              className="p-1 hover:bg-white hover:text-blue-600 rounded transition-colors text-slate-600"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {enableWhiteboard && (
            <button
              type="button"
              onClick={() => setIsDrawingModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg text-[11px] font-bold transition-all shadow-2xs"
            >
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              <span>Draw Whiteboard / Diagram</span>
            </button>
          )}
        </div>
      )}

      <style jsx global>{`
        .rich-text-editor-wrapper .ql-container.ql-snow {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: #cbd5e1;
          font-family: inherit;
          font-size: 0.875rem;
          min-height: ${minHeight};
          height: auto !important;
        }
        .rich-text-editor-wrapper .ql-editor {
          min-height: ${minHeight};
          height: auto !important;
          overflow-y: visible !important;
          line-height: 1.6;
        }
        .rich-text-editor-wrapper .ql-editor a {
          color: #2563eb !important;
          text-decoration: underline !important;
          font-weight: 600 !important;
        }
        .rich-text-editor-wrapper .ql-toolbar.ql-snow {
          border-top-left-radius: ${disabled ? "0.75rem" : "0px"};
          border-top-right-radius: ${disabled ? "0.75rem" : "0px"};
          border-color: #cbd5e1;
          background-color: #f8fafc;
          padding: 6px 8px;
        }
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .rich-text-editor-wrapper .ql-toolbar button:hover,
        .rich-text-editor-wrapper .ql-toolbar button.ql-active {
          color: #2563eb !important;
        }
        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-stroke {
          stroke: #2563eb !important;
        }
        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-fill,
        .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-fill {
          fill: #2563eb !important;
        }
      `}</style>

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
      />

      {enableWhiteboard && (
        <DrawingModal
          isOpen={isDrawingModalOpen}
          onClose={() => setIsDrawingModalOpen(false)}
          onSave={handleSaveDrawing}
        />
      )}
    </div>
  );
}
