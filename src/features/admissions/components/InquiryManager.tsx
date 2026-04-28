"use client";

import React, { useState } from "react";
import { InquiriesList } from "@/features/admissions/components/InquiriesList";
import { InquiryForm } from "@/features/admissions/components/InquiryForm";
import { Modal } from "@/components/ui/Modal";
import { Plus, Upload } from "lucide-react";
import { BulkImportButton } from "./BulkImportButton";

export function InquiryManager({ 
  allInquiries,
  role
}: { 
  allInquiries: any[],
  role?: string
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isTeacher = role === "TEACHER";

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Inquiry Management</h1>
          <p className="text-slate-500 font-medium">Manage and track new student leads.</p>
        </div>
        {!isTeacher && (
          <div className="flex flex-wrap gap-3">
            <BulkImportButton />
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              <Plus className="h-5 w-5" /> Add Manual Inquiry
            </button>
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <InquiriesList 
          initialInquiries={allInquiries} 
          role={role}
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add Manual Inquiry"
      >
        <InquiryForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
