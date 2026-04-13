"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Layers, Plus, Trash2, Loader2, AlertCircle, Edit2, MoreVertical } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createSubject, deleteSubject } from "@/features/academy/actions/subjectActions";
import { updateSubject } from "@/features/academy/actions/academyActions";
import { useRouter } from "next/navigation";
import { ActionDropdown } from "@/components/ui/ActionDropdown";

interface Subject {
  id: number;
  classId: number;
  name: string;
  bookName?: string | null;
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    bookName: "",
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
      bookName: formData.bookName.trim(),
      medium: formData.medium
    });
    
    setIsSubmitting(false);
    
    if (result.success) {
      setIsModalOpen(false);
      setFormData({ name: "", bookName: "", medium: "English/Hindi" });
      router.refresh();
    } else {
      setError(result.error || "Failed to add subject.");
    }
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject || !formData.name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    
    const result = await updateSubject(currentSubject.id, {
      name: formData.name.trim(),
      bookName: formData.bookName.trim(),
      medium: formData.medium
    });
    
    setIsSubmitting(false);
    
    if (result.success) {
      setIsEditModalOpen(false);
      setCurrentSubject(null);
      setFormData({ name: "", bookName: "", medium: "English/Hindi" });
      router.refresh();
    } else {
      setError(result.error || "Failed to update subject.");
    }
  };

  const openEditModal = (subject: Subject) => {
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      bookName: subject.bookName || "",
      medium: subject.medium
    });
    setIsEditModalOpen(true);
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
          onClick={() => {
            setFormData({ name: "", bookName: "", medium: "English/Hindi" });
            setIsModalOpen(true);
          }}
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
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Subject Name</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Book Name</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Medium</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Content Management</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {initialSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {subject.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-slate-600 font-medium italic">
                        {subject.bookName || "—"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-50 shadow-sm">
                        {subject.medium}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <Link 
                        href={`/office/academy-management/classes/${classNameParam}/subjects/${subject.id}`}
                        className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all group active:scale-95"
                      >
                        <Layers className="h-3.5 w-3.5 text-blue-500 group-hover:text-white transition-colors" />
                        Units & Chapters
                      </Link>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <ActionDropdown 
                        actions={[
                          {
                            label: "Edit Subject",
                            icon: <Edit2 className="h-4 w-4" />,
                            onClick: () => openEditModal(subject)
                          },
                          {
                            label: isDeleting === subject.id ? "Deleting..." : "Delete Subject",
                            icon: isDeleting === subject.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />,
                            variant: "danger",
                            onClick: () => handleDelete(subject.id, subject.name)
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
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
        <form onSubmit={handleAddSubject} className="space-y-5 p-1">
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
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Book Name</label>
            <input
              type="text"
              placeholder="e.g. NCERT Math, RS Aggarwal"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-300"
              value={formData.bookName}
              onChange={(e) => setFormData({ ...formData, bookName: e.target.value })}
              disabled={isSubmitting}
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

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsEditModalOpen(false);
            setError(null);
          }
        }}
        title="Edit Subject"
      >
        <form onSubmit={handleEditSubject} className="space-y-5 p-1">
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
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Book Name</label>
            <input
              type="text"
              placeholder="e.g. NCERT Math, RS Aggarwal"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-300"
              value={formData.bookName}
              onChange={(e) => setFormData({ ...formData, bookName: e.target.value })}
              disabled={isSubmitting}
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
              onClick={() => setIsEditModalOpen(false)}
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
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Edit2 size={16} />}
              {isSubmitting ? "Updating..." : "Update Subject"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
