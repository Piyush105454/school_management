"use client";

import React, { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { createUnit } from "@/features/academy/actions/chapterActions";

interface AddUnitModalProps {
  subjectId: number;
  nextOrderNo: number;
}

export default function AddUnitModal({ subjectId, nextOrderNo }: AddUnitModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [orderNo, setOrderNo] = useState(nextOrderNo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Unit name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createUnit({ subjectId, name, orderNo });
    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
      setName("");
      setOrderNo(orderNo + 1);
    } else {
      setError(result.error || "Failed to add unit.");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Add Unit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Add New Unit</h2>
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
              
              <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl mb-2 space-y-2">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">No Unit Structure?</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">If this subject doesn't have units, you can skip this and add chapters directly.</p>
                <button
                  type="button"
                  onClick={async () => {
                    setIsSubmitting(true);
                    const res = await createUnit({ subjectId, name: "NA", orderNo: nextOrderNo });
                    setIsSubmitting(false);
                    if (res.success) setIsOpen(false);
                  }}
                  className="w-full py-2 bg-white border border-blue-200 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Skip Units (Add Chapters Directly)"}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                  Unit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Number System"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                  Order Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={orderNo}
                  onChange={(e) => setOrderNo(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-400">Order in which this unit appears.</p>
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
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
