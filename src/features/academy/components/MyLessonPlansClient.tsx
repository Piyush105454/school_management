"use client";

import React, { useState } from "react";
import { BookOpen, Search, Plus, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { deleteLessonPlan } from "@/features/academy/actions/lessonPlanActions";

export default function MyLessonPlansClient({ initialPlans }: { initialPlans: any[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'ALL' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('ALL');

  const filteredPlans = plans.filter(p => {
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = 
        (p.class?.name && p.class.name.toLowerCase().includes(lowerSearch)) ||
        (p.subject?.name && p.subject.name.toLowerCase().includes(lowerSearch));
      if (!matchesSearch) return false;
    }
    
    if (activeTab === "DRAFT") return p.status === "DRAFT";
    if (activeTab === "SUBMITTED") return p.status === "SUBMITTED";
    if (activeTab === "APPROVED") return p.status === "APPROVED";
    if (activeTab === "REJECTED") return p.status === "REJECTED";
    return true; // ALL
  });

  const draftCount = plans.filter(p => p.status === "DRAFT").length;
  const submittedCount = plans.filter(p => p.status === "SUBMITTED").length;
  const approvedCount = plans.filter(p => p.status === "APPROVED").length;
  const rejectedCount = plans.filter(p => p.status === "REJECTED").length;

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to permanently delete this lesson plan? This action cannot be undone.")) return;
    try {
      const res = await deleteLessonPlan(planId);
      if (res.success) {
        setPlans(prev => prev.filter(p => p.id !== planId));
      } else {
        alert("Failed to delete lesson plan: " + res.error);
      }
    } catch (error: any) {
      alert("Error deleting lesson plan: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-white shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">My Lesson Plans</h1>
            </div>
            <p className="text-sm font-bold text-slate-500 italic ml-14">View and manage your created lesson plans.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-72 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by class or subject..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <Link 
              href="/office/academy-management/lesson-plan"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Create New
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('ALL')}
            className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
              activeTab === 'ALL' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            All Plans 
            <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === 'ALL' ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {plans.length}
            </span>
            {activeTab === 'ALL' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('DRAFT')}
            className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
              activeTab === 'DRAFT' ? 'text-slate-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Drafts 
            <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === 'DRAFT' ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {draftCount}
            </span>
            {activeTab === 'DRAFT' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-600 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('SUBMITTED')}
            className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
              activeTab === 'SUBMITTED' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Submitted 
            <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {submittedCount}
            </span>
            {activeTab === 'SUBMITTED' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('APPROVED')}
            className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
              activeTab === 'APPROVED' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Approved 
            <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {approvedCount}
            </span>
            {activeTab === 'APPROVED' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('REJECTED')}
            className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
              activeTab === 'REJECTED' ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Rejected 
            <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {rejectedCount}
            </span>
            {activeTab === 'REJECTED' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
            )}
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class & Subject</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="space-y-3">
                      <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">No lesson plans found</p>
                      <p className="text-slate-400 text-xs italic">Create your first lesson plan by clicking the button above.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPlans.map(plan => (
                  <tr key={plan.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">
                          {plan.class?.name}
                        </span>
                        <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors capitalize">{plan.subject?.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{plan.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600">
                      {plan.date}
                    </td>
                    <td className="px-6 py-4">
                      {plan.status === "SUBMITTED" && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Pending Review
                        </span>
                      )}
                      {plan.status === "APPROVED" && (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Approved
                        </span>
                      )}
                      {plan.status === "REJECTED" && (
                        <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Rejected
                        </span>
                      )}
                      {plan.status === "DRAFT" && (
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {plan.status === "DRAFT" || plan.status === "REJECTED" ? (
                          <Link
                            href={`/office/academy-management/lesson-plan?edit=${plan.id}`}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Edit Plan"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        ) : null}
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Lesson Plan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
