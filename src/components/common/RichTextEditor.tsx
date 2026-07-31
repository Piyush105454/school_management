"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

// ─── Image Toolbar (shown on click) ───────────────────────────────────────────
interface ImageToolbarProps {
  target: HTMLImageElement;
  onClose: () => void;
}

function ImageToolbar({ target, onClose }: ImageToolbarProps) {
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const [width, setWidth] = React.useState(() => target.offsetWidth || 300);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // Position toolbar above the image
  React.useEffect(() => {
    const rect = target.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    setPos({ top: rect.top + scrollTop - 52, left: rect.left });
    setWidth(target.offsetWidth || 300);
  }, [target]);

  // Close when clicking outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node) &&
        e.target !== target
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [target, onClose]);

  const applyWidth = (w: number) => {
    const clamped = Math.max(40, Math.min(w, 1200));
    setWidth(clamped);
    target.style.width = `${clamped}px`;
    target.style.height = "auto";
  };

  const setFloat = (f: string) => {
    target.style.float = f;
    if (f === "none") {
      target.style.display = "block";
      target.style.margin = "10px auto";
    } else if (f === "left") {
      target.style.display = "";
      target.style.margin = "4px 14px 4px 0";
    } else {
      target.style.display = "";
      target.style.margin = "4px 0 4px 14px";
    }
  };

  const btnClass = "px-2.5 py-1 text-[11px] font-bold rounded-lg hover:bg-blue-100 text-slate-700 hover:text-blue-700 transition-colors border border-slate-200 hover:border-blue-300";
  const sepClass = "w-px h-5 bg-slate-200 mx-1";
  const floatActive = (f: string) =>
    (target.style.float === f || (!target.style.float && f === "none"))
      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white"
      : "";

  return (
    <div
      ref={toolbarRef}
      style={{ position: "absolute", top: pos.top, left: Math.max(0, pos.left), zIndex: 9999 }}
      className="image-toolbar-popup flex items-center gap-1 bg-white border border-slate-300 rounded-xl shadow-2xl px-3 py-1.5"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Pixel size control */}
      <span className="text-[10px] font-black text-slate-400 uppercase mr-0.5">W</span>
      <button 
        type="button" 
        className={btnClass} 
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); applyWidth(width - 10); }}
      >
        −
      </button>
      <input
        type="number"
        value={width}
        min={40} max={1200}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => applyWidth(Number(e.target.value))}
        className="w-16 text-center text-xs font-bold border border-slate-300 rounded-lg py-0.5 outline-none focus:ring-2 focus:ring-blue-400"
      />
      <span className="text-[10px] text-slate-400">px</span>
      <button 
        type="button" 
        className={btnClass} 
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); applyWidth(width + 10); }}
      >
        +
      </button>

      <div className={sepClass} />

      {/* Float / text-wrap alignment */}
      <span className="text-[10px] font-black text-slate-400 uppercase mr-0.5">Wrap</span>
      <button 
        type="button" 
        className={`${btnClass} ${floatActive("left")}`} 
        title="Image left, text wraps right" 
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFloat("left"); }}
      >
        ⬅ Left
      </button>
      <button 
        type="button" 
        className={`${btnClass} ${floatActive("none")}`} 
        title="Center, no wrap" 
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFloat("none"); }}
      >
        Center
      </button>
      <button 
        type="button" 
        className={`${btnClass} ${floatActive("right")}`} 
        title="Image right, text wraps left" 
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFloat("right"); }}
      >
        Right ➡
      </button>

      <div className={sepClass} />

      {/* Delete */}
      <button
        type="button"
        className="px-2 py-1 text-[11px] font-bold rounded-lg hover:bg-rose-100 text-rose-500 transition-colors border border-transparent hover:border-rose-200"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); target.remove(); onClose(); }}
      >
        🗑
      </button>
    </div>
  );
}

// ─── Resize Handle (drag corner to resize) ────────────────────────────────────
function attachResizeHandle(img: HTMLImageElement) {
  // Avoid duplicate handles
  if (img.dataset.resizable === "1") return;
  img.dataset.resizable = "1";

  img.style.cursor = "pointer";
  img.style.maxWidth = "100%";
  img.style.boxSizing = "border-box";

  let startX = 0;
  let startW = 0;

  const onMouseMove = (e: MouseEvent) => {
    const newW = Math.max(40, startW + (e.clientX - startX));
    img.style.width = `${newW}px`;
    img.style.height = "auto";
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  // Drag from right edge
  img.addEventListener("mousedown", (e) => {
    const rect = img.getBoundingClientRect();
    const nearRightEdge = e.clientX > rect.right - 14;
    const nearBottomEdge = e.clientY > rect.bottom - 14;
    if (nearRightEdge || nearBottomEdge) {
      e.preventDefault();
      startX = e.clientX;
      startW = img.offsetWidth;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
  });
}

// ─── Main Editor ───────────────────────────────────────────────────────────────
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
  "header", "bold", "italic", "underline", "strike",
  "color", "background", "list", "blockquote", "code-block",
  "align", "link", "image",
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
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const quillRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Attach click + resize listeners to all images inside the editor
  const initImages = useCallback(() => {
    if (!editorContainerRef.current) return;
    const imgs = editorContainerRef.current.querySelectorAll<HTMLImageElement>(".ql-editor img");
    imgs.forEach((img) => {
      attachResizeHandle(img);
      // Show toolbar on click
      img.onclick = (e) => {
        e.stopPropagation();
        setSelectedImage(img);
      };
    });
  }, []);

  // Close image toolbar on editor click (not on image, and not inside the toolbar)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // If clicking an image, let the image's own click handler handle it
      if (e.target instanceof HTMLImageElement) {
        return;
      }
      // Find the toolbar element by class or ref
      const toolbar = document.querySelector(".image-toolbar-popup");
      if (toolbar && toolbar.contains(e.target as Node)) {
        return; // Clicked inside the toolbar, don't close it!
      }
      setSelectedImage(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Re-init images after every content change (new images may have been inserted)
  useEffect(() => {
    if (mounted) {
      const t = setTimeout(initImages, 80);
      return () => clearTimeout(t);
    }
  }, [value, mounted, initImages]);

  const getQuillEditor = () => quillRef.current?.getEditor?.() ?? null;

  const handleUndo = () => getQuillEditor()?.history?.undo();
  const handleRedo = () => getQuillEditor()?.history?.redo();

  // ✅ Insert whiteboard image AT CURSOR POSITION (not at end)
  const handleSaveDrawing = (base64Img: string) => {
    const editor = getQuillEditor();
    if (!editor) {
      onChange((value || "") + `<p><img src="${base64Img}" alt="Whiteboard Drawing" style="max-width:100%;height:auto;border-radius:12px;margin:10px 0;border:1px solid #e2e8f0;" /></p><p><br></p>`);
      return;
    }
    const range = editor.getSelection(true) ?? { index: editor.getLength(), length: 0 };
    editor.insertEmbed(range.index, "image", base64Img);
    editor.setSelection(range.index + 1, 0);
    // Apply default style via DOM after short delay
    setTimeout(() => {
      const imgs = editor.root.querySelectorAll<HTMLImageElement>("img");
      const last = imgs[imgs.length - 1];
      if (last) {
        last.style.maxWidth = "100%";
        last.style.height = "auto";
        last.style.borderRadius = "12px";
        last.style.margin = "10px 0";
        last.style.border = "1px solid #e2e8f0";
      }
      initImages();
    }, 50);
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
        onChange={(e) => { adjustTextarea(e.currentTarget); onChange(e.target.value); }}
        ref={adjustTextarea}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 resize-none overflow-hidden"
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={`rich-text-editor-wrapper w-full space-y-1.5 ${className}`} ref={editorContainerRef}>
      {/* Top Helper Toolbar */}
      {!disabled && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-t-xl text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleUndo} title="Undo" className="p-1 hover:bg-white hover:text-blue-600 rounded transition-colors text-slate-600">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={handleRedo} title="Redo" className="p-1 hover:bg-white hover:text-blue-600 rounded transition-colors text-slate-600">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-slate-400 ml-1">Click image → resize corner or use toolbar above it</span>
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
          line-height: 1.7;
        }
        /* DOCX-like image behaviour */
        .rich-text-editor-wrapper .ql-editor img {
          cursor: pointer;
          max-width: 100%;
          height: auto;
          display: inline;
          border-radius: 6px;
          border: 2px solid transparent;
          transition: border-color 0.15s;
          box-sizing: border-box;
          vertical-align: middle;
        }
        .rich-text-editor-wrapper .ql-editor img:hover {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        /* Float helpers — text flows BESIDE floated image across subsequent paragraphs */
        .rich-text-editor-wrapper .ql-editor img[style*="float: left"],
        .rich-text-editor-wrapper .ql-editor img[style*="float:left"] {
          float: left !important;
          margin: 4px 14px 4px 0 !important;
        }
        .rich-text-editor-wrapper .ql-editor img[style*="float: right"],
        .rich-text-editor-wrapper .ql-editor img[style*="float:right"] {
          float: right !important;
          margin: 4px 0 4px 14px !important;
        }
        /* ✅ NO p::after clearfix — that was clearing the float every paragraph.
           Instead, only clear after the full editor content */
        .rich-text-editor-wrapper .ql-editor::after {
          content: '';
          display: table;
          clear: both;
        }
        /* Prevent paragraphs from creating new block formatting context */
        .rich-text-editor-wrapper .ql-editor p {
          overflow: visible !important;
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

      {/* Floating image toolbar */}
      {selectedImage && (
        <ImageToolbar
          target={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

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
