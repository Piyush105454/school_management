"use client";

import React, { useState } from "react";
import { FileText, Save, Download, Loader2, Calendar, ClipboardList, PenTool } from "lucide-react";
import { generateLessonPlanPdf } from "@/features/academy/utils/generateLessonPlanPdf";
import { saveLessonPlan } from "@/features/academy/actions/lessonPlanActions";

interface AcademicClass {
  id: number;
  name: string;
}

interface AcademicSubject {
  id: number;
  classId: number;
  name: string;
}

interface LessonPlanFormProps {
  classes: AcademicClass[];
  subjects: AcademicSubject[];
}

export default function LessonPlanForm({ classes, subjects }: LessonPlanFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Teacher's Note, 2: Lesson Plan
  const [lessonPlanMode, setLessonPlanMode] = useState("EXPLANATION"); // EXPLANATION, QA

  const [formData, setFormData] = useState({
    // Common Meta
    deliveryDay: "Monday",
    date: new Date().toISOString().split('T')[0],
    lpNo: "",
    className: "",
    subject: "",
    teacherName: "",

    // Step 1: Teacher's Note
    teacherNote: "",
    homework: "", // User previously asked to remove defaults

    // Step 2: Lesson Plan Details (Excel Fields)
    unitChapterPage: "",
    prepDay: "Monday",
    prepDate: new Date().toISOString().split('T')[0],
    progressStatus: "Not Started",
    reviewerPrincipal: "",

    // Timings Content
    openingTimeEnergizer: "",
    openingTimeRoadmap: "",
    learningIndicators: "",
    lessonIntroObjective: "",
    newTopicIntro: "",
    knowledgeBuilding: "",
    lessonActivity: "",
    outcomeFeedback: "",
    closure: "",
    prevDayCheck: "",

    // Footer Content
    teacherObservation: "",
    studentPerformanceGood: "",
    studentPerformanceBad: "",
    reviewerRemark: "",
  });

  // Filter out any duplicates from classes and remove "Nursery"
  const uniqueClasses = React.useMemo(() => {
    const seen = new Set();
    return classes.filter(c => {
      // Normalize: "Class 1" -> "1", "LKG" -> "lkg"
      const normalized = c.name.trim().toLowerCase().replace(/^class\s+/i, "");

      if (normalized === "nursery") return false;

      const isDuplicate = seen.has(normalized);
      seen.add(normalized);
      return !isDuplicate;
    });
  }, [classes]);

  // Calculate filtered subjects based on selected class
  const filteredSubjects = React.useMemo(() => {
    if (!formData.className) return [];
    const classObj = uniqueClasses.find(c => c.name === formData.className);
    if (!classObj) return [];
    return subjects.filter(s => s.classId === classObj.id);
  }, [formData.className, uniqueClasses, subjects]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // When class changes, reset subject
    if (name === "className") {
      setFormData(prev => ({ ...prev, [name]: value, subject: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.className || !formData.subject) {
      alert("Please select Class and Subject first.");
      return;
    }

    setIsSaving(true);
    try {
      const classObj = uniqueClasses.find(c => c.name === formData.className);
      const subjectObj = subjects.find(s => s.name === formData.subject && s.classId === classObj?.id);

      const res = await saveLessonPlan({
        classId: classObj?.id,
        subjectId: subjectObj?.id,
        date: formData.date,
        type: lessonPlanMode,
        step1Data: {
          teacherNote: formData.teacherNote,
          homework: formData.homework
        },
        step2Data: {
          unitChapterPage: formData.unitChapterPage,
          prepDay: formData.prepDay,
          prepDate: formData.prepDate,
          progressStatus: formData.progressStatus,
          openingTimeEnergizer: formData.openingTimeEnergizer,
          openingTimeRoadmap: formData.openingTimeRoadmap,
          learningIndicators: formData.learningIndicators,
          lessonIntroObjective: formData.lessonIntroObjective,
          newTopicIntro: formData.newTopicIntro,
          knowledgeBuilding: formData.knowledgeBuilding,
          lessonActivity: formData.lessonActivity,
          outcomeFeedback: formData.outcomeFeedback,
          closure: formData.closure,
          prevDayCheck: formData.prevDayCheck,
          teacherObservation: formData.teacherObservation,
          studentPerformanceGood: formData.studentPerformanceGood,
          studentPerformanceBad: formData.studentPerformanceBad,
          reviewerRemark: formData.reviewerRemark,
        }
      });

      if (res.success) {
        alert("Lesson Plan saved successfully!");
      } else {
        alert("Error saving lesson plan: " + res.error);
      }
    } catch (error: any) {
      alert("Failed to save: " + error.message);
    } finally {
      setIsSaving(false);
    }
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
    <div className="max-w-7xl mx-auto space-y-6 pb-24 text-slate-900">
      {/* 1. MINIMAL STEP SELECTOR */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveStep(1)}
          className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${activeStep === 1
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
            }`}
        >
          1. TEACHER'S NOTE & HOMEWORK
        </button>
        <button
          onClick={() => setActiveStep(2)}
          className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${activeStep === 2
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
            }`}
        >
          2. LESSON PLAN estrategies
        </button>
      </div>

      {/* 2. EXCEL-STYLE HEADER */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 border-b border-slate-300 h-16 divide-x divide-slate-300">
          <div className="col-span-4 flex items-center px-6 bg-slate-50 font-black uppercase tracking-widest text-sm">
            Academic Management
          </div>
          <div className="col-span-8 flex items-center px-4 gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400">Class:</span>
              <select
                name="className"
                value={formData.className}
                onChange={handleChange}
                className="bg-transparent border-b border-slate-200 outline-none font-bold text-xs py-1"
              >
                <option value="">Select</option>
                {uniqueClasses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400">Subject:</span>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={!formData.className}
                className="bg-transparent border-b border-slate-200 outline-none font-bold text-xs py-1 disabled:opacity-30"
              >
                <option value="">Select</option>
                {filteredSubjects.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400">Day:</span>
              <select
                name="deliveryDay"
                value={formData.deliveryDay}
                onChange={handleChange}
                className="bg-transparent border-b border-slate-200 outline-none font-bold text-xs py-1"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400">Date:</span>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="bg-transparent border-b border-slate-200 outline-none font-bold text-xs py-1"
              />
            </div>
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400">LP No:</span>
              <input
                type="text"
                name="lpNo"
                value={formData.lpNo}
                onChange={handleChange}
                placeholder="No."
                className="w-12 bg-transparent border-b border-slate-200 outline-none font-bold text-xs py-1"
              />
            </div>
          </div>
        </div>

        {activeStep === 1 ? (
          /* --- STEP 1: TEACHER'S NOTE & HOMEWORK (EXACT EXCEL STYLE) --- */
          <div className="space-y-8 animate-in fade-in duration-300 bg-white">
            {/* Teacher's Note Table */}
            <div className="border border-black">
              {/* 1. TOP HEADER ROW */}
              <div className="grid grid-cols-12 border-b border-black divide-x divide-black h-12">
                <div className="col-span-6 flex items-center justify-center font-black text-2xl tracking-tight">Teacher's Note</div>
                <div className="col-span-6 grid grid-cols-3 divide-x divide-black h-full">
                  <div className="flex items-center px-2 text-[10px] font-bold">LP Delivery Day <span className="ml-1 border-b border-black flex-1 min-w-[50px]">{formData.deliveryDay}</span></div>
                  <div className="flex items-center px-2 text-[10px] font-bold">Date: <span className="ml-1 border-b border-black flex-1 min-w-[50px]">{formData.date}</span></div>
                  <div className="flex items-center px-2 text-[10px] font-bold whitespace-nowrap">Your LP No. <span className="ml-1 border-b border-black flex-1 min-w-[30px]">{formData.lpNo}</span></div>
                </div>
              </div>

              {/* 2. INSTRUCTION GRID */}
              <div className="grid grid-cols-2 border-b border-black divide-x divide-black text-[11px] leading-snug">
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

              {/* 3. WRITING SPACE */}
              <textarea
                name="teacherNote"
                value={formData.teacherNote}
                onChange={handleChange}
                rows={12}
                className="w-full p-6 text-base font-medium outline-none resize-none border-none placeholder:text-slate-200"
                placeholder="Enter your preparation notes here..."
              />
            </div>

            {/* Homework Table */}
            <div className="border border-black">
              {/* 1. TOP HEADER ROW */}
              <div className="grid grid-cols-12 border-b border-black divide-x divide-black h-12">
                <div className="col-span-6 flex items-center justify-center font-black text-xl tracking-tight">Today's Homework (For Students & Parents)</div>
                <div className="col-span-6 grid grid-cols-3 divide-x divide-black h-full">
                  <div className="flex items-center px-2 text-[10px] font-bold truncate">Class: <span className="ml-1 border-b border-black flex-1">{formData.className}</span></div>
                  <div className="flex items-center px-2 text-[10px] font-bold truncate">Subject: <span className="ml-1 border-b border-black flex-1">{formData.subject}</span></div>
                  <div className="flex items-center px-2 text-[10px] font-bold truncate">Date: <span className="ml-1 border-b border-black flex-1">{formData.date}</span></div>
                </div>
              </div>

              {/* 2. INSTRUCTION GRID */}
              <div className="grid grid-cols-2 border-b border-black divide-x divide-black text-[11px] leading-snug">
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

              {/* 3. WRITING SPACE */}
              <textarea
                name="homework"
                value={formData.homework}
                onChange={handleChange}
                rows={8}
                className="w-full p-6 text-base font-medium outline-none resize-none border-none placeholder:text-slate-200"
                placeholder="Enter student homework assignments here..."
              />
            </div>
          </div>
        ) : (
          /* --- STEP 2: LESSON PLAN (EXCEL-STYLE) --- */
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mode Switcher */}
            <div className="flex items-center gap-4 p-2 bg-slate-50 border border-slate-200 rounded-2xl w-full md:w-fit mx-auto">
              <button
                onClick={() => setLessonPlanMode("EXPLANATION")}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lessonPlanMode === "EXPLANATION" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                Lesson Plan (EXPLANATION)
              </button>
              <button
                onClick={() => setLessonPlanMode("QA")}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lessonPlanMode === "QA" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                Lesson Plan (Q & A)
              </button>
            </div>

            {lessonPlanMode === "EXPLANATION" ? (
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
                    <p className="text-lg font-black text-slate-800 uppercase italic">(EXPLANATION)</p>
                  </div>
                </div>

                {/* Meta Rows (Grid style) */}
                <div className="grid grid-cols-10 border-b border-slate-300 h-14">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Subject:</div>
                  <div className="col-span-4 p-3 flex items-center font-bold text-sm border-r border-slate-300 truncate">{formData.subject || "-"}</div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Grade:</div>
                  <div className="col-span-4 p-3 flex items-center font-bold text-sm truncate">{formData.className || "-"}</div>
                </div>

                <div className="grid grid-cols-10 border-b border-slate-300 h-14">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Unit/Chapter:</div>
                  <div className="col-span-4 p-3 flex items-center border-r border-slate-300">
                    <input name="unitChapterPage" value={formData.unitChapterPage} onChange={handleChange} className="w-full bg-transparent border-none outline-none font-bold text-sm" placeholder="e.g. Unit 3, Chapter 4, Pg 12-15" />
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Day:</div>
                  <div className="col-span-4 p-3 flex items-center truncate">
                    <select name="prepDay" value={formData.prepDay} onChange={handleChange} className="bg-transparent font-bold text-sm outline-none">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
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
                  <div className="col-span-6 p-6">
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
                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-2 p-4 flex items-center justify-center font-black text-[10px] uppercase border-r border-slate-300 text-slate-700 bg-slate-50/30 row-span-2 min-h-[120px]">Opening time (5 min)</div>
                  <div className="col-span-1 p-4 flex items-center justify-center font-bold text-xs border-r border-slate-300 border-b">2 min</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b font-medium text-[11px] text-slate-600">Lead students to perform an energizer/fun activity</div>
                  <div className="col-span-6 p-4 border-b">
                    <textarea name="openingTimeEnergizer" value={formData.openingTimeEnergizer} onChange={handleChange} rows={2} className="w-full bg-transparent border-none outline-none font-bold text-sm resize-none" placeholder="Describe the activity..." />
                  </div>

                  <div className="contents">
                    <div className="col-span-1 p-4 flex items-center justify-center font-bold text-xs border-r border-slate-300">3 min</div>
                    <div className="col-span-3 p-4 flex flex-col justify-center border-r border-slate-300">
                      <p className="font-bold text-[11px] text-slate-600 mb-2">Roadmap of the day & Learning Indicators</p>
                    </div>
                    <div className="col-span-6 p-4 grid grid-cols-2 gap-4">
                      <textarea name="openingTimeRoadmap" value={formData.openingTimeRoadmap} onChange={handleChange} rows={2} className="w-full bg-white border border-slate-100 rounded-lg p-2 font-bold text-xs" placeholder="Roadmap detail..." />
                      <textarea name="learningIndicators" value={formData.learningIndicators} onChange={handleChange} rows={2} className="w-full bg-white border border-slate-100 rounded-lg p-2 font-bold text-xs" placeholder="Indicators 1, 2, 3..." />
                    </div>
                  </div>
                </div>

                {/* Active Learning Time */}
                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-2 p-4 flex items-center justify-center font-black text-center text-[10px] uppercase border-r border-slate-300 text-slate-700 bg-slate-50/30 min-h-[300px]">Active Learning Time (30 min)</div>
                  <div className="col-span-10 grid grid-rows-4 divide-y divide-slate-300">
                    <div className="grid grid-cols-10 h-16">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">2 min</div>
                      <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600">Lesson Intro & Objective</div>
                      <div className="col-span-6 p-3">
                        <input name="lessonIntroObjective" value={formData.lessonIntroObjective} onChange={handleChange} className="w-full bg-transparent outline-none font-bold text-sm" placeholder="..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-10 h-24">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">8 min</div>
                      <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight">New topic Introduction & Explanation</div>
                      <div className="col-span-6 p-3">
                        <textarea name="newTopicIntro" value={formData.newTopicIntro} onChange={handleChange} className="w-full bg-transparent outline-none font-bold text-xs resize-none h-full" placeholder="..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-10 h-24">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">5 min</div>
                      <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600">Knowledge Building / Discussion</div>
                      <div className="col-span-6 p-3">
                        <textarea name="knowledgeBuilding" value={formData.knowledgeBuilding} onChange={handleChange} className="w-full bg-transparent outline-none font-bold text-xs resize-none h-full" placeholder="..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-10 h-32">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">15 min</div>
                      <div className="col-span-3 flex flex-col p-4 border-r border-slate-300 justify-center">
                        <p className="font-bold text-[11px] text-slate-600">Lesson Activity & Outcome Feedback</p>
                      </div>
                      <div className="col-span-6 p-3 grid grid-rows-2 divide-y divide-slate-100">
                        <textarea name="lessonActivity" value={formData.lessonActivity} onChange={handleChange} className="w-full py-2 bg-transparent outline-none font-bold text-xs resize-none" placeholder="Activity details..." />
                        <textarea name="outcomeFeedback" value={formData.outcomeFeedback} onChange={handleChange} className="w-full py-2 bg-transparent outline-none font-bold text-xs resize-none" placeholder="Feedback/Learning outcome..." />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Closing Time */}
                <div className="grid grid-cols-12 h-48 border-b border-slate-300">
                  <div className="col-span-2 flex items-center justify-center font-black text-center text-[10px] uppercase border-r border-slate-300 text-slate-700 bg-slate-50/30">Closing Time (5 min)</div>
                  <div className="col-span-10 grid grid-rows-3 divide-y divide-slate-300">
                    <div className="grid grid-cols-10">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">1 min</div>
                      <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600">Closure, Reward & Recognition</div>
                      <div className="col-span-6 p-3"><input name="closure" value={formData.closure} onChange={handleChange} className="w-full bg-transparent outline-none font-bold text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-10">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">2 min</div>
                      <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600">Homework for the day</div>
                      <div className="col-span-6 p-3 font-bold text-slate-400 italic text-[10px] flex items-center">Synced from Step 1 Homework Space</div>
                    </div>
                    <div className="grid grid-cols-10">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">2 min</div>
                      <div className="col-span-3 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight">Submission of Previous day work check</div>
                      <div className="col-span-6 p-3"><input name="prevDayCheck" value={formData.prevDayCheck} onChange={handleChange} className="w-full bg-transparent outline-none font-bold text-sm" /></div>
                    </div>
                  </div>
                </div>

                {/* Observation Footer */}
                <div className="grid grid-cols-2 divide-x divide-slate-300 h-40 border-b border-slate-300">
                  <div className="flex flex-col">
                    <div className="bg-slate-50 p-2 border-b border-slate-300 font-black text-[9px] uppercase tracking-widest text-slate-500">Teacher Observation:</div>
                    <textarea name="teacherObservation" value={formData.teacherObservation} onChange={handleChange} className="flex-1 p-4 bg-transparent outline-none font-bold text-xs resize-none" placeholder="Write observations here..." />
                  </div>
                  <div className="flex flex-col">
                    <div className="bg-slate-50 p-2 border-b border-slate-300 font-black text-[9px] uppercase tracking-widest text-slate-500 text-center">Student Performance:</div>
                    <div className="flex-1 grid grid-cols-2 divide-x divide-slate-300">
                      <div className="flex flex-col">
                        <div className="p-1 border-b border-slate-100 text-center font-black text-[8px] text-emerald-600 bg-emerald-50/50 uppercase">Good</div>
                        <textarea name="studentPerformanceGood" value={formData.studentPerformanceGood} onChange={handleChange} className="flex-1 p-3 bg-transparent outline-none font-bold text-[10px] resize-none" placeholder="..." />
                      </div>
                      <div className="flex flex-col">
                        <div className="p-1 border-b border-slate-100 text-center font-black text-[8px] text-rose-600 bg-rose-50/50 uppercase">Bad</div>
                        <textarea name="studentPerformanceBad" value={formData.studentPerformanceBad} onChange={handleChange} className="flex-1 p-3 bg-transparent outline-none font-bold text-[10px] resize-none" placeholder="..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 border-b border-slate-300 font-black text-[9px] uppercase tracking-widest text-slate-500">Reviewer Remark & Feedback:</div>
                <textarea name="reviewerRemark" value={formData.reviewerRemark} onChange={handleChange} className="w-full h-24 p-6 bg-transparent outline-none font-bold text-sm resize-none shadow-inner" placeholder="..." />
              </div>
            ) : (
              <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-24 text-center">
                < PenTool className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest">Question & Answer Mode Layout Coming Soon</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. SIMPLIFIED FOOTER */}
      <div className="border border-slate-300 bg-white p-8 space-y-8">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8">
          <div className="flex-1 w-full space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teacher's Name & Signature:</label>
            <input
              type="text"
              name="teacherName"
              value={formData.teacherName}
              onChange={handleChange}
              placeholder="Type your name here..."
              className="w-full border-b border-slate-300 py-2 outline-none font-bold text-lg placeholder:text-slate-200"
            />
          </div>
          <div className="w-full md:w-48 text-center space-y-1">
            <div className="h-16 border border-dashed border-slate-300 flex items-center justify-center text-slate-200">
              <PenTool className="h-6 w-6" />
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Stamp Area</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 border border-slate-200 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save Draft
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
