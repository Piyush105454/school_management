"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { createInquiry } from "../actions/inquiryActions";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function InquiryForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    const result = await createInquiry(data);
    setLoading(false);
    
    if (result.success) {
      setSuccess(true);
      reset();
      router.refresh();
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 5000);
    } else {
      alert("Error: " + result.error);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
      <div className="bg-blue-600 p-6 text-white text-center">
        <h2 className="text-xl font-bold">Initial Inquiry Form</h2>
        <p className="opacity-80 text-sm mt-1">Fill this to start the admission process</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
        {success && (
          <div className="flex items-center gap-3 bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm font-semibold">Inquiry submitted successfully!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Student Name</label>
            <input 
              {...register("studentName", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="Full Name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Parent/Guardian Name</label>
            <input 
              {...register("parentName", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="Name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email Address</label>
            <input 
              {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Phone Number</label>
            <input 
              {...register("phone", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Applying for Class</label>
            <select 
              {...register("appliedClass", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
            >
              <option value="">Select Class</option>
              {["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Academic Year</label>
            <select 
              {...register("academicYear", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
            >
              <option value="2026-27">2026-2027</option>
              <option value="2027-28">2027-2028</option>
            </select>
          </div>
        </div>

        <button 
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
            <>
              Submit Inquiry <Send className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
