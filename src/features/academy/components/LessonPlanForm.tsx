"use client";

import React, { useState } from "react";
import { FileText, Save, Download, Loader2, Calendar, ClipboardList, PenTool } from "lucide-react";
import { generateLessonPlanPdf } from "@/features/academy/utils/generateLessonPlanPdf";

export default function LessonPlanForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    deliveryDay: "",
    date: new Date().toISOString().split('T')[0],
    lpNo: "",
    teacherNote: "",
    className: "",
    subject: "",
    homework: "Write homework clearly and in simple words, so that both students and parents can understand what needs to be done at home.\nWhile writing, make sure to include:\n1. What to do?\n2. Deadline / Submission Date.\n3. Special instructions if any.",
    teacherName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateLessonPlanPdf(formData);
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `LessonPlan_${formData.date}_${formData.subject}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Step 1: Teacher's Note Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <PenTool className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Teacher's Note</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">LP Delivery Day</label>
            <input
              type="text"
              name="deliveryDay"
              value={formData.deliveryDay}
              onChange={handleChange}
              placeholder="e.g. Monday"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Your LP No.</label>
            <input
              type="text"
              name="lpNo"
              value={formData.lpNo}
              onChange={handleChange}
              placeholder="e.g. 101"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Reflections & Preparation</label>
          <textarea
            name="teacherNote"
            value={formData.teacherNote}
            onChange={handleChange}
            placeholder="This section is for your own preparation and reflections before delivering the class..."
            rows={5}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium resize-none"
          />
        </div>
      </section>

      {/* Step 2: Today's Homework Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <ClipboardList className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Today's Homework</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Class</label>
            <input
              type="text"
              name="className"
              value={formData.className}
              onChange={handleChange}
              placeholder="e.g. Class 10th-A"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Mathematics"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Homework Details</label>
          <textarea
            name="homework"
            value={formData.homework}
            onChange={handleChange}
            rows={6}
            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium resize-none"
          />
        </div>
      </section>

      <section className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 leading-tight">Ready to Generate PDF?</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Check all details before downloading</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            Download Lesson Plan PDF
          </button>
        </div>
      </section>
    </div>
  );
}
