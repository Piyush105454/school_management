"use client";

import React, { useState } from "react";
import LessonPlanForm from "@/features/academy/components/LessonPlanForm";
import { BookOpen, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LessonPlanPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/office/academy-management/classes"
              className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Lesson Plan Management
              </h1>
              <p className="text-sm text-slate-500 font-medium">Create daily lesson plans and homework assignments</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-8 md:p-12">
            <LessonPlanForm />
          </div>
        </div>
      </div>
    </div>
  );
}
