"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Search, Plus, Trash2, Edit, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { deleteLessonPlan } from "@/features/academy/actions/lessonPlanActions";
import { useInstitute } from "@/providers/InstituteProvider";

export default function MyLessonPlansClient({ initialPlans }: { initialPlans: any[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'ALL' | 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'SIGNOFF' | 'REJECTED'>('ALL');
  
  const { dbClasses } = useInstitute();
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [filterDateRange, setFilterDateRange] = useState("ALL");
  const [customDate, setCustomDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterClass, filterSubject, filterDateRange, customDate]);

  const uniqueClasses = dbClasses && dbClasses.length > 0 
    ? dbClasses 
    : Array.from(new Set(plans.map(p => p.class?.name).filter(Boolean)));
  const uniqueSubjects = Array.from(new Set(plans.map(p => p.subject?.name).filter(Boolean)));

  const filteredPlans = plans.filter(p => {
    // 1. Text Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = 
        (p.id && p.id.toLowerCase().includes(lowerSearch)) ||
        (p.class?.name && p.class.name.toLowerCase().includes(lowerSearch)) ||
        (p.subject?.name && p.subject.name.toLowerCase().includes(lowerSearch)) ||
        (p.date && p.date.includes(lowerSearch));
      if (!matchesSearch) return false;
    }

    // 2. Class Filter
    if (filterClass !== "ALL" && p.class?.name !== filterClass) return false;

    // 3. Subject Filter
    if (filterSubject !== "ALL" && p.subject?.name !== filterSubject) return false;

    // 4. Date Range Filter
    if (filterDateRange !== "ALL") {
      const planDateStr = p.date;
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      if (filterDateRange === "TODAY") {
        if (planDateStr !== todayStr) return false;
      } else if (filterDateRange === "TOMORROW") {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        if (planDateStr !== tomorrowStr) return false;
      } else if (filterDateRange === "NEXT_7_DAYS") {
        const next7 = new Date(today);
        next7.setDate(next7.getDate() + 7);
        const next7Str = next7.toISOString().split("T")[0];
        if (planDateStr < todayStr || planDateStr > next7Str) return false;
      } else if (filterDateRange === "LAST_7_DAYS") {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        const last7Str = last7.toISOString().split("T")[0];
        if (planDateStr > todayStr || planDateStr < last7Str) return false;
      } else if (filterDateRange === "CUSTOM" && customDate) {
        if (planDateStr !== customDate) return false;
      }
    }
    
    // 5. Status Tab Filter
    if (activeTab === "DRAFT") return p.status === "DRAFT";
    if (activeTab === "SUBMITTED") return p.status === "SUBMITTED";
    if (activeTab === "REVIEWED") return p.status === "REVIEWED";
    if (activeTab === "APPROVED") return p.status === "APPROVED";
    if (activeTab === "SIGNOFF") return p.status === "COMPLETED";
    if (activeTab === "REJECTED") return p.status === "REJECTED";
    return true; // ALL
  });

  const totalPages = Math.ceil(filteredPlans.length / ITEMS_PER_PAGE) || 1;
  const paginatedPlans = filteredPlans.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const draftCount = plans.filter(p => p.status === "DRAFT").length;
  const submittedCount = plans.filter(p => p.status === "SUBMITTED").length;
  const reviewedCount = plans.filter(p => p.status === "REVIEWED").length;
  const approvedCount = plans.filter(p => p.status === "APPROVED").length;
  const completedCount = plans.filter(p => p.status === "COMPLETED").length;
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
                placeholder="Search by class, subject, or date..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {plans.some(p => p.status === "REJECTED") && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 flex items-center gap-3 text-xs font-bold shadow-sm">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 animate-pulse" />
            <span>Rejected Lesson Plan: {plans.filter(p => p.status === "REJECTED").map(p => p.id).join(", ")}</span>
          </div>
        )}

        <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
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
            Pending
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
            onClick={() => setActiveTab('REVIEWED')}
            className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
              activeTab === 'REVIEWED' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Reviewed
            <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === 'REVIEWED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {reviewedCount}
            </span>
            {activeTab === 'REVIEWED' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full" />
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
            onClick={() => setActiveTab('SIGNOFF')}
            className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
              activeTab === 'SIGNOFF' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Signoff 
            <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
              activeTab === 'SIGNOFF' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {completedCount}
            </span>
            {activeTab === 'SIGNOFF' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
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
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-100/60 p-3 rounded-2xl border border-slate-200/60">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="ALL">All Classes</option>
            {uniqueClasses.map((c: any) => (
              <option key={typeof c === 'string' ? c : c.name} value={typeof c === 'string' ? c : c.name}>
                {typeof c === 'string' ? c : c.name}
              </option>
            ))}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="ALL">All Subjects</option>
            {uniqueSubjects.map((s: any) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterDateRange}
            onChange={(e) => {
              setFilterDateRange(e.target.value);
              if (e.target.value !== "CUSTOM") setCustomDate("");
            }}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today</option>
            <option value="TOMORROW">Tomorrow</option>
            <option value="NEXT_7_DAYS">Next 7 Days</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="CUSTOM">Custom Date</option>
          </select>

          {filterDateRange === "CUSTOM" && (
            <input 
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">LP ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class & Subject</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewed By</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved By</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-20 text-center">
                    <div className="space-y-3">
                      <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">No lesson plans found</p>
                      <p className="text-slate-400 text-xs italic">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPlans.map(plan => (
                  <tr key={plan.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">
                        {plan.id}
                      </span>
                    </td>
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
                      {plan.status === "REVIEWED" && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Reviewed
                        </span>
                      )}
                      {plan.status === "APPROVED" && (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Approved
                        </span>
                      )}
                      {plan.status === "COMPLETED" && (
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Signoff
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
                    <td className="px-6 py-4">
                      {plan.status === "DRAFT" ? (
                        <span className="text-slate-300 italic text-xs">Not submitted</span>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-700">
                            {[plan.subject?.reviewer1?.name, plan.subject?.reviewer2?.name].filter(Boolean).join(" | ") || plan.specialistProfile?.name || "Reviewer"}
                          </p>
                          {plan.status !== "SUBMITTED" ? (
                            <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider">Reviewed</span>
                          ) : (
                            <span className="text-[9px] text-blue-500 font-black uppercase tracking-wider">Pending Review</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {plan.status === "APPROVED" || plan.status === "COMPLETED" ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-700">
                            {plan.principalProfile?.name || plan.reviewerProfile?.name || "Principal"}
                          </p>
                          <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider">Approved</span>
                        </div>
                      ) : plan.status === "REVIEWED" ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-slate-400 italic">Pending Approval</p>
                          <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider font-bold">Principal</p>
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/office/academy-management/lesson-plan?edit=${plan.id}`}
                          className={`flex items-center justify-center transition-all ${
                            plan.status === "DRAFT" || plan.status === "REJECTED" 
                              ? "p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                              : "px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                          }`}
                          title={plan.status === "DRAFT" || plan.status === "REJECTED" ? "Edit Plan" : "View Your Lesson Plan"}
                        >
                          {plan.status === "DRAFT" || plan.status === "REJECTED" ? <Edit className="h-4 w-4" /> : "View Your Lesson Plan"}
                        </Link>
                        {(plan.status === "DRAFT" || plan.status === "REJECTED") && (
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Lesson Plan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Page {currentPage} of {totalPages} ({filteredPlans.length} Total Plans)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
