"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VerifyDocumentButton({ admissionId, isVerified }: { admissionId: string, isVerified?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (!confirm("Are you sure you want to verify this document?")) return;
    setLoading(true);
    
    // Import the action dynamically to preserve Client component constraints securely accurately.
    const { verifyAdmission } = await import("@/features/admissions/actions/admissionActions");
    const res = await verifyAdmission(admissionId);
    setLoading(false);

    if (res.success) {
      alert("Verified successfully!");
      router.refresh();
    } else {
      alert("Error: " + res.error);
    }
  };

  if (isVerified) {
    return (
      <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 border border-emerald-100">
        <CheckCircle2 size={14} /> Verified
      </span>
    );
  }

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
    >
      {loading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
      Verify
    </button>
  );
}
