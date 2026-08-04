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
  ChevronLeft,
  Clock,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { updateLessonPlanStatus, deleteLessonPlan } from "@/features/academy/actions/lessonPlanActions";
import { useInstitute } from "@/providers/InstituteProvider";
import Step10ReviewUI from "@/components/lesson-plan/Step10ReviewUI";
import "@/components/lesson-plan/AllStepsStyles.css";
import "katex/dist/katex.min.css";
import "react-quill-new/dist/quill.snow.css";

export default function LessonPlanReviewClient({ 
  initialPlans, 
  reviewerId, 
  isTeacher = false, 
  isApprover = false,
  isAdmin = false,
  specialization,
  teacherId
}: { 
  initialPlans: any[], 
  reviewerId: string, 
  isTeacher?: boolean, 
  isApprover?: boolean,
  isAdmin?: boolean,
  specialization?: string,
  teacherId?: string
}) {
  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };
  const [plans, setPlans] = useState(initialPlans);
  const [loadingPlans, setLoadingPlans] = useState(initialPlans.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const { dbClasses } = useInstitute();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'REVIEWED' | 'APPROVED' | 'SIGNOFF' | 'REJECTED' | 'DRAFT' | 'ALL'>(
    isApprover ? 'REVIEWED' : 'PENDING'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");
  const [filterDateRange, setFilterDateRange] = useState("ALL");
  const [customDate, setCustomDate] = useState("");

  useEffect(() => {
    async function loadPlans() {
      if (initialPlans.length > 0) return;
      setLoadingPlans(true);
      try {
        const { getLessonPlansForReview } = await import("@/features/academy/actions/lessonPlanActions");
        const res = await getLessonPlansForReview(specialization, isTeacher, teacherId);
        if (res.success && res.data) {
          setPlans(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPlans(false);
      }
    }
    loadPlans();
  }, [specialization, isTeacher, teacherId, initialPlans]);
  const [classListStudents, setClassListStudents] = useState<any[]>([]);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterClass, filterSubject, filterDateRange, customDate]);

  const pendingPlans = plans.filter(p => p.status === "SUBMITTED");
  const reviewedPlans = plans.filter(p => p.status === "REVIEWED");
  const approvedPlans = plans.filter(p => p.status === "APPROVED");
  const completedPlans = plans.filter(p => p.status === "COMPLETED");
  const rejectedPlans = plans.filter(p => p.status === "REJECTED");
  const draftPlans = plans.filter(p => p.status === "DRAFT");

  const uniqueClasses = dbClasses && dbClasses.length > 0 
    ? dbClasses 
    : Array.from(new Set(plans.map(p => p.class?.name).filter(Boolean)));
  const uniqueSubjects = Array.from(new Set(plans.map(p => p.subject?.name).filter(Boolean)));

  const selectPlanForReview = async (plan: any) => {
    setLoading(true);
    try {
      const { getLessonPlanById } = await import("@/features/academy/actions/lessonPlanActions");
      const res = await getLessonPlanById(plan.id);
      if (res.success && res.data) {
        setSelectedPlan({ ...plan, ...res.data });
        setRemark(isApprover ? (res.data.principalRemark || "") : (res.data.reviewerRemark || ""));
        
        // Fetch class students for student lists
        const className = res.data.class?.name || (res.data as any).className;
        if (className) {
          fetch(`/api/lesson-plan/form-data?className=${encodeURIComponent(className)}`)
            .then((sRes) => sRes.json())
            .then((data) => {
              if (data.students && Array.isArray(data.students)) {
                setClassListStudents(data.students);
              }
            })
            .catch((err) => console.error("Failed to load class students in review:", err));
        }
        
        setActiveStep(1);
      } else {
        alert("Failed to load full lesson plan details.");
      }
    } catch (e) {
      alert("Error loading lesson plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async () => {
    if (!selectedPlan) return;
    
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      
      // Redirect based on user role
      if (session?.user?.role === "TEACHER") {
        // Teachers go to their lesson plan page
        window.location.href = `/teacher/lesson-plan?id=${selectedPlan.id}`;
      } else if (session?.user?.role === "PRINCIPAL" || session?.user?.role === "OFFICE" || session?.user?.role === "ADMIN") {
        // Admin/Office/Principal stay on review page or go to review list
        window.location.href = `/office/academy-management/lesson-plan/review`;
      } else {
        // Fallback
        window.location.href = `/office/academy-management/lesson-plan/review`;
      }
    } catch (sessionError) {
      console.error("Failed to get session:", sessionError);
      // Fallback
      window.location.href = `/office/academy-management/lesson-plan/review`;
    }
  };

  const filteredPlans = plans.filter(p => {
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = 
        (p.class?.name && p.class.name.toLowerCase().includes(lowerSearch)) ||
        (p.subject?.name && p.subject.name.toLowerCase().includes(lowerSearch)) ||
        (p.teacherProfile?.name && p.teacherProfile.name.toLowerCase().includes(lowerSearch)) ||
        (p.teacherUser?.email && p.teacherUser.email.toLowerCase().includes(lowerSearch));
        
      if (!matchesSearch) return false;
    }
    
    if (filterClass !== "ALL" && p.class?.name !== filterClass) return false;
    if (filterSubject !== "ALL" && p.subject?.name !== filterSubject) return false;

    if (filterDateRange !== "ALL" && p.date) {
      const [year, month, day] = p.date.split('-');
      const planDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
    if (activeTab === "REVIEWED") return p.status === "REVIEWED";
    if (activeTab === "APPROVED") return p.status === "APPROVED";
    if (activeTab === "SIGNOFF") return p.status === "COMPLETED";
    if (activeTab === "REJECTED") return p.status === "REJECTED";
    if (activeTab === "DRAFT") return p.status === "DRAFT";
    if (activeTab === "ALL") return isTeacher ? p.status !== "DRAFT" : true;
    return true;
  });

  const handleAction = async (status: "APPROVED" | "REJECTED" | "REVIEWED") => {
    if (!selectedPlan) return;
    if (status === "REJECTED" && !remark) {
      alert("Please provide feedback / remark explaining the reason for rejection.");
      return;
    }

    let confirmMessage = "";
    if (status === "REVIEWED") {
      confirmMessage = "Are you sure you want to mark this lesson plan as REVIEWED and forward it for Principal approval?";
    } else if (status === "APPROVED") {
      confirmMessage = "Are you sure you want to APPROVE this lesson plan?";
    } else if (status === "REJECTED") {
      confirmMessage = "Are you sure you want to REJECT and send back this lesson plan to the teacher for revisions?";
    }

    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const res = await updateLessonPlanStatus(selectedPlan.id, status, remark, reviewerId, isApprover);
      if (res.success) {
        const actionText = status === "REVIEWED" ? "marked as Reviewed" : status === "APPROVED" ? "Approved" : "Rejected & sent back";
        alert(`Lesson Plan ${actionText} successfully!`);
        // Update the plan status and remark in local state in-place so it transitions tabs without disappearing
        setPlans(prev => prev.map(p => p.id === selectedPlan.id ? { ...p, status, ...(isApprover ? { principalRemark: remark } : { reviewerRemark: remark }) } : p));
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

  const handleUndoStatus = async (plan: any) => {
    let targetStatus: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'COMPLETED' | null = null;
    if (plan.status === 'COMPLETED') targetStatus = 'APPROVED';
    else if (plan.status === 'APPROVED') targetStatus = 'REVIEWED';
    else if (plan.status === 'REVIEWED') targetStatus = 'SUBMITTED';
    else if (plan.status === 'SUBMITTED') targetStatus = 'DRAFT';

    if (!targetStatus) {
      alert("This lesson plan is already in DRAFT status.");
      return;
    }

    if (!confirm(`Are you sure you want to UNDO and revert this lesson plan status from "${plan.status}" back to "${targetStatus}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await updateLessonPlanStatus(
        plan.id, 
        targetStatus as any, 
        plan.status === 'COMPLETED' ? plan.principalRemark || "" : plan.reviewerRemark || "", 
        plan.reviewerId || "", 
        targetStatus === 'APPROVED' || targetStatus === 'REVIEWED'
      );
      if (res.success) {
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: targetStatus } : p));
        alert(`Status reverted to ${targetStatus} successfully!`);
      } else {
        alert("Failed to undo status: " + res.error);
      }
    } catch (e: any) {
      alert("Error reverting status: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const getStep1Data = () => {
    if (!selectedPlan?.step1Data) return {};
    try {
      return typeof selectedPlan.step1Data === 'string'
        ? JSON.parse(selectedPlan.step1Data)
        : selectedPlan.step1Data;
    } catch (e) {
      console.error(e);
      return {};
    }
  };

  const getStep2Data = () => {
    if (!selectedPlan?.step2Data) return {};
    try {
      const rawStep2 = typeof selectedPlan.step2Data === 'string'
        ? JSON.parse(selectedPlan.step2Data)
        : selectedPlan.step2Data;
      
      let merged: any = {};
      const isNewFormat = rawStep2.explanationData !== undefined || rawStep2.qaData !== undefined || rawStep2.sharedData !== undefined;
      if (isNewFormat) {
        const modeData = selectedPlan?.type === "QA" ? (rawStep2.qaData || {}) : (rawStep2.explanationData || {});
        merged = {
          ...(rawStep2.sharedData || {}),
          ...modeData,
          ...rawStep2,
        };
      } else {
        merged = { ...rawStep2 };
      }

      const objectiveText = merged.objectiveVerb && merged.objectiveText
        ? `Students will be able to ${merged.objectiveVerb} ${merged.objectiveText}.`
        : (merged.objectiveText || "");

      const indicators = merged.learningIndicators || 
        [merged.indicator1, merged.indicator2, merged.indicator3].filter(Boolean).join("; ");

      const activity = merged.lessonActivity || 
        (merged.activityTitle ? `${merged.activityTitle}: ${merged.activitySteps || merged.activityDescription || ""}` : (merged.activitySteps || merged.activityDescription || ""));

      const closureText = merged.rewardType 
        ? `${merged.rewardType}${merged.rewardCriteria ? ` - ${merged.rewardCriteria}` : ""}`
        : (merged.closure || "");

      const goodStudents = (() => {
        if (merged.goodStudents && Array.isArray(merged.goodStudents)) return merged.goodStudents;
        if (typeof merged.studentPerformanceGood === 'string') {
          return merged.studentPerformanceGood.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        return Array.isArray(merged.studentPerformanceGood) ? merged.studentPerformanceGood : [];
      })();

      const needsSupportStudents = (() => {
        if (merged.needsSupportStudents && Array.isArray(merged.needsSupportStudents)) return merged.needsSupportStudents;
        if (typeof merged.studentPerformanceBad === 'string') {
          return merged.studentPerformanceBad.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        return Array.isArray(merged.studentPerformanceBad) ? merged.studentPerformanceBad : [];
      })();

      return {
        ...merged,
        goodStudents,
        needsSupportStudents,
        openingTimeEnergizer: merged.openingTimeEnergizer || merged.energizer || "-",
        openingTimeRoadmap: merged.openingTimeRoadmap || objectiveText || "-",
        learningIndicators: indicators || "-",
        lessonIntroObjective: merged.lessonIntroObjective || merged.lessonHook || merged.lessonIntroduction || "-",
        newTopicIntro: merged.newTopicIntro || merged.teacherOwnNotes || merged.teachingNotes || "-",
        knowledgeBuilding: merged.knowledgeBuilding || merged.discussionPlan || "-",
        lessonActivity: activity || "-",
        outcomeFeedback: merged.outcomeFeedback || merged.activitySuccess || "-",
        closure: merged.closure || closureText || "-",
        unitChapterPage: merged.unitChapterPage || (merged.chapterName ? `${merged.chapterName}, Pg ${merged.pageFrom || ""}-${merged.pageTo || ""}` : undefined),
      };
    } catch (e) {
      console.error(e);
      return {};
    }
  };

  const getDeliveryDay = () => {
    if (!selectedPlan?.date) return "-";
    const dateObj = new Date(selectedPlan.date);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return "-";
  };

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
              onClick={() => setActiveTab('REVIEWED')}
              className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
                activeTab === 'REVIEWED' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Reviewed 
              <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
                activeTab === 'REVIEWED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {reviewedPlans.length}
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
                {approvedPlans.length}
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
                {completedPlans.length}
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
                {rejectedPlans.length}
              </span>
              {activeTab === 'REJECTED' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
              )}
            </button>
            {isApprover && (
              <button 
                onClick={() => setActiveTab('DRAFT')}
                className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
                  activeTab === 'DRAFT' ? 'text-slate-500' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Drafts 
                <span className={`ml-2 px-2.5 py-0.5 text-[10px] rounded-full font-black ${
                  activeTab === 'DRAFT' ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {draftPlans.length}
                </span>
                {activeTab === 'DRAFT' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-500 rounded-full" />
                )}
              </button>
            )}
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
                {isTeacher ? plans.filter(p => p.status !== 'DRAFT').length : plans.length}
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
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">LP ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Class & Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewed By</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved By</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingPlans ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading review ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedPlans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-20 text-center">
                      <div className="space-y-3">
                        <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">
                          {activeTab === 'PENDING' && "No pending reviews found"}
                          {activeTab === 'APPROVED' && "No approved plans found"}
                          {activeTab === 'REJECTED' && "No rejected plans found"}
                          {activeTab === 'DRAFT' && "No draft plans found"}
                          {activeTab === 'ALL' && "No lesson plans found"}
                        </p>
                        <p className="text-slate-400 text-xs italic">
                          {activeTab === 'PENDING' && "All submitted plans have been processed."}
                          {activeTab === 'APPROVED' && "Approved lesson plans will appear here."}
                          {activeTab === 'REJECTED' && "Rejected lesson plans will appear here."}
                          {activeTab === 'DRAFT' && "Saved drafts will appear here."}
                          {activeTab === 'ALL' && "Lesson plans submitted by teachers will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPlans.map(plan => (
                    <tr 
                      key={plan.id} 
                      className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors group ${plan.status !== "DRAFT" ? "cursor-pointer" : ""}`}
                      onClick={() => {
                        if (plan.status !== "DRAFT") {
                          selectPlanForReview(plan);
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">
                          {plan.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">
                            {plan.class?.name || plan.className || "—"}
                          </span>
                          <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors capitalize text-xs">{plan.subject?.name || plan.subject || "—"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{plan.type}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">
                        {plan.teacherProfile?.name || plan.teacherUser?.email?.split('@')[0] || "Teacher"}
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
                        {plan.status === "COMPLETED" && (
                          <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Signoff
                          </span>
                        )}
                        {plan.status === "REVIEWED" && (
                          <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Reviewed
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
                              {(() => {
                                const hasBeenReviewed = ["REVIEWED", "APPROVED", "COMPLETED"].includes(plan.status);
                                if (hasBeenReviewed) {
                                  if (plan.reviewerProfile?.name) {
                                    return plan.reviewerProfile.name;
                                  }
                                  if (plan.reviewerId) {
                                    if (plan.subject?.reviewer1 && (plan.subject.reviewer1.userId === plan.reviewerId || plan.subject.reviewer1.id === plan.reviewerId)) {
                                      return plan.subject.reviewer1.name;
                                    }
                                    if (plan.subject?.reviewer2 && (plan.subject.reviewer2.userId === plan.reviewerId || plan.subject.reviewer2.id === plan.reviewerId)) {
                                      return plan.subject.reviewer2.name;
                                    }
                                  }
                                }

                                const reviewerNames = [];
                                if (plan.subject?.reviewer1?.name) {
                                  reviewerNames.push(plan.subject.reviewer1.name);
                                }
                                if (plan.subject?.reviewer2?.name) {
                                  reviewerNames.push(plan.subject.reviewer2.name);
                                }
                                if (reviewerNames.length > 0) {
                                  return reviewerNames.join(" | ");
                                }
                                if (plan.specialistProfile?.name) {
                                  return plan.specialistProfile.name;
                                }
                                return "Reviewer";
                              })()}
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
                              {plan.principalProfile?.name || "Pending Approval"}
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
                          {plan.status !== "DRAFT" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectPlanForReview(plan);
                              }}
                              className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-colors active:scale-95 shadow-sm border-0"
                            >
                              {isApprover ? "Approve Plan" : "Review Plan"}
                            </button>
                          ) : (
                            <span className="px-4 py-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                              Incomplete
                            </span>
                          )}
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUndoStatus(plan);
                                }}
                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border-0"
                                title="Undo / Revert Status"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(plan.id);
                                }}
                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border-0"
                                title="Delete Lesson Plan"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
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

  // Detail View (Step10ReviewUI Paper Preview)
  const step1 = getStep1Data();
  const step2 = getStep2Data();

  // Show real reviewer if plan has been reviewed, else show both assigned reviewers as default
  const getReviewerNames = () => {
    const hasBeenReviewed = ["REVIEWED", "APPROVED", "COMPLETED"].includes(selectedPlan.status);
    if (hasBeenReviewed) {
      if (selectedPlan.reviewerProfile?.name) {
        return selectedPlan.reviewerProfile.name;
      }
      if (selectedPlan.reviewerId) {
        if (selectedPlan.subject?.reviewer1 && (selectedPlan.subject.reviewer1.userId === selectedPlan.reviewerId || selectedPlan.subject.reviewer1.id === selectedPlan.reviewerId)) {
          return selectedPlan.subject.reviewer1.name;
        }
        if (selectedPlan.subject?.reviewer2 && (selectedPlan.subject.reviewer2.userId === selectedPlan.reviewerId || selectedPlan.subject.reviewer2.id === selectedPlan.reviewerId)) {
          return selectedPlan.subject.reviewer2.name;
        }
      }
    }
    // Default: show both assigned reviewers so teacher knows who will review
    const assigned = [];
    if (selectedPlan.subject?.reviewer1?.name) assigned.push(selectedPlan.subject.reviewer1.name);
    if (selectedPlan.subject?.reviewer2?.name) assigned.push(selectedPlan.subject.reviewer2.name);
    return assigned.length > 0 ? assigned.join(" | ") : step1.reviewerName || step2.reviewerName || "Specialist";
  };

  const fullPlanData = {
    id: selectedPlan.id,
    className: selectedPlan.class?.name || step1.className || step2.className || "—",
    subject: selectedPlan.subject?.name || step1.subject || step2.subject || "—",
    chapterNo: step1.chapterNo || step2.chapterNo || "—",
    chapterName: step1.chapterName || step2.chapterName || "—",
    pageFrom: step1.pageFrom || step2.pageFrom || "—",
    pageTo: step1.pageTo || step2.pageTo || "—",
    prepDate: step1.prepDate || step2.prepDate || selectedPlan.date || "—",
    deliveryDate: step1.deliveryDate || step2.deliveryDate || selectedPlan.date || "—",
    preparedBy: step1.preparedBy || step2.preparedBy || selectedPlan.teacherProfile?.name || selectedPlan.teacherUser?.email?.split('@')[0] || "—",
    lessonType: selectedPlan.type === "QA" ? "Q&A" : (step1.lessonType || step2.lessonType || "Explanation"),
    ...step1,
    ...step2,
    reviewerRemark: selectedPlan.reviewerRemark || step2.reviewerRemark || step2.specialistFeedback || "",
    reviewerNote: selectedPlan.reviewerRemark || step2.reviewerNote || step2.specialistFeedback || "",
    specialistFeedback: selectedPlan.reviewerRemark || step2.specialistFeedback || step2.reviewerNote || "",
    principalRemark: selectedPlan.principalRemark || step2.principalRemark || step2.finalApprovalFeedback || "",
    approverNote: selectedPlan.principalRemark || step2.approverNote || step2.finalApprovalFeedback || "",
    finalApprovalFeedback: selectedPlan.principalRemark || step2.finalApprovalFeedback || step2.approverNote || "",
    reviewerName: getReviewerNames(),
    approverName: (selectedPlan as any).principalProfile?.name || "Pending Approval",
    status: selectedPlan.status,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
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
                {selectedPlan.status === "REVIEWED" && (
                  <span className="ml-3 px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Reviewed (Pending Approval)
                  </span>
                )}
                {selectedPlan.status === "COMPLETED" && (
                  <span className="ml-3 px-3 py-1 bg-teal-50 text-teal-600 border border-teal-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Completed
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500 font-medium">Validating content for {selectedPlan.subject?.name} ({selectedPlan.class?.name})</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-4 md:p-8 flex-1 lesson-plan-studio">
            <Step10ReviewUI
              lessonPlanData={fullPlanData}
              completionScore={100}
              isReviewerMode={true}
              onMarkReady={handleMarkReady}
              onPrint={() => window.print()}
              ownershipConfirmed={true}
              setOwnershipConfirmed={() => {}}
              submissionNote={""}
              setSubmissionNote={() => {}}
              classListStudents={classListStudents}
            />
          </div>

          <div className="p-8 md:p-12 bg-slate-900 text-white rounded-b-[2.5rem] space-y-6">
            <div className="space-y-4">
              {/* Show Specialist's Remark read-only if it exists and user is Approver */}
              {isApprover && selectedPlan.reviewerRemark && (
                <div className="mb-6">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4" /> Specialist / Reviewer Feedback
                  </label>
                  <div className="w-full bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-sm font-medium text-slate-300">
                    {selectedPlan.reviewerRemark}
                  </div>
                </div>
              )}

              {(() => {
                const principalName = selectedPlan.principalProfile?.name || "Principal";
                const reviewerNames = (() => {
                  const hasBeenReviewed = ["REVIEWED", "APPROVED", "COMPLETED"].includes(selectedPlan.status);
                  if (hasBeenReviewed) {
                    if (selectedPlan.reviewerProfile?.name) {
                      return selectedPlan.reviewerProfile.name;
                    }
                    if (selectedPlan.reviewerId) {
                      if (selectedPlan.subject?.reviewer1 && (selectedPlan.subject.reviewer1.userId === selectedPlan.reviewerId || selectedPlan.subject.reviewer1.id === selectedPlan.reviewerId)) {
                        return selectedPlan.subject.reviewer1.name;
                      }
                      if (selectedPlan.subject?.reviewer2 && (selectedPlan.subject.reviewer2.userId === selectedPlan.reviewerId || selectedPlan.subject.reviewer2.id === selectedPlan.reviewerId)) {
                        return selectedPlan.subject.reviewer2.name;
                      }
                    }
                  }

                  const names = [];
                  if (selectedPlan.subject?.reviewer1) {
                    const r1Name = selectedPlan.subject.reviewer1.name || selectedPlan.subject.reviewer1.id;
                    if (r1Name) names.push(r1Name);
                  }
                  if (selectedPlan.subject?.reviewer2) {
                    const r2Name = selectedPlan.subject.reviewer2.name || selectedPlan.subject.reviewer2.id;
                    if (r2Name) names.push(r2Name);
                  }
                  return names.length > 0 ? names.join(" | ") : (selectedPlan.specialistProfile?.name || "Reviewer");
                })();

                const displayPrincipal = principalName && principalName !== "Shared Principal Account" && principalName !== "Principal"
                  ? ` — ${principalName}` 
                  : "";

                const displayReviewer = reviewerNames && reviewerNames !== "Reviewer"
                  ? ` — ${reviewerNames}`
                  : "";

                return (
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                    <PenTool className="h-4 w-4" /> {isApprover 
                      ? `Final Approval Feedback${displayPrincipal}` 
                      : `Reviewer Feedback${displayReviewer}`}
                  </label>
                );
              })()}
              {isApprover && selectedPlan.status === "SUBMITTED" && (
                <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] mb-4 mt-2">
                  <Clock className="h-4 w-4" />
                  Pending for Specialist Reviewer
                </div>
              )}
              {(() => {
                const todayStr = new Date().toISOString().split("T")[0];
                const selectedDeliveryDate = selectedPlan?.deliveryDate || selectedPlan?.date || (selectedPlan?.step1Data ? (typeof selectedPlan.step1Data === 'string' ? JSON.parse(selectedPlan.step1Data).deliveryDate : selectedPlan.step1Data.deliveryDate) : "");

                const isReviewOverdue = selectedPlan?.status === "SUBMITTED" && selectedDeliveryDate && todayStr > selectedDeliveryDate;
                const isApproveOverdue = selectedPlan?.status === "REVIEWED" && selectedDeliveryDate && todayStr > selectedDeliveryDate;
                const isOverdue = isReviewOverdue || isApproveOverdue;

                const canTakeAction = !isOverdue && ((isTeacher && !isApprover && selectedPlan.status === "SUBMITTED") || (isApprover && selectedPlan.status === "REVIEWED"));

                return (
                  <>
                    {isReviewOverdue && (
                      <div className="flex items-center gap-3 p-4 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-2xl font-bold text-xs mb-4">
                        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                        <span>Overdue Review Restriction: The delivery date ({selectedDeliveryDate}) has passed. Specialist review cannot be submitted after the delivery date.</span>
                      </div>
                    )}
                    {isApproveOverdue && (
                      <div className="flex items-center gap-3 p-4 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-2xl font-bold text-xs mb-4">
                        <AlertTriangle className="h-5 w-5 text-purple-400 shrink-0" />
                        <span>Overdue Approval Restriction: The delivery date ({selectedDeliveryDate}) has passed. Principal approval cannot be issued after the delivery date.</span>
                      </div>
                    )}
                    <textarea 
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder={canTakeAction ? "Enter feedback for the teacher (Required for rejection)..." : "Actions restricted for this lesson plan..."}
                      readOnly={!canTakeAction}
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none overflow-hidden ${!canTakeAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-4">
              {(() => {
                const todayStr = new Date().toISOString().split("T")[0];
                const selectedDeliveryDate = selectedPlan?.deliveryDate || selectedPlan?.date || (selectedPlan?.step1Data ? (typeof selectedPlan.step1Data === 'string' ? JSON.parse(selectedPlan.step1Data).deliveryDate : selectedPlan.step1Data.deliveryDate) : "");
                const isOverdue = selectedDeliveryDate && todayStr > selectedDeliveryDate;

                if (isOverdue) return null;

                return (
                  <>
                    {/* Show Reject for Specialist (only on SUBMITTED) or Approver (only on REVIEWED) */}
                    {((isTeacher && !isApprover && selectedPlan.status === "SUBMITTED") || (isApprover && selectedPlan.status === "REVIEWED")) && (
                      <button 
                        onClick={() => handleAction("REJECTED")}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30 shadow-lg shadow-rose-500/10"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Reject & Send Back
                          </>
                        )}
                      </button>
                    )}

                    {/* Show Validate only for Specialists (not approvers) on SUBMITTED */}
                    {isTeacher && !isApprover && selectedPlan.status === "SUBMITTED" && (
                      <button 
                        onClick={() => handleAction("REVIEWED")}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-30"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Reviewing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Reviewed
                          </>
                        )}
                      </button>
                    )}

                    {/* Show Approve only for Approvers on REVIEWED */}
                    {isApprover && selectedPlan.status === "REVIEWED" && (
                      <button 
                        onClick={() => handleAction("APPROVED")}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30 disabled:opacity-30"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Approve Lesson Plan
                          </>
                        )}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
