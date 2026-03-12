import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InquiriesList } from "@/features/admissions/components/InquiriesList";
import { AdmissionProcessList } from "@/features/admissions/components/AdmissionProcessList";
import { InquiryForm } from "@/features/admissions/components/InquiryForm";
import { Modal } from "@/components/ui/Modal";
import { Plus, ListFilter, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function InquiriesManagementClient({ 
  allInquiries, 
  allAdmissions 
}: { 
  allInquiries: any[], 
  allAdmissions: any[] 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  const activeTab = (tabParam === "admissions") ? "admissions" : "inquiries";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const setActiveTab = (tab: "inquiries" | "admissions") => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`/office/inquiries?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Management</h1>
          <p className="text-slate-500 font-medium">Manage leads and student admission progress.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
        >
          <Plus className="h-5 w-5" /> Add Manual Inquiry
        </button>
      </div>

      <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab("inquiries")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm",
            activeTab === "inquiries" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <ListFilter size={18} /> Inquiries ({allInquiries.length})
        </button>
        <button 
          onClick={() => setActiveTab("admissions")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm",
            activeTab === "admissions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <PlayCircle size={18} /> Admission Progress ({allAdmissions.length})
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "inquiries" ? (
          <InquiriesList initialInquiries={allInquiries} />
        ) : (
          <AdmissionProcessList admissions={allAdmissions} />
        )}
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
