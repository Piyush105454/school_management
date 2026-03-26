"use client";

import React, { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createChapter } from "@/features/academy/actions/chapterActions";

interface AddChapterModalProps {
  unitId: number;
  nextOrderNo: number;
}

export default function AddChapterModal({ unitId, nextOrderNo }: AddChapterModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const [name, setName] = useState("");
  const [chapterNo, setChapterNo] = useState(nextOrderNo);
  const [pageStart, setPageStart] = useState("");
  const [pageEnd, setPageEnd] = useState("");
  const [orderNo, setOrderNo] = useState(nextOrderNo);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Chapter name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createChapter({ 
      unitId, 
      name, 
      chapterNo,
      pageStart: parseInt(pageStart) || 0,
      pageEnd: parseInt(pageEnd) || 0,
      orderNo 
    });
    
    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
      setName("");
      setChapterNo(chapterNo + 1);
      setOrderNo(orderNo + 1);
      setPageStart("");
      setPageEnd("");
    } else {
      setError(result.error || "Failed to add chapter.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 hover:text-slate-800 transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add Chapter
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-800">Add New Chapter</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                  Chapter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Knowing completely our numbers"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Chapter No.</label>
                  <input
                    type="number"
                    value={chapterNo}
                    onChange={(e) => setChapterNo(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Order No.</label>
                  <input
                    type="number"
                    value={orderNo}
                    onChange={(e) => setOrderNo(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Page Start</label>
                  <input
                    type="number"
                    value={pageStart}
                    onChange={(e) => setPageStart(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Page End</label>
                  <input
                    type="number"
                    value={pageEnd}
                    onChange={(e) => setPageEnd(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Chapter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
