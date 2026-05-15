"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  ChevronRight, 
  BookOpen, 
  Users, 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Image as ImageIcon,
  MessageSquare,
  User,
  ExternalLink,
  Eye
} from "lucide-react";
import { getSubmissionsByPlanAction, reviewHomeworkAction } from "@/features/academy/actions/homeworkActions";

interface HomeworkPlan {
  id: string;
  date: string;
  className: string;
  subjectName: string;
  submissionCount: number;
  pendingCount: number;
  homeworkPreview: string;
}

interface Submission {
    id: string;
    student: {
        id: number;
        name: string;
        studentId: string;
    };
    description: string;
    imagePath: string;
    status: string;
    submittedAt?: string;
    feedback: string;
}

export default function HomeworkManagementClient({ 
  plans,
  classes,
  subjects,
  reviewerId 
}: { 
  plans: HomeworkPlan[],
  classes: { id: number, name: string }[],
  subjects: { id: number, name: string }[],
  reviewerId: string
}) {
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('en-US', { month: 'long' }));
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const filteredPlans = plans.filter(plan => {
    const d = new Date(plan.date);
    const monthMatch = d.toLocaleString('en-US', { month: 'long' }) === selectedMonth;
    const classMatch = filterClass === "all" || plan.className === filterClass;
    const subjectMatch = filterSubject === "all" || plan.subjectName === filterSubject;
    return monthMatch && classMatch && subjectMatch;
  });

  useEffect(() => {
    if (selectedPlanId) {
        fetchSubmissions(selectedPlanId);
    }
  }, [selectedPlanId]);

  const fetchSubmissions = async (id: string) => {
    setLoadingSubs(true);
    const res = await getSubmissionsByPlanAction(id);
    if (res.success) {
        setSubmissions(res.data || []);
    }
    setLoadingSubs(false);
  };

  const handleReview = async (subId: string, status: "COMPLETED" | "REJECTED") => {
    if (subId.startsWith("missing-")) {
        alert("This student has not submitted homework yet.");
        return;
    }
    setReviewingId(subId);
    const res = await reviewHomeworkAction(subId, status, feedback, reviewerId);
    if (res.success) {
        alert("Status updated!");
        if (selectedPlanId) fetchSubmissions(selectedPlanId);
        setFeedback("");
    }
    setReviewingId(null);
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (selectedPlanId) {
    const plan = plans.find(p => p.id === selectedPlanId);
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <button 
                onClick={() => setSelectedPlanId(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-black uppercase text-[10px] tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm"
            >
                <ArrowLeft size={16} /> Back to Homework List
            </button>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6 pb-8 border-b border-slate-50">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">{plan?.className}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(plan?.date || "")}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{plan?.subjectName}</h2>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100/50 mt-4">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Homework Details</p>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed italic">"{plan?.homeworkPreview}"</p>
                        </div>
                    </div>
                    <div className="flex gap-4 h-fit">
                        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Class Total</p>
                                <p className="text-xl font-black text-slate-900">{submissions.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 space-y-4">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Student Submission Status</h3>
                        <div className="flex gap-2">
                             <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-bold">
                                 <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div> Pending
                             </div>
                             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold">
                                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Approved
                             </div>
                        </div>
                    </div>

                    {loadingSubs ? (
                        <div className="py-20 text-center animate-pulse">
                            <Clock size={32} className="mx-auto text-slate-200" />
                            <p className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading submissions...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {submissions.map(sub => (
                                <div key={sub.id} className={`bg-white border rounded-2xl p-6 transition-all ${
                                    sub.status === 'NOT_SUBMITTED' ? 'border-slate-50 opacity-60 bg-slate-50/20' : 'border-slate-100 shadow-sm hover:shadow-md'
                                }`}>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Student Info */}
                                        <div className="md:w-1/4 flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{sub.student.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{sub.student.studentId}</p>
                                            </div>
                                        </div>

                                        {/* Submission Details */}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    sub.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                    sub.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 
                                                    sub.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                                                }`}>
                                                    {sub.status.replace('_', ' ')}
                                                </div>
                                                {sub.submittedAt && (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{formatDate(sub.submittedAt)}</span>
                                                )}
                                            </div>
                                            
                                            {sub.status !== 'NOT_SUBMITTED' ? (
                                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                                    <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                                                        {sub.description || "No text description provided."}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="h-12 flex items-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                                                    Awaiting Submission...
                                                </div>
                                            )}

                                            {sub.imagePath && (
                                                <div className="flex items-center gap-4">
                                                     <a 
                                                        href={sub.imagePath} 
                                                        target="_blank" 
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                                    >
                                                        <Eye size={14} /> View Homework Image
                                                    </a>
                                                    <span className="text-[9px] font-bold text-slate-400 italic">Click to open full resolution photo</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Review Actions */}
                                        {sub.status !== 'NOT_SUBMITTED' && (
                                            <div className="md:w-1/3 space-y-3">
                                                <div className="relative">
                                                    <textarea 
                                                        defaultValue={sub.feedback}
                                                        onBlur={(e) => setFeedback(e.target.value)}
                                                        placeholder="Teacher feedback..."
                                                        className="w-full h-24 p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                    />
                                                    <MessageSquare size={14} className="absolute bottom-3 right-3 text-slate-200" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        disabled={sub.status === 'COMPLETED' || reviewingId === sub.id}
                                                        onClick={() => handleReview(sub.id, "COMPLETED")}
                                                        className="flex-1 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                                                    >
                                                        {reviewingId === sub.id ? "..." : (sub.status === 'COMPLETED' ? 'Approved' : 'Approve')}
                                                    </button>
                                                    <button 
                                                        disabled={sub.status === 'REJECTED' || reviewingId === sub.id}
                                                        onClick={() => handleReview(sub.id, "REJECTED")}
                                                        className="flex-1 py-3 bg-white border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-all disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Homework <span className="text-blue-600">Review</span></h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monitor and assess student submissions</p>
        </div>
        
        <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">To Review</p>
                    <p className="text-xl font-black text-slate-900">{plans.reduce((acc, p) => acc + p.pendingCount, 0)}</p>
                </div>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Completed</p>
                    <p className="text-xl font-black text-slate-900">{plans.reduce((acc, p) => acc + (p.submissionCount - p.pendingCount), 0)}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-2xl text-white">
          <Filter size={16} className="text-blue-400" />
          <span className="text-xs font-black uppercase tracking-widest">Filter By</span>
        </div>
        
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select 
          value={filterClass} 
          onChange={(e) => setFilterClass(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <select 
          value={filterSubject} 
          onChange={(e) => setFilterSubject(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4">
            <Search size={48} className="mx-auto text-slate-200" />
            <p className="text-slate-400 font-bold uppercase tracking-widest italic">No homework assignments found for this month</p>
          </div>
        ) : (
          filteredPlans.map(plan => (
            <div key={plan.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden hover:border-blue-200 transition-all flex flex-col">
                <div className="p-6 space-y-4 flex-1">
                    <div className="flex items-center justify-between">
                        <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                            {plan.className}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={12} />
                            <span className="text-[10px] font-bold">{formatDate(plan.date)}</span>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1">{plan.subjectName}</h4>
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-2 mt-1 italic uppercase tracking-tighter">
                            {plan.homeworkPreview}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Class</p>
                            <div className="flex items-center gap-2 text-slate-700 font-black">
                                <Users size={12} />
                                <span>{plan.submissionCount}</span>
                            </div>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                            <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending</p>
                            <div className="flex items-center gap-2 text-amber-700 font-black">
                                <Clock size={12} />
                                <span>{plan.pendingCount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Action Required</span>
                    <button 
                        onClick={() => setSelectedPlanId(plan.id)}
                        className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                        Review Submissions <ChevronRight size={14} />
                    </button>
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
