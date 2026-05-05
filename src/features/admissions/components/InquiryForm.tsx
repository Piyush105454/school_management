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
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const selectedSchool = watch("school");

  const onSubmit = async (data: any) => {
    setLoading(true);
    const result = await createInquiry(data) as any;
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

  const getClassesBySchool = (school: string) => {
    if (school === "Dhanpuri Public School") {
      return ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    } else if (school === "WES Academy") {
      return ["5", "6", "7", "8", "9", "10", "Senior 1st Year", "Senior 2nd Year", "Senior 3rd Year", "Senior 4th Year"];
    }
    return [];
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
            <label className="text-sm font-semibold text-slate-700">First Name</label>
            <input 
              {...register("firstName", { required: "First Name is required" })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="First Name"
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Last Name</label>
            <input 
              {...register("lastName", { required: "Last Name is required" })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="Last Name"
            />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Parent/Guardian Name</label>
            <input 
              {...register("parentName", { required: "Parent Name is required" })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="Name"
            />
            {errors.parentName && <p className="text-xs text-red-500 mt-1">{errors.parentName.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email Address</label>
            <input 
              {...register("email", { 
                required: "Email is required", 
                pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } 
              })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Phone Number</label>
            <input 
              {...register("phone", { 
                required: "Phone is required",
                pattern: { value: /^\d{10}$/, message: "Must be 10 digits" }
              })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="10 digit mobile number"
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Aadhaar Card Number</label>
            <input 
              {...register("aadhaarNumber", { 
                required: "Aadhaar is required", 
                pattern: { value: /^\d{12}$/, message: "Must be 12 digits" } 
              })}
              maxLength={12}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="12 digit Aadhaar number"
            />
            {errors.aadhaarNumber && <p className="text-xs text-red-500 mt-1">{errors.aadhaarNumber.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Create Password</label>
            <input 
              type="password"
              {...register("password", { 
                required: "Password is required", 
                minLength: { value: 6, message: "Min 6 characters" } 
              })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message as string}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Select Institute</label>
            <select 
              {...register("school", { required: "Please select an institute" })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
            >
              <option value="">Select Institute</option>
              <option value="Dhanpuri Public School">Dhanpuri Public School</option>
              <option value="WES Academy">WES Academy</option>
            </select>
            {errors.school && <p className="text-xs text-red-500 mt-1">{errors.school.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Applying for Class</label>
            <select 
              {...register("appliedClass", { required: "Please select a class" })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
            >
              <option value="">Select Class</option>
              {getClassesBySchool(selectedSchool).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.appliedClass && <p className="text-xs text-red-500 mt-1">{errors.appliedClass.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Academic Year</label>
            <select 
              {...register("academicYear", { required: true })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
            >
              <option value="2026-27">2026-2027</option>
            </select>
          </div>
        </div>

        <button 
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
            <>
              Create Account <Send className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
