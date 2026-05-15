"use client";

import React, { useState, useEffect } from "react";
import { FileText, Save, Download, Loader2, Calendar, ClipboardList, PenTool } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { generateLessonPlanPdf } from "@/features/academy/utils/generateLessonPlanPdf";
import { saveLessonPlan } from "@/features/academy/actions/lessonPlanActions";
import { useRouter } from "next/navigation";
import { getSubjectUnitsAndChapters, getChapterDivisionsForLesson } from "@/features/academy/actions/academyActions";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Teacher Preparation, 2: Lesson Plan, 3: Delivery & Sign off
  const [lessonPlanMode, setLessonPlanMode] = useState("EXPLANATION"); // EXPLANATION, QA, PREPRIMARY
  
  const [unitsWithChapters, setUnitsWithChapters] = useState<any[]>([]);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);
  const [chapterDivisions, setChapterDivisions] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);

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

    // Timings Content (Explanation)
    openingTimeEnergizer: "",
    openingTimeRoadmap: "",
    learningIndicators: "",
    lessonIntroObjective: "",
    newTopicIntro: "",
    knowledgeBuilding: "",
    lessonActivity: "",
    outcomeFeedback: "",
    
    // Timings Content (Q&A)
    chapterSummaryRevision: "",
    chapterBasedQA: "",
    inspectionByTeacher: "",

    // Shared Step 2
    closure: "",
    prevDayCheck: "",

    // Footer Content
    teacherObservation: "",
    studentPerformanceGood: "",
    studentPerformanceBad: "",
    reviewerRemark: "",
  });

  // Handle Query Parameters for pre-filling
  useEffect(() => {
    const className = searchParams.get("class");
    const subject = searchParams.get("subject");
    const unitChapter = searchParams.get("unitChapter");
    const pages = searchParams.get("pages");
    const chapterId = searchParams.get("chapterId");
    const type = searchParams.get("type"); // Optional: for Add Homework mode

    if (className || subject || unitChapter || pages || chapterId) {
      setFormData(prev => ({
        ...prev,
        className: className || prev.className,
        subject: subject || prev.subject,
        unitChapterPage: unitChapter && pages ? `${unitChapter}, Pg ${pages}` : (unitChapter || pages || prev.unitChapterPage),
      }));

      if (chapterId) {
        setSelectedChapterId(parseInt(chapterId, 10));
      }

      if (type === "homework") {
        setActiveStep(1);
      }
    }
  }, [searchParams]);

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

  // Fetch Units/Chapters when subject changes
  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!formData.className || !formData.subject) {
        setUnitsWithChapters([]);
        return;
      }

      setIsLoadingCurriculum(true);
      try {
        const classObj = uniqueClasses.find(c => c.name === formData.className);
        const subjectObj = subjects.find(s => s.name === formData.subject && s.classId === classObj?.id);
        
        if (subjectObj) {
          const res = await getSubjectUnitsAndChapters(subjectObj.id);
          if (res.success && res.units) {
            setUnitsWithChapters(res.units);
            
            // If we have a selectedChapterId from URL, fetch its divisions
            if (selectedChapterId) {
              const divRes = await getChapterDivisionsForLesson(selectedChapterId);
              if (divRes.success) {
                setChapterDivisions(divRes.divisions || []);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch curriculum:", error);
      } finally {
        setIsLoadingCurriculum(false);
      }
    };

    fetchCurriculum();
  }, [formData.className, formData.subject, uniqueClasses, subjects]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // When class changes, reset subject
    if (name === "className") {
      setFormData(prev => ({ ...prev, [name]: value, subject: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (submitForValidation = false) => {
    if (!formData.className || !formData.subject) {
      alert("Please select Class and Subject first.");
      return;
    }
    
    if (submitForValidation && !confirm("Are you sure you want to submit this lesson plan for validation? You won't be able to edit it until it's reviewed.")) {
      return;
    }

    setIsSaving(true);
    try {
      const classObj = uniqueClasses.find(c => c.name === formData.className);
      const subjectObj = subjects.find(s => s.name === formData.subject && s.classId === classObj?.id);

      const res = await (saveLessonPlan as any)({
        classId: classObj?.id,
        subjectId: subjectObj?.id,
        date: formData.date,
        type: lessonPlanMode,
        status: submitForValidation ? "SUBMITTED" : "DRAFT",
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
          chapterSummaryRevision: formData.chapterSummaryRevision,
          chapterBasedQA: formData.chapterBasedQA,
          inspectionByTeacher: formData.inspectionByTeacher,
          closure: formData.closure,
          prevDayCheck: formData.prevDayCheck,
          teacherObservation: formData.teacherObservation,
          studentPerformanceGood: formData.studentPerformanceGood,
          studentPerformanceBad: formData.studentPerformanceBad,
          reviewerRemark: formData.reviewerRemark,
        }
      });

      if (res.success) {
        if (submitForValidation) {
          alert("Lesson Plan submitted for validation successfully!");
          router.push("/office/academy-management/lesson-plan/review");
        } else {
          alert("Lesson Plan saved as Draft!");
        }
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
          1. Teacher Preparation
        </button>
        <button
          onClick={() => setActiveStep(2)}
          className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${activeStep === 2
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
            }`}
        >
          2. LESSON PLAN
        </button>
        <button
          onClick={() => setActiveStep(3)}
          className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${activeStep === 3
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
            }`}
        >
          3. LESSON delivery & Sign off
        </button>
      </div>

      {/* 2. EXCEL-STYLE HEADER */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="border-b border-slate-300 h-16">
          <div className="flex items-center px-4 gap-4 overflow-x-auto h-full">
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

            {/* Division Selector in Header */}
            {chapterDivisions.length > 0 && (
              <div className="flex items-center gap-2 min-w-max ml-4 px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="text-[10px] font-black uppercase text-blue-400">Range:</span>
                <select
                  value={chapterDivisions.find(d => formData.unitChapterPage.includes(`Pg ${d.pageStart}-${d.pageEnd}`))?.id || ""}
                  onChange={(e) => {
                    const division = chapterDivisions.find(d => d.id === parseInt(e.target.value));
                    if (division) {
                      setFormData(prev => ({ 
                        ...prev, 
                        unitChapterPage: `${prev.unitChapterPage.split(', Pg')[0]}, Pg ${division.pageStart}-${division.pageEnd}` 
                      }));
                    }
                  }}
                  className="bg-transparent outline-none font-bold text-[11px] text-blue-600"
                >
                  <option value="">Select Range</option>
                  {chapterDivisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      Pg {division.pageStart}—{division.pageEnd}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {activeStep === 1 ? (
          /* --- STEP 1: TEACHER'S NOTE & HOMEWORK (EXACT EXCEL STYLE) --- */
          <div className="space-y-8 animate-in fade-in duration-300 bg-white">
            {/* Teacher's Note Table */}
            <div className="border border-black">
              {/* 1. TOP HEADER ROW */}
              <div className="grid grid-cols-12 border-b border-black divide-x divide-black h-12">
                <div className="col-span-6 flex items-center justify-center font-black text-2xl tracking-tight uppercase">1A. Teacher's Note</div>
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
              <div className="relative">
                <textarea
                  name="teacherNote"
                  value={formData.teacherNote}
                  onChange={handleChange}
                  rows={12}
                  className="w-full p-6 text-base font-medium outline-none resize-none border-none placeholder:text-slate-200"
                  placeholder="Enter your preparation notes here..."
                />
              </div>
            </div>

            {/* Homework Table */}
            <div className="border border-black">
              {/* 1. TOP HEADER ROW */}
              <div className="grid grid-cols-12 border-b border-black divide-x divide-black h-12">
                <div className="col-span-6 flex items-center justify-center font-black text-xl tracking-tight uppercase">1B. Today's Homework</div>
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
        ) : activeStep === 2 ? (
          /* --- STEP 2: LESSON PLAN (EXCEL-STYLE) --- */
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mode Switcher */}
            <div className="flex items-center gap-4 p-2 bg-slate-50 border border-slate-200 rounded-2xl w-full md:w-fit mx-auto">
              <button
                onClick={() => setLessonPlanMode("EXPLANATION")}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lessonPlanMode === "EXPLANATION" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                2A. Lesson Plan (EXPLANATION)
              </button>
              <button
                onClick={() => setLessonPlanMode("QA")}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lessonPlanMode === "QA" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                2B. Lesson Plan (Q & A)
              </button>
              <button
                onClick={() => setLessonPlanMode("PREPRIMARY")}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lessonPlanMode === "PREPRIMARY" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                2C. PRE-PRIMARY
              </button>
            </div>

            {lessonPlanMode === "EXPLANATION" || lessonPlanMode === "PREPRIMARY" ? (
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
                    <p className="text-lg font-black text-slate-800 uppercase italic">({lessonPlanMode === "EXPLANATION" ? "EXPLANATION" : "PRE-PRIMARY"})</p>
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
                    <select 
                      name="unitChapterPage" 
                      value={formData.unitChapterPage} 
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        handleChange(e);
                        
                        // Find the chapter and fetch its divisions
                        if (selectedValue && selectedValue !== "custom") {
                          let foundChapter: any = null;
                          
                          for (const unit of unitsWithChapters) {
                            const chapter = unit.chapters?.find((ch: any) => {
                              const value = unit.name === "NA" 
                                ? `${ch.name}, Pg ${ch.pageStart}-${ch.pageEnd}`
                                : `${unit.name}, ${ch.name}, Pg ${ch.pageStart}-${ch.pageEnd}`;
                              return value === selectedValue;
                            });
                            if (chapter) {
                              foundChapter = chapter;
                              break;
                            }
                          }
                          
                          if (foundChapter) {
                            setSelectedChapterId(foundChapter.id);
                            getChapterDivisionsForLesson(foundChapter.id).then(res => {
                              if (res.success) {
                                setChapterDivisions(res.divisions || []);
                              }
                            });
                          }
                        } else {
                          setChapterDivisions([]);
                          setSelectedChapterId(null);
                        }
                      }}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm appearance-none cursor-pointer"
                      disabled={isLoadingCurriculum || !formData.subject}
                    >
                      <option value="">{isLoadingCurriculum ? "Loading..." : "Select Unit/Chapter"}</option>
                      {unitsWithChapters.map(unit => (
                        <optgroup key={unit.id} label={unit.name === "NA" ? "Direct Chapters" : unit.name}>
                          {unit.chapters?.map((chapter: any) => {
                            const value = unit.name === "NA" 
                              ? `${chapter.name}, Pg ${chapter.pageStart}-${chapter.pageEnd}`
                              : `${unit.name}, ${chapter.name}, Pg ${chapter.pageStart}-${chapter.pageEnd}`;
                            return (
                              <option key={chapter.id} value={value}>
                                {chapter.chapterNo}. {chapter.name} (Pg {chapter.pageStart}-{chapter.pageEnd})
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                      <option value="custom">-- Custom Entry --</option>
                    </select>
                    {formData.unitChapterPage === "custom" && (
                      <input
                        type="text"
                        placeholder="Type manually..."
                        className="w-full ml-2 border-b border-slate-300 outline-none font-bold text-xs"
                        onChange={(e) => setFormData(prev => ({ ...prev, unitChapterPage: e.target.value }))}
                      />
                    )}
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Page Range:</div>
                  <div className="col-span-4 p-3 flex items-center">
                    <select
                      disabled={chapterDivisions.length === 0}
                      onChange={(e) => {
                        const division = chapterDivisions.find(d => d.id === parseInt(e.target.value));
                        if (division) {
                          setFormData(prev => ({ 
                            ...prev, 
                            unitChapterPage: `${prev.unitChapterPage.split(', Pg')[0]}, Pg ${division.pageStart}-${division.pageEnd}` 
                          }));
                        }
                      }}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm disabled:opacity-30 cursor-pointer"
                    >
                      <option value="">{chapterDivisions.length > 0 ? "Select Divided Pages" : "No Divisions Available"}</option>
                      {chapterDivisions.map((division) => (
                        <option key={division.id} value={division.id}>
                          Pages {division.pageStart} — {division.pageEnd}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* LP Prep Day Row */}
                <div className="grid grid-cols-10 border-b border-slate-300 h-14">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Day:</div>
                  <div className="col-span-4 p-3 flex items-center border-r border-slate-300">
                    <select name="prepDay" value={formData.prepDay} onChange={handleChange} className="w-full bg-transparent font-bold text-sm outline-none">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Date:</div>
                  <div className="col-span-4 p-3 flex items-center">
                    <input type="date" name="prepDate" value={formData.prepDate} onChange={handleChange} className="bg-transparent font-bold text-sm outline-none w-full" />
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

                </div>
              ) : (
              /* --- LESSON PLAN (Q & A) --- */
              <div className="border border-slate-300 rounded-[1.5rem] overflow-hidden bg-white shadow-xl">
                {/* Header Row */}
                <div className="grid grid-cols-12 border-b border-slate-300">
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
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400">Your LP No.</span>
                      <span className="text-sm font-black text-slate-800 border-b border-slate-200 min-w-[40px] text-center">{formData.lpNo || "____"}</span>
                    </div>
                  </div>
                </div>

                {/* Meta Grid (Q & A Style) */}
                <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
                  <div className="grid grid-cols-4 h-12">
                    <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Subject:</div>
                    <div className="col-span-3 p-3 flex items-center font-bold text-sm truncate">{formData.subject || "-"}</div>
                  </div>
                  <div className="grid grid-cols-4 h-12">
                    <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Grade:</div>
                    <div className="col-span-3 p-3 flex items-center font-bold text-sm truncate">{formData.className || "-"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
                  <div className="grid grid-cols-4 h-12">
                    <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Unit/Chapter/Page(s):</div>
                    <div className="col-span-3 p-3 flex items-center font-bold text-sm truncate">{formData.unitChapterPage || "-"}</div>
                  </div>
                  <div className="grid grid-cols-4 h-12">
                    <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Day/Date:</div>
                    <div className="col-span-3 p-3 flex items-center font-bold text-xs truncate">{formData.prepDay}, {formData.prepDate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
                  <div className="grid grid-cols-4 h-12">
                    <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Progress Status:</div>
                    <div className="col-span-3 p-3 flex items-center font-bold text-xs">
                      <select name="progressStatus" value={formData.progressStatus} onChange={handleChange} className="bg-transparent border-none outline-none font-bold text-sm cursor-pointer">
                        {["Not Started", "In Progress", "Completed", "Pending Review"].map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 h-12">
                    <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Delivery Day/Date:</div>
                    <div className="col-span-3 p-3 flex items-center font-bold text-xs truncate">{formData.deliveryDay}, {formData.date}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
                  <div className="grid grid-cols-4 h-12">
                    <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Teacher Name/Sign:</div>
                    <div className="col-span-3 p-3 flex items-center font-bold text-sm truncate">{formData.teacherName || "______"}</div>
                  </div>
                  <div className="grid grid-cols-4 h-12">
                    <div className="p-3 bg-slate-50/50 flex items-center font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Reviewer/Principal:</div>
                    <div className="col-span-3 p-3 flex items-center h-full">
                      <input name="reviewerPrincipal" value={formData.reviewerPrincipal} onChange={handleChange} className="w-full bg-transparent border-none outline-none font-bold text-sm" placeholder="Reviewer Signature..." />
                    </div>
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
                  <div className="col-span-1 p-4 flex flex-col items-center justify-center border-r border-slate-300 gap-1">
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

                {/* Opening Time (Shared Layout) */}
                <div className="grid grid-cols-12 border-b border-slate-200">
                  <div className="col-span-2 p-4 flex flex-col items-center justify-center border-r border-slate-300 text-slate-700 bg-slate-50/30 row-span-2 min-h-[120px]">
                    <span className="font-black text-[10px] uppercase">Opening Time</span>
                    <span className="font-black text-[10px] mt-1 tracking-widest text-blue-600">घेरा समय</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-2">(5mins)</span>
                  </div>
                  <div className="col-span-1 p-4 flex items-center justify-center font-bold text-xs border-r border-slate-300 border-b">2 minutes</div>
                  <div className="col-span-2 p-4 flex items-center border-r border-slate-300 border-b font-medium text-[11px] text-slate-600 leading-tight">Lead the students to perform an energizer/fun activity</div>
                  <div className="col-span-7 p-4 border-b">
                    <textarea name="openingTimeEnergizer" value={formData.openingTimeEnergizer} onChange={handleChange} rows={2} className="w-full bg-transparent border-none outline-none font-bold text-sm resize-none" placeholder="Describe the activity..." />
                  </div>

                  <div className="contents">
                    <div className="col-span-1 p-4 flex items-center justify-center font-bold text-xs border-r border-slate-300">3 minutes</div>
                    <div className="col-span-2 p-4 flex flex-col justify-center border-r border-slate-300">
                      <p className="font-bold text-[11px] text-slate-600">Roadmap of the day</p>
                    </div>
                    <div className="col-span-7 grid grid-cols-12 divide-x divide-slate-100">
                      <div className="col-span-8 p-3 flex flex-col gap-2">
                        <textarea name="openingTimeRoadmap" value={formData.openingTimeRoadmap} onChange={handleChange} rows={2} className="w-full bg-transparent outline-none font-bold text-[11px] resize-none" placeholder="1. Revision of previous class..." />
                      </div>
                      <div className="col-span-4 p-3 flex flex-col gap-2 bg-slate-50/50">
                        <span className="text-[8px] font-black uppercase text-slate-400">Learning Indicators:</span>
                        <textarea name="learningIndicators" value={formData.learningIndicators} onChange={handleChange} rows={2} className="w-full bg-transparent outline-none font-bold text-[11px] resize-none" placeholder="1. ..." />
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
                      <div className="col-span-7 p-3">
                        <textarea name="chapterSummaryRevision" value={formData.chapterSummaryRevision} onChange={handleChange} className="w-full h-full bg-transparent outline-none font-bold text-xs resize-none" placeholder="Write key summary points..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-10 h-48">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs italic text-blue-600">25 Minutes</div>
                      <div className="col-span-2 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-snug italic">
                        Chapter Based Question Answer - Discussion - Dictation By Teacher And Writing By Students
                      </div>
                      <div className="col-span-7 p-4">
                        <textarea name="chapterBasedQA" value={formData.chapterBasedQA} onChange={handleChange} className="w-full h-full bg-transparent outline-none font-bold text-xs resize-none border-t border-slate-50 pt-2" placeholder="List questions, dictation points, and student tasks..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-10 h-20">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs italic">3 Minutes</div>
                      <div className="col-span-2 flex items-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight italic">Inspection By Teacher</div>
                      <div className="col-span-7 p-3">
                        <textarea name="inspectionByTeacher" value={formData.inspectionByTeacher} onChange={handleChange} className="w-full h-full bg-transparent outline-none font-bold text-xs resize-none" placeholder="Observations during student writing..." />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Closing Time (Shared Layout but Q & A specific text) */}
                <div className="grid grid-cols-12 h-64 border-b border-slate-300">
                  <div className="col-span-2 flex flex-col items-center justify-center border-r border-slate-300 text-slate-700 bg-slate-50/30 p-4">
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
                      <div className="col-span-7 p-3">
                        <input name="closure" value={formData.closure} onChange={handleChange} className="w-full bg-transparent outline-none font-bold text-sm" placeholder="Appreciate students..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-10">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs">2 Minute</div>
                      <div className="col-span-2 flex items-center justify-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight text-center italic">
                        Homework for the day
                      </div>
                      <div className="col-span-7 p-3 font-bold text-slate-400 italic text-[10px] flex items-center">
                        <ClipboardList className="h-3 w-3 mr-2" />
                        Automated sync from Step 1 Homework Space
                      </div>
                    </div>
                    <div className="grid grid-cols-10">
                      <div className="col-span-1 flex items-center justify-center border-r border-slate-300 font-bold text-xs text-rose-500">2 Minute</div>
                      <div className="col-span-2 flex items-center justify-center p-4 border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight text-center italic">
                        Submission of Previous day work check
                      </div>
                      <div className="col-span-7 p-3">
                        <input name="prevDayCheck" value={formData.prevDayCheck} onChange={handleChange} className="w-full bg-transparent outline-none font-bold text-sm" placeholder="Check student work..." />
                      </div>
                    </div>
                  </div>
                </div>


                <div className="bg-slate-50 p-6 border-t border-slate-300">
                  <p className="text-[10px] font-black uppercase text-slate-400 text-center tracking-[0.3em] italic">End of Lesson Plan (Q & A)</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* --- STEP 3: LESSON DELIVERY & SIGN OFF --- */
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
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
                <textarea 
                  name="teacherObservation" 
                  value={formData.teacherObservation} 
                  onChange={handleChange} 
                  className="w-full h-40 p-6 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none font-medium text-sm resize-none focus:bg-white focus:border-blue-200 transition-all placeholder:text-slate-300" 
                  placeholder="Write observations here..." 
                />
              </div>

              {/* Student Performance Section */}
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-black text-[10px] uppercase shadow-sm">Good</div>
                    <h4 className="font-black text-slate-600 text-xs uppercase tracking-widest">Student Performance (Positive)</h4>
                  </div>
                  <textarea 
                    name="studentPerformanceGood" 
                    value={formData.studentPerformanceGood} 
                    onChange={handleChange} 
                    className="w-full h-32 p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl outline-none font-bold text-xs resize-none focus:bg-white focus:border-emerald-200 transition-all" 
                    placeholder="Note positive highlights..." 
                  />
                </div>
                <div className="flex-1 space-y-4 border-l border-slate-100 md:pl-8">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center font-black text-[10px] uppercase shadow-sm">Bad</div>
                    <h4 className="font-black text-slate-600 text-xs uppercase tracking-widest">Student Performance (Concerns)</h4>
                  </div>
                  <textarea 
                    name="studentPerformanceBad" 
                    value={formData.studentPerformanceBad} 
                    onChange={handleChange} 
                    className="w-full h-32 p-4 bg-rose-50/30 border border-rose-100 rounded-xl outline-none font-bold text-xs resize-none focus:bg-white focus:border-rose-200 transition-all" 
                    placeholder="Note areas for improvement..." 
                  />
                </div>
              </div>

              {/* Reviewer Section */}
              <div className="p-8 bg-slate-50/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 bg-slate-800 text-white rounded-lg flex items-center justify-center font-black text-xs uppercase shadow-sm">3B</div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tight">Reviewer Remark and Signoff</h4>
                </div>
                <textarea 
                  name="reviewerRemark" 
                  value={formData.reviewerRemark} 
                  onChange={handleChange} 
                  className="w-full h-32 p-6 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm resize-none shadow-sm focus:border-slate-400 transition-all" 
                  placeholder="Reviewer feedback goes here..." 
                />
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


      {/* 3. SIMPLIFIED FOOTER */}
      <div className="border border-slate-300 bg-white p-8">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-6 py-3 border border-slate-200 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <ClipboardList className="h-3 w-3" />}
            Submit for Validation
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
