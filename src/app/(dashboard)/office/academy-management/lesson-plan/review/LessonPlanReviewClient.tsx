"use client";

import React, { useState } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Calendar, 
  User, 
  BookOpen, 
  ClipboardList,
  ArrowLeft,
  ChevronRight,
  FileText,
  PenTool
} from "lucide-react";
import { updateLessonPlanStatus } from "@/features/academy/actions/lessonPlanActions";

export default function LessonPlanReviewClient({ initialPlans, reviewerId }: { initialPlans: any[], reviewerId: string }) {
  const [plans, setPlans] = useState(initialPlans);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const filteredPlans = plans.filter(p => 
    p.class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedPlan) return;
    if (status === "REJECTED" && !remark) {
      alert("Please provide a remark for rejection.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateLessonPlanStatus(selectedPlan.id, status, remark, reviewerId);
      if (res.success) {
        alert(`Lesson Plan ${status.toLowerCase()} successfully!`);
        setPlans(prev => prev.filter(p => p.id !== selectedPlan.id));
        setSelectedPlan(null);
        setRemark("");
        setActiveStep(1);
      } else {
        alert("Failed to update status: " + res.error);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStep1Data = () => JSON.parse(selectedPlan?.step1Data || "{}");
  const getStep2Data = () => JSON.parse(selectedPlan?.step2Data || "{}");

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                <ClipboardList className="h-8 w-8 text-blue-600" />
                Lesson Plan Review
              </h1>
              <p className="text-sm text-slate-500 font-medium italic">Validate curriculum delivery and preparation quality.</p>
            </div>
            
            <div className="relative group max-w-sm w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by class, subject, or teacher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class & Subject</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <div className="space-y-3">
                        <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">No pending reviews found</p>
                        <p className="text-slate-400 text-xs italic">All submitted plans have been processed.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map(plan => (
                    <tr key={plan.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">
                            {plan.class?.name}
                          </span>
                          <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors capitalize">{plan.subject?.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{plan.type}</span>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-600">
                        {plan.teacher?.name || "Teacher"}
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-600">
                        {plan.date}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => setSelectedPlan(plan)}
                          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10"
                        >
                          Review Plan
                        </button>
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

  // Detail View (Exact same layout as Lesson Plan Management)
  const step1 = getStep1Data();
  const step2 = getStep2Data();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedPlan(null)}
              className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Reviewing Lesson Plan
              </h1>
              <p className="text-sm text-slate-500 font-medium">Validating content for {selectedPlan.subject?.name} ({selectedPlan.class?.name})</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-2xl shadow-sm">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeStep === step 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                Step {step}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-8 md:p-12 flex-1">
            {activeStep === 1 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 italic">Teacher's Preparation Note</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Initial context and homework planning</p>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Teacher's Note / Context</label>
                    <div className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-medium leading-relaxed text-slate-700 min-h-[150px] border border-slate-100">
                      {step1.teacherNote || "No notes provided."}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Homework Assigned</label>
                    <div className="w-full bg-slate-50 rounded-2xl p-6 text-sm font-medium leading-relaxed text-slate-700 border border-slate-100">
                      {step1.homework || "No homework specified."}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 italic">Core Lesson Content ({selectedPlan.type})</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Timings, Indicators and Methodology</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 col-span-full">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit/Chapter/Page</label>
                    <p className="text-sm font-bold text-slate-700">{step2.unitChapterPage || "-"}</p>
                  </div>

                  {selectedPlan.type === "EXPLANATION" ? (
                    <>
                      {[
                        { label: "Opening (Energizer)", value: step2.openingTimeEnergizer },
                        { label: "Opening (Roadmap)", value: step2.openingTimeRoadmap },
                        { label: "Learning Indicators", value: step2.learningIndicators },
                        { label: "Intro & Objective", value: step2.lessonIntroObjective },
                        { label: "New Topic Intro", value: step2.newTopicIntro },
                        { label: "Knowledge Building", value: step2.knowledgeBuilding },
                        { label: "Lesson Activity", value: step2.lessonActivity },
                        { label: "Outcome Feedback", value: step2.outcomeFeedback },
                      ].map((item, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</label>
                          <p className="text-sm font-bold text-slate-700">{item.value || "-"}</p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        { label: "Chapter Summary/Revision", value: step2.chapterSummaryRevision },
                        { label: "Chapter Based Q&A", value: step2.chapterBasedQA },
                        { label: "Inspection by Teacher", value: step2.inspectionByTeacher },
                      ].map((item, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</label>
                          <p className="text-sm font-bold text-slate-700">{item.value || "-"}</p>
                        </div>
                      ))}
                    </>
                  )}
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Closure</label>
                    <p className="text-sm font-bold text-slate-700">{step2.closure || "-"}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Previous Day Check</label>
                    <p className="text-sm font-bold text-slate-700">{step2.prevDayCheck || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 italic">Delivery & Feedback</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Observations and Student Performance</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher Observation</label>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{step2.teacherObservation || "No observations recorded."}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 space-y-2">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Performance (Good)</label>
                      <p className="text-sm font-medium text-slate-700">{step2.studentPerformanceGood || "-"}</p>
                    </div>
                    <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 space-y-2">
                      <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Performance (Needs Work)</label>
                      <p className="text-sm font-medium text-slate-700">{step2.studentPerformanceBad || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 md:p-12 bg-slate-900 text-white rounded-b-[2.5rem] space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                <PenTool className="h-4 w-4" /> Final Validation & Feedback
              </label>
              <textarea 
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter feedback for the teacher (Required for rejection)..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-4">
              <button 
                onClick={() => handleAction("REJECTED")}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30 shadow-lg shadow-rose-500/10"
              >
                <XCircle className="h-4 w-4" />
                Reject & Send Back
              </button>
              <button 
                onClick={() => handleAction("APPROVED")}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-30"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
