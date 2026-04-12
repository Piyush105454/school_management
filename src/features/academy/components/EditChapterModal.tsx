"use client";

import React, { useState } from "react";
import { Edit2, Loader2, AlertCircle, Trash2, Move } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { updateChapter, deleteChapter, moveChapter } from "@/features/academy/actions/academyActions";
import { useRouter } from "next/navigation";

interface Chapter {
  id: number;
  unitId: number;
  name: string;
  chapterNo: number;
  pageStart: number;
  pageEnd: number;
}

interface Unit {
  id: number;
  name: string;
}

interface EditChapterModalProps {
  chapter: Chapter;
  availableUnits: Unit[];
}

export default function EditChapterModal({ chapter, availableUnits }: EditChapterModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: chapter.name,
    chapterNo: chapter.chapterNo,
    pageStart: chapter.pageStart,
    pageEnd: chapter.pageEnd,
    unitId: chapter.unitId
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // If unit changed, call moveChapter
      if (formData.unitId !== chapter.unitId) {
        const moveResult = await moveChapter(chapter.id, formData.unitId);
        if (!moveResult.success) throw new Error(moveResult.error);
      }

      // Update other details
      const updateResult = await updateChapter(chapter.id, {
        name: formData.name,
        chapterNo: formData.chapterNo,
        pageStart: formData.pageStart,
        pageEnd: formData.pageEnd
      });
      
      if (!updateResult.success) throw new Error(updateResult.error);

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete chapter "${chapter.name}"?`)) {
      setIsSubmitting(true);
      const result = await deleteChapter(chapter.id);
      setIsSubmitting(false);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert("Error: " + result.error);
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 hover:border-blue-100 group"
        title="Edit Chapter"
      >
        <Edit2 className="h-4.5 w-4.5 group-hover:rotate-12 transition-transform" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => !isSubmitting && setIsOpen(false)}
        title="Edit Chapter"
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Chapter Name</label>
              <input
                type="text"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Chapter No.</label>
              <input
                type="number"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                value={formData.chapterNo}
                onChange={(e) => setFormData({ ...formData, chapterNo: parseInt(e.target.value) })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Assign to Unit</label>
              <div className="relative">
                <Move className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 appearance-none cursor-pointer"
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: parseInt(e.target.value) })}
                  disabled={isSubmitting}
                >
                  {availableUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name === "NA" ? "Direct Chapters" : unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Page Start</label>
              <input
                type="number"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                value={formData.pageStart}
                onChange={(e) => setFormData({ ...formData, pageStart: parseInt(e.target.value) })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Page End</label>
              <input
                type="number"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                value={formData.pageEnd}
                onChange={(e) => setFormData({ ...formData, pageEnd: parseInt(e.target.value) })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <Trash2 size={16} />
              Delete
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-wider"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Edit2 size={16} />}
              Update
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
