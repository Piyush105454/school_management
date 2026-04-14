"use client";

import React, { useState } from "react";
import { Edit2, Loader2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { updateUnit, deleteUnit } from "@/features/academy/actions/academyActions";
import { useRouter } from "next/navigation";

interface EditUnitModalProps {
  unitId: number;
  initialName: string;
  showTrigger?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function EditUnitModal({ 
  unitId, 
  initialName, 
  showTrigger = true,
  isOpen: externalIsOpen,
  onClose: externalOnClose
}: EditUnitModalProps) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose || setInternalIsOpen;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    
    const result = await updateUnit(unitId, { name: name.trim() });
    
    setIsSubmitting(false);
    
    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setError(result.error || "Failed to update unit.");
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this unit and all its chapters?")) {
      setIsSubmitting(true);
      const result = await deleteUnit(unitId);
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
      {showTrigger && (
        <button
          onClick={() => (setIsOpen as any)(true)}
          className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-blue-600 shadow-sm border border-transparent hover:border-blue-100"
          title="Edit Unit"
        >
          <Edit2 className="h-4 w-4" />
        </button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => !isSubmitting && (setIsOpen as any)(false)}
        title="Edit Unit"
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Unit Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Unit 1: Introduction"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all text-xs uppercase tracking-wider"
              disabled={isSubmitting}
            >
              Delete
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => (setIsOpen as any)(false)}
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
