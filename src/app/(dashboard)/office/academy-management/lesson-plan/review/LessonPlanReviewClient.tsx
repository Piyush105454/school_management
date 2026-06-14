"use client";

import React, { useState, useEffect } from "react";
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
  PenTool,
  Save,
  Download,
  Loader2,
  Trash2,
  ChevronLeft
} from "lucide-react";
import { updateLessonPlanStatus, deleteLessonPlan } from "@/features/academy/actions/lessonPlanActions";
import "katex/dist/katex.min.css";
import "react-quill-new/dist/quill.snow.css";

export default function LessonPlanReviewClient({ initialPlans, reviewerId }: { initialPlans: any[], reviewerId: string }) {
  const [plans, setPlans] = useState(initialPlans);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [filterDateRange, setFilterDateRange] = useState("ALL");
  const [customDate, setCustomDate] = useState("");
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterClass, filterSubject, filterDateRange, customDate]);

  const pendingPlans = plans.filter(p => p.status === "SUBMITTED");
  const approvedPlans = plans.filter(p => p.status === "APPROVED");
  const rejectedPlans = plans.filter(p => p.status === "REJECTED");

  const uniqueClasses = Array.from(new Set(plans.map(p => p.class?.name).filter(Boolean)));
  const uniqueSubjects = Array.from(new Set(plans.map(p => p.subject?.name).filter(Boolean)));

  const selectPlanForReview = (plan: any) => {
    setSelectedPlan(plan);
    setRemark(plan.reviewerRemark || "");
    setActiveStep(1);
  };

  const filteredPlans = plans.filter(p => {
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = 
        (p.class?.name && p.class.name.toLowerCase().includes(lowerSearch)) ||
        (p.subject?.name && p.subject.name.toLowerCase().includes(lowerSearch)) ||
        (p.teacher?.name && p.teacher.name.toLowerCase().includes(lowerSearch));
        
      if (!matchesSearch) return false;
    }
    
    if (filterClass !== "ALL" && p.class?.name !== filterClass) return false;
    if (filterSubject !== "ALL" && p.subject?.name !== filterSubject) return false;

    if (filterDateRange !== "ALL" && p.date) {
      const planDate = new Date(p.date);
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const next7Days = new Date(today);
      next7Days.setDate(next7Days.getDate() + 7);

      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);

      if (filterDateRange === "TODAY" && planDate.getTime() !== today.getTime()) return false;
      if (filterDateRange === "TOMORROW" && planDate.getTime() !== tomorrow.getTime()) return false;
      if (filterDateRange === "NEXT_7_DAYS" && (planDate < today || planDate > next7Days)) return false;
      if (filterDateRange === "LAST_7_DAYS" && (planDate > today || planDate < last7Days)) return false;
      if (filterDateRange === "CUSTOM" && customDate) {
        const customD = new Date(customDate);
        customD.setHours(0,0,0,0);
        if (planDate.getTime() !== customD.getTime()) return false;
      }
    }

    if (activeTab === "PENDING") return p.status === "SUBMITTED";
    if (activeTab === "APPROVED") return p.status === "APPROVED";
    if (activeTab === "REJECTED") return p.status === "REJECTED";
    return true; // "ALL"
  });

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
        // Update the plan status and remark in local state in-place so it transitions tabs without disappearing
        setPlans(prev => prev.map(p => p.id === selectedPlan.id ? { ...p, status, reviewerRemark: remark } : p));
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

  const getStep1Data = () => JSON.parse(selectedPlan?.step1Data || "{}");
  const getStep2Data = () => JSON.parse(selectedPlan?.step2Data || "{}");

  const totalPages = Math.ceil(filteredPlans.length / ITEMS_PER_PAGE);
  const paginatedPlans = filteredPlans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-white shrink-0">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Lesson Plan Review</h1>
              </div>
              <p className="text-sm font-bold text-slate-500 italic ml-14">Validate curriculum delivery and preparation quality.</p>
            </div>
            
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by class, subject, or teacher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('PENDING')}
              className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
                activeTab === 'PENDING' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Pending Review 
              <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
                activeTab === 'PENDING' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {pendingPlans.length}
              </span>
              {activeTab === 'PENDING' && (
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
                {approvedPlans.length}
              </span>
              {activeTab === 'APPROVED' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('REJECTED')}
              className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
                activeTab === 'REJECTED' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Rejected
              <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
                activeTab === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {rejectedPlans.length}
              </span>
              {activeTab === 'REJECTED' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />
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

          <div className="flex flex-wrap items-center gap-4">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            >
              <option value="ALL">All Classes</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            >
              <option value="ALL">All Subjects</option>
              {uniqueSubjects.map((s) => (
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
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class & Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <div className="space-y-3">
                        <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">
                          {activeTab === 'PENDING' && "No pending reviews found"}
                          {activeTab === 'APPROVED' && "No approved plans found"}
                          {activeTab === 'REJECTED' && "No rejected plans found"}
                          {activeTab === 'ALL' && "No lesson plans found"}
                        </p>
                        <p className="text-slate-400 text-xs italic">
                          {activeTab === 'PENDING' && "All submitted plans have been processed."}
                          {activeTab === 'APPROVED' && "Approved lesson plans will appear here."}
                          {activeTab === 'REJECTED' && "Rejected lesson plans will appear here."}
                          {activeTab === 'ALL' && "Lesson plans submitted by teachers will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPlans.map(plan => (
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
                        {plan.teacher?.name || "Teacher"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">
                        {plan.date}
                      </td>
                      <td className="px-6 py-4">
                        {plan.status === "SUBMITTED" && (
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Pending
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
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => selectPlanForReview(plan)}
                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10"
                          >
                            {plan.status === "SUBMITTED" ? "Review Plan" : "View Details"}
                          </button>
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
            
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2 mr-4">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

  // Detail View (Exact same layout as Lesson Plan Management)
  const step1 = getStep1Data();
  const step2 = getStep2Data();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                {selectedPlan.status === "APPROVED" && (
                  <span className="ml-3 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Approved
                  </span>
                )}
                {selectedPlan.status === "REJECTED" && (
                  <span className="ml-3 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Rejected
                  </span>
                )}
                {selectedPlan.status === "SUBMITTED" && (
                  <span className="ml-3 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Pending Review
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500 font-medium">Validating content for {selectedPlan.subject?.name} ({selectedPlan.class?.name})</p>
            </div>
          </div>

          {/* Descriptive Step Selector matching LessonPlanForm */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveStep(1)}
              className={`px-4 py-2 rounded-lg font-bold text-[10px] transition-all uppercase tracking-widest ${activeStep === 1
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              1. Teacher Preparation
            </button>
            <button
              onClick={() => setActiveStep(2)}
              className={`px-4 py-2 rounded-lg font-bold text-[10px] transition-all uppercase tracking-widest ${activeStep === 2
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              2. LESSON PLAN
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className={`px-4 py-2 rounded-lg font-bold text-[10px] transition-all uppercase tracking-widest ${activeStep === 3
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              3. LESSON delivery & Sign off
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-8 md:p-12 flex-1">
            {activeStep === 1 && (
              <div className="space-y-8 animate-in fade-in duration-300 bg-white">
                {/* 1A. Teacher's Note Table */}
                <div className="border border-black">
                  {/* TOP HEADER ROW */}
                  <div className="grid grid-cols-12 border-b border-black divide-x divide-black h-12">
                    <div className="col-span-6 flex items-center justify-center font-black text-2xl tracking-tight uppercase text-slate-900">1A. Teacher's Note</div>
                    <div className="col-span-6 grid grid-cols-3 divide-x divide-black h-full text-slate-900">
                      <div className="flex items-center px-2 text-[10px] font-bold">LP Delivery Day <span className="ml-1 border-b border-black flex-1 min-w-[50px]">{selectedPlan.deliveryDay || step2.deliveryDay || "Monday"}</span></div>
                      <div className="flex items-center px-2 text-[10px] font-bold">Date: <span className="ml-1 border-b border-black flex-1 min-w-[50px]">{selectedPlan.date}</span></div>
                      <div className="flex items-center px-2 text-[10px] font-bold whitespace-nowrap">Your LP No. <span className="ml-1 border-b border-black flex-1 min-w-[30px]">{step2.lpNo || "No."}</span></div>
                    </div>
                  </div>

                  {/* INSTRUCTION GRID */}
                  <div className="grid grid-cols-2 border-b border-black divide-x divide-black text-[11px] leading-snug text-slate-600">
                    <div className="p-4 space-y-2">
                      <p>This section is for your own preparation and reflections before delivering the class. Use it to stay organized and confident while teaching.</p>
                      <p>Please use this space to:</p>
                      <ol className="list-decimal list-inside pl-1">
                        <li>Write key points or concepts you want to highlight in today's lesson.</li>
                        <li>Note any stories, examples, or activities you plan to include.</li>
                        <li>Plan your blackboard work or rough class flow in steps.</li>
                        <li>Prepare simple questions you'll ask to check understanding during class.</li>
                      </ol>
                    </div>
                    <div className="p-4 space-y-2 font-medium">
                      <p>यह भाग कक्षा शुरू करने से पहले आपकी तैयारी और चिंतन के लिए है। इसका उपयोग पढ़ाते समय व्यवस्थित और आत्मविश्वासी बने रहने के लिए करें।</p>
                      <p>कृपया इस स्थान का उपयोग निम्न के लिए करें:</p>
                      <ol className="list-decimal list-inside pl-1">
                        <li>आज के पाठ में किन मुख्य बिंदुओं या अवधारणाओं पर आप प्रकाश डालना चाहते हैं, उन्हें लिखें।</li>
                        <li>उन कहानियों, उदाहरणों या गतिविधियों को नोट करें जिन्हें आप शामिल करने की योजना बना रहे हैं।</li>
                      </ol>
                    </div>
                  </div>

                  {/* WRITING SPACE */}
                  <div 
                    className="w-full p-6 text-base font-medium min-h-[300px] text-slate-800 bg-white select-text ql-editor"
                    dangerouslySetInnerHTML={{ __html: step1.teacherNote || "No preparation notes provided." }}
                  />
                </div>

                {/* 1B. Homework Table */}
                <div className="border border-black">
                  {/* TOP HEADER ROW */}
                  <div className="grid grid-cols-12 border-b border-black divide-x divide-black h-12 text-slate-900">
                    <div className="col-span-6 flex items-center justify-center font-black text-xl tracking-tight uppercase">1B. Today's Homework</div>
                    <div className="col-span-6 grid grid-cols-3 divide-x divide-black h-full">
                      <div className="flex items-center px-2 text-[10px] font-bold truncate">Class: <span className="ml-1 border-b border-black flex-1">{selectedPlan.class?.name}</span></div>
                      <div className="flex items-center px-2 text-[10px] font-bold truncate">Subject: <span className="ml-1 border-b border-black flex-1">{selectedPlan.subject?.name}</span></div>
                      <div className="flex items-center px-2 text-[10px] font-bold truncate">Date: <span className="ml-1 border-b border-black flex-1">{selectedPlan.date}</span></div>
                    </div>
                  </div>

                  {/* INSTRUCTION GRID */}
                  <div className="grid grid-cols-2 border-b border-black divide-x divide-black text-[11px] leading-snug text-slate-600">
                    <div className="p-4 space-y-2">
                      <p>Write homework clearly and in simple words, so that both students and parents can understand what needs to be done at home.</p>
                      <p>While writing, make sure to include:</p>
                      <ol className="list-decimal list-inside pl-1">
                        <li>What to do?</li>
                        <li>Deadline / Submission Date.</li>
                        <li>Special instructions if any.</li>
                      </ol>
                    </div>
                    <div className="p-4 space-y-2 font-medium">
                      <p>होमवर्क को स्पष्ट और सरल शब्दों में लिखें, ताकि छात्र और अभिभावक दोनों समझ सकें कि घर पर क्या करना है। होमवर्क लिखते समय निम्नलिखित बातों का ध्यान रखें:</p>
                      <p>1. क्या करना है?</p>
                      <p>2. अंतिम तिथि / जमा करने की तारीख।</p>
                      <p>3. यदि कोई विशेष निर्देश हों तो उन्हें लिखें।</p>
                    </div>
                  </div>

                  {/* WRITING SPACE */}
                  <div 
                    className="w-full p-6 text-base font-medium min-h-[200px] text-slate-800 bg-white select-text ql-editor"
                    dangerouslySetInnerHTML={{ __html: step1.homework || "No homework assigned." }}
                  />
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900">
                {(!selectedPlan.type || selectedPlan.type === "EXPLANATION" || selectedPlan.type === "PREPRIMARY") ? (
                  <div className="border border-slate-300 rounded-[1.5rem] overflow-hidden bg-white shadow-xl">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 border-b border-slate-300">
                      <div className="col-span-3 p-6 flex items-center justify-center border-r border-slate-300 bg-slate-50">
                        <img src="/logo.png" alt="Logo" className="h-16 w-16 object-contain grayscale opacity-60" />
                      </div>
                      <div className="col-span-6 p-6 flex flex-col items-center justify-center border-r border-slate-300">
                        <h2 className="text-2xl font-black tracking-tighter text-slate-800">Dhanpuri Public School</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Knowledge is Power</p>
                      </div>
                      <div className="col-span-3 p-6 flex flex-col items-center justify-center bg-slate-50">
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Lesson Plan</p>
                        <p className="text-lg font-black text-slate-800 uppercase italic">({selectedPlan.type || "EXPLANATION"})</p>
                      </div>
                    </div>

                    {/* Meta Rows (Grid style) */}
                    <div className="grid grid-cols-10 border-b border-slate-300 h-14">
                      <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Subject:</div>
                      <div className="col-span-4 p-3 flex items-center font-bold text-sm border-r border-slate-300 truncate">{selectedPlan.subject?.name || "-"}</div>
                      <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Grade:</div>
                      <div className="col-span-4 p-3 flex items-center font-bold text-sm truncate">{selectedPlan.class?.name || "-"}</div>
                    </div>

                    <div className="grid grid-cols-10 border-b border-slate-300 h-14">
                      <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Unit/Chapter:</div>
                      <div className="col-span-4 p-3 flex items-center border-r border-slate-300 font-bold text-sm truncate">{step2.unitChapterPage || "-"}</div>
                      <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Page Range:</div>
                      <div className="col-span-4 p-3 flex items-center font-bold text-sm truncate">{step2.unitChapterPage?.split(", Pg ")[1] || "-"}</div>
                    </div>

                    {/* LP Prep Day Row */}
                    <div className="grid grid-cols-10 border-b border-slate-300 h-14">
                      <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Day:</div>
                      <div className="col-span-4 p-3 flex items-center border-r border-slate-300 font-bold text-sm">{step2.prepDay || "Monday"}</div>
                      <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Date:</div>
                      <div className="col-span-4 p-3 flex items-center font-bold text-sm">{step2.prepDate || "-"}</div>
                    </div>

                    {/* Instruction Table */}
                    <div className="grid grid-cols-12 border-b border-slate-300 bg-slate-800 text-white font-black uppercase tracking-widest text-[8px] h-8 items-center text-center">
                      <div className="col-span-2 border-r border-slate-700">Section</div>
                      <div className="col-span-1 border-r border-slate-700">Time</div>
                      <div className="col-span-3 border-r border-slate-700">Objective / Goal</div>
                      <div className="col-span-6">Implementation Details</div>
                    </div>

                    {/* Self Prep */}
                    <div className="grid grid-cols-12 border-b border-slate-300 min-h-[140px]">
                      <div className="col-span-2 p-4 flex items-center justify-center font-black text-[10px] uppercase border-r border-slate-300 text-slate-700 bg-slate-50/30">Self Preparation</div>
                      <div className="col-span-1 p-4 flex items-center justify-center font-bold text-xs border-r border-slate-300">30 min</div>
                      <div className="col-span-3 p-4 flex flex-col justify-center border-r border-slate-300 space-y-2">
                        <p className="font-black text-[9px] text-blue-600 leading-tight uppercase">Instruction for teachers-</p>
                        <p className="font-bold text-[11px] text-slate-600 italic">Plan and prepare for the session before entering the room.</p>
                      </div>
                      <div className="col-span-6 p-6 text-left">
                        <ul className="list-decimal list-inside text-[10px] font-bold text-slate-500 space-y-1.5 marker:text-blue-500">
                          <li>Review and prepare for the session today.</li>
                          <li>Plan the energizer activity.</li>
                          <li>Ready any rewards or materials.</li>
                          <li>Plan for maximum learning outcomes.</li>
                          <li>Set up projector/laptop if needed.</li>
                          <li>Be ready 5 minutes early.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Opening Time */}
                    <div className="grid grid-cols-12 border-b border-slate-300 text-left">
                      <div className="col-span-2 p-4 flex items-center justify-center font-black text-[10px] uppercase border-r border-slate-300 text-slate-700 bg-slate-50/30 row-span-2 min-h-[120px] text-center">Opening time (5 min)</div>
                      <div className="col-span-1 p-4 flex items-center justify-center font-bold text-xs border-r border-slate-300 border-b">2 min</div>
                      <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b font-medium text-[11px] text-slate-600">Lead students to perform an energizer/fun activity</div>
                      <div className="col-span-6 p-4 border-b font-bold text-sm text-slate-700 whitespace-pre-wrap select-text">
                        {step2.openingTimeEnergizer || "-"}
                      </div>

                      <div className="contents">
                        <div className="col-span-1 p-4 flex items-center justify-center font-bold text-xs border-r border-slate-300">3 min</div>
                        <div className="col-span-3 p-4 flex flex-col justify-center border-r border-slate-300">
                          <p className="font-bold text-[11px] text-slate-600 mb-2">Roadmap of the day & Learning Indicators</p>
                        </div>
                        <div className="col-span-6 p-4 grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-bold text-xs text-slate-700 whitespace-pre-wrap select-text">
                            <span className="text-[8px] uppercase tracking-widest text-slate-400 block mb-1">Roadmap:</span>
                            {step2.openingTimeRoadmap || "-"}
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-bold text-xs text-slate-700 whitespace-pre-wrap select-text">
                            <span className="text-[8px] uppercase tracking-widest text-slate-400 block mb-1">Indicators:</span>
                            {step2.learningIndicators || "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Learning Time */}
                    <div className="grid grid-cols-12 border-b border-slate-300 text-left">
                      <div className="col-span-2 p-4 flex items-center justify-center font-black text-center text-[10px] uppercase border-r border-slate-300 text-slate-700 bg-slate-50/30 min-h-[300px]">Active Learning Time (30 min)</div>
                      <div className="col-span-10 grid grid-rows-4 divide-y divide-slate-300">
                        <div className="grid grid-cols-10 h-16">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">2 min</div>
                          <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600">Lesson Intro & Objective</div>
                          <div className="col-span-6 p-3 font-bold text-sm text-slate-700 select-text truncate">{step2.lessonIntroObjective || "-"}</div>
                        </div>
                        <div className="grid grid-cols-10 h-24">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">8 min</div>
                          <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight">New topic Introduction & Explanation</div>
                          <div className="col-span-6 p-3 font-bold text-xs text-slate-700 whitespace-pre-wrap select-text overflow-y-auto">{step2.newTopicIntro || "-"}</div>
                        </div>
                        <div className="grid grid-cols-10 h-24">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">5 min</div>
                          <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600">Knowledge Building / Discussion</div>
                          <div className="col-span-6 p-3 font-bold text-xs text-slate-700 whitespace-pre-wrap select-text overflow-y-auto">{step2.knowledgeBuilding || "-"}</div>
                        </div>
                        <div className="grid grid-cols-10 h-32">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">15 min</div>
                          <div className="col-span-3 flex flex-col p-4 border-r border-slate-300 justify-center">
                            <p className="font-bold text-[11px] text-slate-600">Lesson Activity & Outcome Feedback</p>
                          </div>
                          <div className="col-span-6 p-3 grid grid-rows-2 divide-y divide-slate-100">
                            <div className="py-2 font-bold text-xs text-slate-700 whitespace-pre-wrap select-text overflow-y-auto">
                              <span className="text-[8px] uppercase tracking-widest text-slate-400 block mb-0.5">Activity:</span>
                              {step2.lessonActivity || "-"}
                            </div>
                            <div className="py-2 font-bold text-xs text-slate-700 whitespace-pre-wrap select-text overflow-y-auto">
                              <span className="text-[8px] uppercase tracking-widest text-slate-400 block mb-0.5">Outcome Feedback:</span>
                              {step2.outcomeFeedback || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Closing Time */}
                    <div className="grid grid-cols-12 h-48 border-b border-slate-300 text-left">
                      <div className="col-span-2 flex items-center justify-center font-black text-center text-[10px] uppercase border-r border-slate-300 text-slate-700 bg-slate-50/30">Closing Time (5 min)</div>
                      <div className="col-span-10 grid grid-rows-3 divide-y divide-slate-300">
                        <div className="grid grid-cols-10">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">1 min</div>
                          <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600">Closure, Reward & Recognition</div>
                          <div className="col-span-6 p-3 font-bold text-sm text-slate-700 select-text truncate">{step2.closure || "-"}</div>
                        </div>
                        <div className="grid grid-cols-10">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">2 min</div>
                          <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600">Homework for the day</div>
                          <div 
                            className="col-span-6 p-3 font-bold text-slate-700 text-xs select-text overflow-y-auto ql-editor ql-editor-small" 
                            dangerouslySetInnerHTML={{ __html: step1.homework || "No homework assigned." }}
                          />
                        </div>
                        <div className="grid grid-cols-10">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">2 min</div>
                          <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight">Submission of Previous day work check</div>
                          <div className="col-span-6 p-3 font-bold text-sm text-slate-700 select-text truncate">{step2.prevDayCheck || "-"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6">
                      <p className="text-[10px] font-black uppercase text-slate-400 text-center tracking-[0.3em] italic">End of Lesson Plan</p>
                    </div>
                  </div>
                ) : (
                  /* --- LESSON PLAN (Q & A) --- */
                  <div className="border border-slate-300 rounded-[1.5rem] overflow-hidden bg-white shadow-xl text-left">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 border-b border-slate-300 text-center">
                      <div className="col-span-2 p-6 flex items-center justify-center border-r border-slate-300 bg-slate-50">
                        <img src="/logo.png" alt="Logo" className="h-14 w-14 object-contain grayscale opacity-60" />
                      </div>
                      <div className="col-span-7 p-6 flex flex-col items-center justify-center border-r border-slate-300">
                        <h2 className="text-2xl font-black tracking-tighter text-slate-800">Dhanpuri Public School</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Knowledge is Power</p>
                      </div>
                      <div className="col-span-3 p-6 flex flex-col items-center justify-center bg-slate-50">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          Lesson Plan <span className="text-emerald-500">(Q & A)</span>
                        </p>
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-[10px] font-black uppercase text-slate-400">Your LP No.</span>
                          <span className="text-sm font-black text-slate-800 border-b border-slate-200 min-w-[40px] text-center">{step2.lpNo || "____"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta Grid (Q & A Style) */}
                    <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
                      <div className="grid grid-cols-4 h-12">
                        <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Unit/Chapter/Page(s):</div>
                        <div className="col-span-3 p-3 flex items-center font-bold text-sm truncate">{step2.unitChapterPage || "-"}</div>
                      </div>
                      <div className="grid grid-cols-4 h-12">
                        <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Day/Date:</div>
                        <div className="col-span-3 p-3 flex items-center font-bold text-xs truncate">{step2.prepDay}, {step2.prepDate}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
                      <div className="grid grid-cols-4 h-12">
                        <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Progress Status:</div>
                        <div className="col-span-3 p-3 flex items-center font-bold text-xs">{step2.progressStatus || "Not Started"}</div>
                      </div>
                      <div className="grid grid-cols-4 h-12">
                        <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Delivery Day/Date:</div>
                        <div className="col-span-3 p-3 flex items-center font-bold text-xs truncate">{selectedPlan.deliveryDay || "Monday"}, {selectedPlan.date}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
                      <div className="grid grid-cols-4 h-12">
                        <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Teacher Name/Sign:</div>
                        <div className="col-span-3 p-3 flex items-center font-bold text-sm truncate">{selectedPlan.teacher?.name || "______"}</div>
                      </div>
                      <div className="grid grid-cols-4 h-12">
                        <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Reviewer/Principal:</div>
                        <div className="col-span-3 p-3 flex items-center font-bold text-sm truncate">{step2.reviewerPrincipal || "______"}</div>
                      </div>
                    </div>

                    {/* Instruction Table (Q & A Specific) */}
                    <div className="grid grid-cols-12 border-b border-slate-300 bg-slate-900 text-white font-black uppercase tracking-widest text-[8px] h-8 items-center text-center">
                      <div className="col-span-2 border-r border-slate-800">Section</div>
                      <div className="col-span-1 border-r border-slate-800 text-[6px]">Time</div>
                      <div className="col-span-2 border-r border-slate-800">Objective / Goal</div>
                      <div className="col-span-7">Implementation Details</div>
                    </div>

                    {/* Self Prep (Shared) */}
                    <div className="grid grid-cols-12 border-b border-slate-200 min-h-[140px]">
                      <div className="col-span-2 p-4 flex items-center justify-center font-black text-center text-[10px] uppercase border-r border-slate-300 text-slate-700 bg-slate-50/30">Self Preparation</div>
                      <div className="col-span-1 p-4 flex flex-col items-center justify-center border-r border-slate-300 gap-1 text-center">
                        <span className="font-bold text-[10px] text-slate-800">Before session</span>
                        <span className="font-medium text-[9px] text-slate-400">(30 Minutes)</span>
                      </div>
                      <div className="col-span-2 p-4 flex flex-col justify-center border-r border-slate-300 space-y-2">
                        <p className="font-black text-[9px] text-blue-600 leading-tight uppercase">Instruction for teachers-</p>
                        <p className="font-bold text-[11px] text-slate-600 italic">Plan and prepare for the session</p>
                      </div>
                      <div className="col-span-7 p-6">
                        <ul className="list-decimal list-inside text-[10px] font-bold text-slate-500 space-y-1.5 marker:text-blue-500 leading-relaxed">
                          <li>Review and prepare for the session today, make teaching notes & video.</li>
                          <li>Plan the energizer activity, prepare & understand it and try it once to visualize the classroom.</li>
                          <li>If you plan to reward the students, keep some candies/pen/pencils etc.</li>
                          <li>Plan to get most learning outcomes from the students, specially for those who participate less.</li>
                          <li>Set up all necessary items, including projector, laptop, chargers, & activity materials.</li>
                          <li>Ensure you're ready at least 5 minutes before the session begins.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Opening Time (Shared Layout but Q & A text) */}
                    <div className="grid grid-cols-12 border-b border-slate-200">
                      <div className="col-span-2 p-4 flex flex-col items-center justify-center border-r border-slate-300 text-slate-700 bg-slate-50/30 row-span-2 min-h-[120px] text-center">
                        <span className="font-black text-[10px] uppercase">Opening Time</span>
                        <span className="font-black text-[10px] mt-1 tracking-widest text-blue-600">घेरा समय</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-2">(5mins)</span>
                      </div>
                      <div className="col-span-1 p-4 flex items-center justify-center font-bold text-xs border-r border-slate-300 border-b">2 minutes</div>
                      <div className="col-span-2 p-4 flex items-center border-r border-slate-300 border-b font-medium text-[11px] text-slate-600 leading-tight">Lead the students to perform an energizer/fun activity</div>
                      <div className="col-span-7 p-4 border-b font-bold text-sm text-slate-700 whitespace-pre-wrap select-text">
                        {step2.openingTimeEnergizer || "-"}
                      </div>

                      <div className="contents">
                        <div className="col-span-1 p-4 flex items-center justify-center font-bold text-xs border-r border-slate-300">3 minutes</div>
                        <div className="col-span-2 p-4 flex flex-col justify-center border-r border-slate-300">
                          <p className="font-bold text-[11px] text-slate-600">Roadmap of the day</p>
                        </div>
                        <div className="col-span-7 grid grid-cols-12 divide-x divide-slate-100">
                          <div className="col-span-8 p-3 flex flex-col gap-2 font-bold text-[11px] text-slate-700 whitespace-pre-wrap select-text overflow-y-auto">
                            {step2.openingTimeRoadmap || "-"}
                          </div>
                          <div className="col-span-4 p-3 flex flex-col gap-2 bg-slate-50/50">
                            <span className="text-[8px] font-black uppercase text-slate-400">Learning Indicators:</span>
                            <div className="font-bold text-[11px] text-slate-700 whitespace-pre-wrap select-text overflow-y-auto">
                              {step2.learningIndicators || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Learning Time (Q & A Specific) */}
                    <div className="grid grid-cols-12 border-b border-slate-200">
                      <div className="col-span-2 p-4 flex flex-col items-center justify-center border-r border-slate-300 text-slate-700 bg-slate-50/30 min-h-[300px] uppercase font-black text-[10px] text-center">
                        <span>Active Learning Time</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-2">(30mins)</span>
                      </div>
                      <div className="col-span-10 grid grid-rows-3 divide-y divide-slate-200">
                        <div className="grid grid-cols-10 h-24">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs italic">2 Minutes</div>
                          <div className="col-span-2 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight italic">Chapter Summary And Quick Revision</div>
                          <div className="col-span-7 p-3 font-bold text-xs text-slate-700 whitespace-pre-wrap select-text overflow-y-auto">{step2.chapterSummaryRevision || "-"}</div>
                        </div>
                        <div className="grid grid-cols-10 h-48">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs italic text-blue-600">25 Minutes</div>
                          <div className="col-span-2 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-snug italic">
                            Chapter Based Question Answer - Discussion - Dictation By Teacher And Writing By Students
                          </div>
                          <div className="col-span-7 p-4 font-bold text-xs text-slate-700 whitespace-pre-wrap select-text overflow-y-auto">{step2.chapterBasedQA || "-"}</div>
                        </div>
                        <div className="grid grid-cols-10 h-20">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs italic">3 Minutes</div>
                          <div className="col-span-2 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight italic">Inspection By Teacher</div>
                          <div className="col-span-7 p-3 font-bold text-xs text-slate-700 whitespace-pre-wrap select-text overflow-y-auto">{step2.inspectionByTeacher || "-"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Closing Time (Shared Layout but Q & A specific text) */}
                    <div className="grid grid-cols-12 h-64 border-b border-slate-300">
                      <div className="col-span-2 flex flex-col items-center justify-center border-r border-slate-300 text-slate-700 bg-slate-50/30 p-4 text-center">
                        <span className="font-black text-[10px] uppercase text-center">Closing Time</span>
                        <span className="font-black text-[10px] mt-1 tracking-widest text-rose-600 uppercase text-center">समापन सर्किल समय</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-2">(5mins)</span>
                      </div>
                      <div className="col-span-10 grid grid-rows-3 divide-y divide-slate-200">
                        <div className="grid grid-cols-10">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">1 Minute</div>
                          <div className="col-span-2 flex flex-col items-center justify-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight text-center italic">
                            <span>Lesson Closure with appreciation,</span>
                            <span>Reward and recognition</span>
                          </div>
                          <div className="col-span-7 p-3 font-bold text-sm text-slate-700 select-text truncate">{step2.closure || "-"}</div>
                        </div>
                        <div className="grid grid-cols-10">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">2 Minute</div>
                          <div className="col-span-2 flex items-center justify-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight text-center italic">
                            Homework for the day
                          </div>
                          <div 
                            className="col-span-7 p-3 font-bold text-slate-700 text-xs select-text overflow-y-auto ql-editor ql-editor-small"
                            dangerouslySetInnerHTML={{ __html: step1.homework || "No homework assigned." }}
                          />
                        </div>
                        <div className="grid grid-cols-10">
                          <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs text-rose-500">2 Minute</div>
                          <div className="col-span-2 flex items-center justify-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight text-center italic">
                            Submission of Previous day work check
                          </div>
                          <div className="col-span-7 p-3 font-bold text-sm text-slate-700 select-text truncate">{step2.prevDayCheck || "-"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 border-t border-slate-300">
                      <p className="text-[10px] font-black uppercase text-slate-400 text-center tracking-[0.3em] italic text-center">End of Lesson Plan (Q & A)</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
                <div className="border border-slate-300 rounded-[1.5rem] overflow-hidden bg-white shadow-xl">
                  <div className="bg-slate-800 text-white p-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">3. LESSON delivery & Sign off</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Observations & Feedback</p>
                    </div>
                    <Save className="h-6 w-6 opacity-20" />
                  </div>

                  {/* Observation Section */}
                  <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs uppercase shadow-sm">3A</div>
                      <h4 className="font-black text-slate-800 uppercase tracking-tight">Teacher Observation</h4>
                    </div>
                    <div className="w-full min-h-[160px] p-6 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-sm whitespace-pre-wrap text-slate-800 select-text">
                      {step2.teacherObservation || "No observations recorded."}
                    </div>
                  </div>

                  {/* Student Performance Section */}
                  <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-black text-[10px] uppercase shadow-sm">Good</div>
                        <h4 className="font-black text-slate-600 text-xs uppercase tracking-widest">Student Performance (Positive)</h4>
                      </div>
                      <div className="w-full min-h-[128px] p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl font-medium text-sm whitespace-pre-wrap text-slate-800 select-text">
                        {step2.studentPerformanceGood || "No positive highlights recorded."}
                      </div>
                    </div>
                    <div className="flex-1 space-y-4 border-l border-slate-100 md:pl-8">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center font-black text-[10px] uppercase shadow-sm">Bad</div>
                        <h4 className="font-black text-slate-600 text-xs uppercase tracking-widest">Student Performance (Concerns)</h4>
                      </div>
                      <div className="w-full min-h-[128px] p-4 bg-rose-50/30 border border-rose-100 rounded-xl font-medium text-sm whitespace-pre-wrap text-slate-800 select-text">
                        {step2.studentPerformanceBad || "No areas for improvement recorded."}
                      </div>
                    </div>
                  </div>

                  {/* Reviewer Section */}
                  <div className="p-8 bg-slate-50/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 bg-slate-800 text-white rounded-lg flex items-center justify-center font-black text-xs uppercase shadow-sm">3B</div>
                      <h4 className="font-black text-slate-800 uppercase tracking-tight">Reviewer Remark and Signoff</h4>
                    </div>
                    <div className="w-full min-h-[128px] p-6 bg-white border border-slate-200 rounded-2xl font-bold text-sm whitespace-pre-wrap text-slate-800 select-text shadow-sm">
                      {selectedPlan.reviewerRemark || "No reviewer remarks recorded yet."}
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-200 flex justify-between items-end">
                      <div className="space-y-1">
                        <div className="w-48 border-b border-black"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teacher's Digital Signature</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="w-48 border-b border-black ml-auto"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Head/Principal Signoff</p>
                      </div>
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
