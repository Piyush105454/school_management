"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Layers, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createSubject, deleteSubject } from "@/features/academy/actions/subjectActions";
import { useRouter } from "next/navigation";

interface Subject {
  id: number;
  classId: number;
  name: string;
  medium: string;
}

interface SubjectManagementProps {
  classId: number;
  classNameParam: string;
  dbClassName: string;
  initialSubjects: Subject[];
}

export default function SubjectManagement({ 
  classId, 
  classNameParam, 
  dbClassName,
  initialSubjects 
}: SubjectManagementProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    medium: "English/Hindi"
  });

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    
    const result = await createSubject({
      classId,
      name: formData.name.trim(),
      medium: formData.medium
    });
    
    setIsSubmitting(false);
    
    if (result.success) {
      setIsModalOpen(false);
      setFormData({ name: "", medium: "English/Hindi" });
      router.refresh();
    } else {
      setError(result.error || "Failed to add subject.");
    }
  };

  const handleDelete = async (subjectId: number, subjectName: string) => {
    if (confirm(`Are you sure you want to delete "${subjectName}"? This will also delete all units and chapters associated with it.`)) {
      setIsDeleting(subjectId);
      const result = await deleteSubject(subjectId);
      setIsDeleting(null);
      
      if (result.success) {
        router.refresh();
      } else {
        alert("Error deleting subject: " + result.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-xs uppercase tracking-wider"
        >
          <Plus size={16} />
          Add Subject
        </button>
      </div>

      {initialSubjects.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[300px] shadow-sm">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-blue-500/5">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h2 className="text-xl font-bold text-slate-800">No Subjects Found</h2>
            <p className="text-sm text-slate-500">
              There are no subjects defined for {dbClassName} yet. Click the button above to add one.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialSubjects.map((subject) => (
            <div key={subject.id} className="group bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between gap-4 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                  onClick={() => handleDelete(subject.id, subject.name)}
                  disabled={isDeleting === subject.id}
                  className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                  title="Delete Subject"
                 >
                   {isDeleting === subject.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                 </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-50">
                  {subject.medium}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                  {subject.name}
                </h2>
              </div>

              <div className="pt-2">
                <Link 
                  href={`/office/academy-management/classes/${classNameParam}/subjects/${subject.id}`}
                  className="w-full text-center px-4 py-3.5 bg-slate-50 text-slate-700 font-bold rounded-2xl hover:bg-blue-600 hover:text-white transition-all text-[11px] uppercase tracking-widest flex items-center justify-between group border border-slate-100/50"
                >
                  <span className="flex items-center gap-2.5">
                    <Layers className="h-4 w-4 text-blue-500 group-hover:text-blue-100 transition-colors" />
                    View Units & Chapters
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-100 transition-colors" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsModalOpen(false);
            setError(null);
          }
        }}
        title="Add New Subject"
      >
        <form onSubmit={handleAddSubject} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mathematics, Science"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-300"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Medium</label>
            <select
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 appearance-none cursor-pointer"
              value={formData.medium}
              onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
              disabled={isSubmitting}
            >
              <option value="English/Hindi">English/Hindi</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
             <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-wider"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {isSubmitting ? "Adding..." : "Add Subject"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
