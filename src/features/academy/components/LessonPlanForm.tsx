"use client";

import React, { useState, useEffect } from "react";
import { FileText, Save, Download, Loader2, Calendar, ClipboardList, PenTool, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { generateLessonPlanPdf } from "@/features/academy/utils/generateLessonPlanPdf";
import { saveLessonPlan, getLessonPlanCount, getLessonPlanByDateAndSubject, getLessonPlanById } from "@/features/academy/actions/lessonPlanActions";
import { useRouter } from "next/navigation";
import { getSubjectUnitsAndChapters, getChapterDivisionsForLesson } from "@/features/academy/actions/academyActions";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import "katex/dist/katex.min.css";
import "@excalidraw/excalidraw/index.css";
import katex from "katex";
import DrawingModal from "./DrawingModal";

// Ensure katex is available globally for Quill
if (typeof window !== "undefined") {
  (window as any).katex = katex;
}

const ReactQuill = dynamic(() => {
  return Promise.all([
    import("react-quill-new"),
    import("quill-blot-formatter")
  ]).then(([RQ, BlotFormatterModule]) => {
    if (typeof window !== "undefined") {
      const Quill = RQ.default.Quill || require('quill').default || require('quill');
      const BlotFormatter = BlotFormatterModule.default;

      // Fix Quill stripping inline styles (needed for image alignment/resizing)
      const BaseImageFormat = Quill.import('formats/image') as any;
      class ImageFormat extends BaseImageFormat {
        static formats(domNode: HTMLElement) {
          return ['alt', 'height', 'width', 'style', 'id', 'data-excalidraw'].reduce((formats: any, attribute) => {
            if (domNode.hasAttribute(attribute)) {
              formats[attribute] = domNode.getAttribute(attribute);
            }
            return formats;
          }, {});
        }
        format(name: string, value: any) {
          if (['alt', 'height', 'width', 'style', 'id', 'data-excalidraw'].indexOf(name) > -1) {
            if (value) {
              (this as any).domNode.setAttribute(name, value);
            } else {
              (this as any).domNode.removeAttribute(name);
            }
          } else {
            super.format(name, value);
          }
        }
      }
      Quill.register(ImageFormat as any, true);

      if (!Quill.imports['modules/blotFormatter']) {
        Quill.register('modules/blotFormatter', BlotFormatter as any);
      }

      // Add SVG icons for undo/redo
      const icons = Quill.import('ui/icons') as Record<string, any>;
      if (icons) {
        icons['undo'] = '<svg viewbox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10"></polygon><path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path></svg>';
        icons['redo'] = '<svg viewbox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10"></polygon><path class="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"></path></svg>';
      }
    }
    return RQ;
  });
}, {
  ssr: false,
  loading: () => <p className="text-sm text-slate-400 p-4">Loading editor...</p>,
});

const quillModules = {
  blotFormatter: {},
  history: {
    delay: 500,
    maxStack: 100,
    userOnly: true
  },
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ["undo", "redo"],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
    handlers: {
      undo: function (this: any) {
        this.quill.history.undo();
      },
      redo: function (this: any) {
        this.quill.history.redo();
      },
    },
  },
};

interface AcademicClass {
  id: number;
  name: string;
  institute?: string | null;
}

interface AcademicSubject {
  id: number;
  classId: number;
  name: string;
}

interface LessonPlanFormProps {
  classes: AcademicClass[];
  subjects: AcademicSubject[];
  teacherId?: string;
  studentPerformanceBad?: string;
  reviewerRemark?: string;
  principalRemark?: string;
  status?: string;
  reviewerName?: string;
  specialistName?: string;
  principalName?: string;
  reviewedAt?: string;
  chapterDivisionId?: number;
}

export default function LessonPlanForm({ classes, subjects, teacherId }: LessonPlanFormProps) {
  const router = useRouter();
  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Teacher Preparation, 2: Lesson Plan, 3: Delivery & Sign off
  const [lessonPlanMode, setLessonPlanMode] = useState("EXPLANATION"); // EXPLANATION, QA, PREPRIMARY
  
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [drawingTarget, setDrawingTarget] = useState<"teacherNote" | "homework" | "newTopicIntro" | null>(null);
  const [editingDrawingId, setEditingDrawingId] = useState<string | null>(null);
  const [drawingInitialData, setDrawingInitialData] = useState<any[] | undefined>(undefined);
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [draftRestorationChecked, setDraftRestorationChecked] = useState(false);

  const [unitsWithChapters, setUnitsWithChapters] = useState<any[]>([]);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);
  const [chapterDivisions, setChapterDivisions] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    id: undefined as string | undefined,
    // Common Meta
    status: "DRAFT",
    reviewerName: "",
    specialistName: "",
    principalName: "",
    reviewedAt: "",
    createdAt: "",
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

  // Prevent copy, cut, paste, and drag-and-drop in all inputs and textareas
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.classList.contains("ql-editor"))) {
        
        // If it's Quill editor, allow ONLY images
        if (activeEl.classList.contains("ql-editor")) {
          const hasImage = Array.from(e.clipboardData?.items || []).some(item => item.type.startsWith('image/'));
          const textData = e.clipboardData?.getData('text/plain');
          
          if (textData && !hasImage) {
            e.preventDefault();
            alert("Text copy-pasting is disabled. You may only paste images/diagrams.");
          }
          // if it has an image, we allow the paste to go through
        } else {
          e.preventDefault();
          alert("Copy-pasting is disabled in Lesson Plan Management to ensure organic lesson planning.");
        }
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        e.preventDefault();
        alert("Copying text is disabled in Lesson Plan Management.");
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        e.preventDefault();
        alert("Cutting text is disabled in Lesson Plan Management.");
      }
    };

    const handleDrop = (e: DragEvent) => {
      const activeEl = e.target as HTMLElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        e.preventDefault();
        alert("Drag and drop is disabled in Lesson Plan Management.");
      }
    };

    document.addEventListener("paste", handlePaste);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  // Handle Query Parameters for pre-filling
  useEffect(() => {
    const className = searchParams.get("class");
    const subject = searchParams.get("subject");
    const unitName = searchParams.get("unitName");
    const chapterName = searchParams.get("chapterName");
    const unitChapter = searchParams.get("unitChapter"); // Legacy compatibility
    const pages = searchParams.get("pages");
    const chapterId = searchParams.get("chapterId");
    const type = searchParams.get("type"); // Optional: for Add Homework mode
    const divisionId = searchParams.get("divisionId");
    const divisionNo = searchParams.get("divisionNo");

    if (className || subject || unitName || chapterName || unitChapter || pages || chapterId || divisionId) {
      setFormData(prev => {
        let exactUnitChapterPage = prev.unitChapterPage;
        
        // If we have unitName and chapterName, build the exact format needed for the select
        if (unitName && chapterName && pages) {
          exactUnitChapterPage = unitName === "NA" || unitName === ""
            ? `${chapterName}, Pg ${pages}`
            : `${unitName}, ${chapterName}, Pg ${pages}`;
        } else if (unitChapter && pages) {
          exactUnitChapterPage = `${unitChapter}, Pg ${pages}`;
        }

        // Include (Div X) only if it's a custom input or if we handle it elsewhere
        // Wait, since we are showing this exact value in the input when divisionId is present, we CAN include (Div X)
        if (divisionId && exactUnitChapterPage) {
           exactUnitChapterPage = `${exactUnitChapterPage} (Div ${divisionNo || ''})`;
        }

        return {
          ...prev,
          className: className || prev.className,
          subject: subject || prev.subject,
          unitChapterPage: exactUnitChapterPage,
          chapterDivisionId: divisionId ? parseInt(divisionId, 10) : prev.chapterDivisionId,
        };
      });

      if (chapterId) {
        setSelectedChapterId(parseInt(chapterId, 10));
      }

      if (type === "homework") {
        setActiveStep(1);
      }
    }

    const editId = searchParams.get("edit");
    if (editId) {
      getLessonPlanById(editId).then(res => {
        if (res.success && res.data) {
          try {
            const step1 = JSON.parse(res.data.step1Data || "{}");
            const step2 = JSON.parse(res.data.step2Data || "{}");
            setFormData(prev => ({
              ...prev,
              ...step1,
              ...step2,
              id: res.data.id,
              className: res.data.class?.name || prev.className,
              subject: res.data.subject?.name || prev.subject,
              date: res.data.date || prev.date,
              teacherObservation: (res.data as any).teacherObservation || step2.teacherObservation || "",
              studentPerformanceGood: (res.data as any).studentPerformanceGood || step2.studentPerformanceGood || "",
              studentPerformanceBad: (res.data as any).studentPerformanceBad || step2.studentPerformanceBad || "",
              reviewerRemark: res.data.reviewerRemark || "",
              status: res.data.status || "DRAFT",
              reviewerName: res.data.reviewerProfile?.name || res.data.reviewerUser?.email?.split('@')[0] || (res.data.reviewerUser?.role === 'PRINCIPAL' ? 'Principal' : res.data.reviewerUser?.role === 'ADMIN' ? 'Admin' : ""),
              specialistName: (res.data as any).specialistProfile?.name || "",
              principalName: (res.data as any).principalProfile?.name || "",
              reviewedAt: res.data.updatedAt || "",
              teacherName: res.data.teacherProfile?.name || "",
              createdAt: res.data.createdAt || "",
            }));
            if (res.data.type) {
              setLessonPlanMode(res.data.type);
            }
          } catch (e) {
            console.error("Failed to parse edit plan data", e);
          }
        }
      }).finally(() => {
        setIsDataLoaded(true);
      });
    } else {
      setIsDataLoaded(true);
    }
  }, [searchParams]);

  // Handle Draft Restoration & Auto-save
  const editId = searchParams.get("edit");
  const divisionId = searchParams.get("divisionId");
  const draftKey = editId 
    ? `lessonPlanDraft_edit_${editId}` 
    : (divisionId 
        ? `lessonPlanDraft_new_div_${divisionId}` 
        : (formData.className && formData.subject 
            ? `lessonPlanDraft_new_${formData.className}_${formData.subject}` 
            : null));

  useEffect(() => {
    if (!isDataLoaded || !draftKey || draftRestorationChecked) return;

    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      const message = editId 
        ? "We found an unsaved draft for this lesson plan. Do you want to restore it?"
        : "We found an unsaved draft for this new lesson plan. Do you want to restore it?";
      if (confirm(message)) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed);
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      } else {
        localStorage.removeItem(draftKey);
      }
    }
    setDraftRestorationChecked(true);
  }, [isDataLoaded, draftKey, draftRestorationChecked, editId]);

  useEffect(() => {
    if (!isDataLoaded || !draftRestorationChecked || !draftKey) return;

    const timer = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, draftKey, isDataLoaded, draftRestorationChecked]);

  // Automatically calculate Delivery Day from Delivery Date
  useEffect(() => {
    if (formData.date) {
      const dateObj = new Date(formData.date);
      if (!isNaN(dateObj.getTime())) {
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        setFormData(prev => ({
          ...prev,
          deliveryDay: dayName
        }));
      }
    }
  }, [formData.date]);

  // Set LP Prep Date and Day to today's live date (fixed, non-editable)
  useEffect(() => {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = today.toISOString().split('T')[0];
    setFormData(prev => {
      if (prev.status === "DRAFT") {
        return {
          ...prev,
          prepDate: dateStr,
          prepDay: dayName
        };
      }
      return prev;
    });
  }, [formData.status]);

  // Calculate min and max dates for Lesson Plan (next day to 6 working days)
  const { minDateStr, maxDateStr } = React.useMemo(() => {
    const today = new Date();
    
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1); // Next day
    
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 1); // Start from next day
    
    let workingDaysCount = 0;
    while (workingDaysCount < 6) {
      if (maxDate.getDay() !== 0) {
        workingDaysCount++;
      }
      if (workingDaysCount < 6) {
        maxDate.setDate(maxDate.getDate() + 1);
      }
    }
    
    return {
      minDateStr: minDate.toISOString().split('T')[0],
      maxDateStr: maxDate.toISOString().split('T')[0]
    };
  }, []);

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

  // Automatically calculate LP No based on Class and Subject
  useEffect(() => {
    async function fetchCount() {
      if (!formData.className || !formData.subject) return;
      const classObj = uniqueClasses.find(c => c.name === formData.className);
      if (!classObj) return;
      const subjectObj = subjects.find(s => s.name === formData.subject && s.classId === classObj.id);
      if (!subjectObj) return;

      const res = await getLessonPlanCount(classObj.id, subjectObj.id);
      if (res.success) {
        const nextNo = (res.count || 0) + 1;
        setFormData(prev => prev.lpNo !== String(nextNo) ? { ...prev, lpNo: String(nextNo) } : prev);
      }
    }
    fetchCount();
  }, [formData.className, formData.subject, uniqueClasses, subjects]);

  // Automatically fetch existing lesson plan if it exists for the given Date, Class, and Subject
  useEffect(() => {
    async function fetchExistingPlan() {
      // If we are currently editing an existing plan, skip auto-fetching to prevent overwrite prompts
      if (searchParams.get("edit")) return;

      if (!formData.className || !formData.subject || !formData.date) return;
      const classObj = uniqueClasses.find(c => c.name === formData.className);
      if (!classObj) return;
      const subjectObj = subjects.find(s => s.name === formData.subject && s.classId === classObj.id);
      if (!subjectObj) return;

      const res = await getLessonPlanByDateAndSubject(classObj.id, subjectObj.id, formData.date);
      if (res.success && res.data) {
        if (confirm("An existing lesson plan was found for this date. Do you want to load it?")) {
          try {
            const step1 = JSON.parse(res.data.step1Data || "{}");
            const step2 = JSON.parse(res.data.step2Data || "{}");
            setFormData(prev => ({
              ...prev,
              ...step1,
              ...step2,
              ...step2,
              teacherObservation: (res.data as any).teacherObservation || step2.teacherObservation || "",
              studentPerformanceGood: (res.data as any).studentPerformanceGood || step2.studentPerformanceGood || "",
              studentPerformanceBad: (res.data as any).studentPerformanceBad || step2.studentPerformanceBad || "",
              reviewerRemark: res.data.reviewerRemark || "",
              status: res.data.status || "DRAFT",
              reviewerName: res.data.reviewerProfile?.name || res.data.reviewerUser?.email?.split('@')[0] || (res.data.reviewerUser?.role === 'PRINCIPAL' ? 'Principal' : res.data.reviewerUser?.role === 'ADMIN' ? 'Admin' : ""),
              specialistName: (res.data as any).specialistProfile?.name || "",
              reviewedAt: res.data.updatedAt || "",
            }));
            if (res.data.type) {
              setLessonPlanMode(res.data.type);
            }
          } catch (e) {
            console.error("Failed to parse existing plan data", e);
          }
        }
      }
    }
    fetchExistingPlan();
  }, [formData.className, formData.subject, formData.date, uniqueClasses, subjects]);

  const isPrePrimary = formData.className.toLowerCase().includes('kg') || 
                       formData.className.toLowerCase().includes('nursery') || 
                       formData.className.toLowerCase().includes('pre');

  useEffect(() => {
    if (isPrePrimary && lessonPlanMode !== "PREPRIMARY") {
      setLessonPlanMode("PREPRIMARY");
    } else if (!isPrePrimary && lessonPlanMode === "PREPRIMARY") {
      setLessonPlanMode("EXPLANATION");
    }
  }, [isPrePrimary, lessonPlanMode]);

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

  // Click and Double click listener to edit images
  useEffect(() => {
    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.hasAttribute('data-excalidraw')) {
        const data = target.getAttribute('data-excalidraw');
        const imgId = target.getAttribute('id');
        if (data && imgId) {
          try {
            const elements = JSON.parse(data);
            setEditingDrawingId(imgId);
            setDrawingInitialData(elements);
            
            // Determine if it's teacherNote, homework or newTopicIntro based on parent
            if (target.closest('[data-field="teacherNote"]')) {
              setDrawingTarget("teacherNote");
            } else if (target.closest('[data-field="newTopicIntro"]')) {
              setDrawingTarget("newTopicIntro");
            } else {
              setDrawingTarget("homework");
            }
            setIsDrawingModalOpen(true);
          } catch (err) {
            console.error("Failed to parse drawing data", err);
          }
        }
      }
    };
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.hasAttribute('data-excalidraw')) {
        // Wait for quill-blot-formatter to render its toolbar
        setTimeout(() => {
          const toolbars = document.querySelectorAll('.blot-formatter__toolbar');
          if (toolbars.length > 0) {
            const toolbar = toolbars[toolbars.length - 1] as HTMLElement;
            
            // Check if edit button already exists to prevent duplicates
            if (!toolbar.querySelector('.diagram-toolbar-edit-btn')) {
               const editBtn = document.createElement('div');
               editBtn.className = 'diagram-toolbar-edit-btn';
               editBtn.innerHTML = '✏️ Edit Diagram';
               Object.assign(editBtn.style, {
                 display: 'inline-block',
                 padding: '4px 8px',
                 color: '#2563eb',
                 fontWeight: 'bold',
                 fontSize: '12px',
                 cursor: 'pointer',
                 marginLeft: '8px',
                 borderLeft: '1px solid #cbd5e1',
                 lineHeight: '1',
               });
               
               editBtn.onclick = (event) => {
                 event.preventDefault();
                 event.stopPropagation();
                 
                 const data = target.getAttribute('data-excalidraw');
                 const imgId = target.getAttribute('id');
                 if (data && imgId) {
                    try {
                      const elements = JSON.parse(data);
                      setEditingDrawingId(imgId);
                      setDrawingInitialData(elements);
                      if (target.closest('[data-field="teacherNote"]')) {
                        setDrawingTarget("teacherNote");
                      } else if (target.closest('[data-field="newTopicIntro"]')) {
                        setDrawingTarget("newTopicIntro");
                      } else {
                        setDrawingTarget("homework");
                      }
                      setIsDrawingModalOpen(true);
                    } catch (err) {}
                 }
               };
               
               toolbar.appendChild(editBtn);
            }

            // Add Delete button
            if (!toolbar.querySelector('.diagram-toolbar-delete-btn')) {
               const deleteBtn = document.createElement('div');
               deleteBtn.className = 'diagram-toolbar-delete-btn';
               deleteBtn.innerHTML = '🗑️ Delete';
               Object.assign(deleteBtn.style, {
                 display: 'inline-block',
                 padding: '4px 8px',
                 color: '#ef4444',
                 fontWeight: 'bold',
                 fontSize: '12px',
                 cursor: 'pointer',
                 marginLeft: '4px',
                 borderLeft: '1px solid #cbd5e1',
                 lineHeight: '1',
               });
               
               deleteBtn.onclick = (event) => {
                 event.preventDefault();
                 event.stopPropagation();
                 
                 const imgId = target.getAttribute('id');
                 if (imgId) {
                    const isTeacherNote = target.closest('[data-field="teacherNote"]');
                    const isNewTopicIntro = target.closest('[data-field="newTopicIntro"]');
                    const targetHtml = isTeacherNote 
                      ? formData.teacherNote 
                      : isNewTopicIntro 
                        ? formData.newTopicIntro 
                        : formData.homework;
                    const imgRegex = new RegExp(`<p><img([^>]*)id=["']${imgId}["']([^>]*)><\/p>|<img([^>]*)id=["']${imgId}["']([^>]*)>`, "i");
                    
                    if (isTeacherNote) {
                      setFormData(prev => ({ ...prev, teacherNote: prev.teacherNote.replace(imgRegex, '') }));
                    } else if (isNewTopicIntro) {
                      setFormData(prev => ({ ...prev, newTopicIntro: prev.newTopicIntro.replace(imgRegex, '') }));
                    } else {
                      setFormData(prev => ({ ...prev, homework: prev.homework.replace(imgRegex, '') }));
                    }
                    toolbar.style.display = 'none';
                 }
               };
               
               toolbar.appendChild(deleteBtn);
            }
          }
        }, 10);
      }
    };

    document.addEventListener('dblclick', handleDblClick);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('dblclick', handleDblClick);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const handleDrawingSave = (base64Image: string, elements: any[]) => {
    const safeExcalidraw = JSON.stringify(elements).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
    
    if (editingDrawingId) {
      // Edit existing image
      const targetHtml = drawingTarget === "teacherNote" 
        ? formData.teacherNote 
        : drawingTarget === "newTopicIntro" 
          ? formData.newTopicIntro 
          : formData.homework;
      const imgRegex = new RegExp(`<img([^>]*)id=["']${editingDrawingId}["']([^>]*)>`, "i");
      const match = targetHtml.match(imgRegex);
      
      let styleAttr = "";
      if (match) {
        const styleMatch = match[0].match(/style=["']([^"']+)["']/i);
        if (styleMatch) styleAttr = `style="${styleMatch[1]}"`;
      }
      
      const newImgHtml = `<img id="${editingDrawingId}" src="${base64Image}" alt="Diagram" data-excalidraw="${safeExcalidraw}" ${styleAttr} />`;
      
      setFormData(prev => ({
        ...prev,
        [drawingTarget!]: (prev as any)[drawingTarget!].replace(imgRegex, newImgHtml)
      }));
      
      setEditingDrawingId(null);
      setDrawingInitialData(undefined);
    } else {
      // New insertion
      const newId = "draw_" + Date.now();
      const newImgHtml = `<p><img id="${newId}" src="${base64Image}" alt="Diagram" data-excalidraw="${safeExcalidraw}" /></p>`;
      
      if (drawingTarget === "teacherNote") {
        setFormData(prev => ({ 
          ...prev, 
          teacherNote: prev.teacherNote + newImgHtml 
        }));
      } else if (drawingTarget === "newTopicIntro") {
        setFormData(prev => ({ 
          ...prev, 
          newTopicIntro: prev.newTopicIntro + newImgHtml 
        }));
      } else if (drawingTarget === "homework") {
        setFormData(prev => ({ 
          ...prev, 
          homework: prev.homework + newImgHtml 
        }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Check if user selected Sunday for the Date
    if (name === "date" && value) {
      const selectedDate = new Date(value);
      if (selectedDate.getDay() === 0) {
        alert("Sundays are holidays. Please select another day.");
        return;
      }
    }

    // When class changes, reset subject
    if (name === "className") {
      setFormData(prev => ({ ...prev, [name]: value, subject: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (submitForValidation = false, forceStatus?: string) => {
    if (!formData.className || !formData.subject) {
      alert("Please select Class and Subject first.");
      return;
    }
    
    if (submitForValidation) {
      const missingFields = [];
      if (!formData.teacherNote) missingFields.push("Teacher Note");
      if (!formData.homework) missingFields.push("Homework");
      if (!formData.unitChapterPage) missingFields.push("Unit/Chapter");
      if (!formData.learningIndicators) missingFields.push("Learning Indicators");
      if (!formData.lessonIntroObjective) missingFields.push("Lesson Intro/Objective");
      
      if (missingFields.length > 0) {
        alert("Please fill all required fields in Step 1 and 2 before submitting for validation. Missing: " + missingFields.join(", "));
        return;
      }

      if (!confirm("Are you sure you want to submit this lesson plan for validation? You won't be able to edit it until it's reviewed.")) {
        return;
      }
    }

    setIsSaving(true);
    try {
      const classObj = uniqueClasses.find(c => c.name === formData.className);
      const subjectObj = subjects.find(s => s.name === formData.subject && s.classId === classObj?.id);

      const targetStatus = forceStatus || (submitForValidation ? "SUBMITTED" : (formData.id ? formData.status : "DRAFT"));

      const res = await (saveLessonPlan as any)({
        id: formData.id,
        teacherId,
        classId: classObj?.id,
        subjectId: subjectObj?.id,
        date: formData.date,
        type: lessonPlanMode,
        status: targetStatus,
        chapterDivisionId: formData.chapterDivisionId,
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
          principalRemark: formData.principalRemark,
          reviewerPrincipal: formData.reviewerPrincipal,
        }
      });

      if (res.success) {
        if (draftKey) localStorage.removeItem(draftKey);
        
        router.refresh();
        
        if (forceStatus === "COMPLETED") {
          alert("Lesson Plan Signed Off and Completed successfully!");
          router.push("/office/academy-management/my-lesson-plans");
        } else if (submitForValidation) {
          alert("Lesson Plan submitted for validation successfully!");
          router.push("/office/academy-management/my-lesson-plans");
        } else {
          alert("Lesson Plan saved successfully!");
          router.push("/office/academy-management/my-lesson-plans");
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
          onClick={() => {
            // Validate Step 1 required fields before proceeding
            const missingFields: string[] = [];
            const stripHtml = (html: string) => html?.replace(/<[^>]*>/g, "").trim();
            if (!formData.className || !formData.subject) missingFields.push("Class & Subject");
            if (!stripHtml(formData.teacherNote)) missingFields.push("Teacher's Note (1A)");
            if (!stripHtml(formData.homework)) missingFields.push("Today's Homework (1B)");
            if (missingFields.length > 0) {
              alert(`Please fill all required fields in Step 1 before proceeding:\n\n• ${missingFields.join("\n• ")}`);
              return;
            }
            setActiveStep(2);
          }}
          className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${activeStep === 2
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
            }`}
        >
          2. LESSON PLAN
        </button>
        <button
          onClick={() => {
            if (formData.status !== "APPROVED" && formData.status !== "REVIEWED" && formData.status !== "REJECTED") {
              alert("The Sign Off section will only unlock after your lesson plan has been reviewed.");
              return;
            }
            setActiveStep(3);
          }}
          className={`px-6 py-2 rounded-lg font-bold text-xs transition-all ${activeStep === 3
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
            } ${formData.status !== "APPROVED" && formData.status !== "REVIEWED" && formData.status !== "REJECTED" ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          3. LESSON delivery & Sign off
        </button>
      </div>

      {/* 2. EXCEL-STYLE HEADER */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="border-b border-slate-300 h-16">
          <div className="flex items-center px-4 gap-4 overflow-x-auto h-full">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400">Class & Subject:</span>
              <select
                name="classAndSubject"
                value={formData.className && formData.subject ? `${formData.className}|${formData.subject}` : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setFormData(prev => ({ ...prev, className: "", subject: "" }));
                  } else {
                    const [cName, sName] = val.split("|");
                    setFormData(prev => ({ ...prev, className: cName, subject: sName }));
                  }
                }}
                className="bg-transparent border-b border-slate-200 outline-none font-bold text-xs py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!!formData.chapterDivisionId || !!formData.id || formData.status !== "DRAFT"}
              >
                <option value="">Select</option>
                {subjects.map(s => {
                  const cObj = uniqueClasses.find(c => c.id === s.classId);
                  if (!cObj) return null;
                  return (
                    <option key={s.id} value={`${cObj.name}|${s.name}`}>
                      {cObj.name} - {s.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full font-black text-[10px] uppercase tracking-wider">
                {formData.status === "DRAFT" ? "Draft" : 
                 formData.status === "SUBMITTED" ? "Pending Review" : 
                 formData.status === "REVIEWED" ? "Reviewed" : 
                 formData.status === "APPROVED" ? "Approved" : 
                 formData.status === "REJECTED" ? "Rejected" : 
                 formData.status === "COMPLETED" ? "Completed" : formData.status}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400">Day:</span>
              <span className="bg-transparent border-b border-slate-200 outline-none font-bold text-xs py-1 px-1">
                {formData.deliveryDay || "..."}
              </span>
            </div>
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400">Date:</span>
              <input
                type="date"
                name="date"
                value={formData.date}
                min={minDateStr}
                max={maxDateStr}
                onChange={handleChange}
                disabled={formData.status !== "DRAFT"}
                className="bg-transparent border-b border-slate-200 outline-none font-bold text-xs py-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-[10px] font-black uppercase text-slate-400">LP No:</span>
              <span className="w-12 bg-transparent border-b border-slate-200 outline-none font-bold text-xs py-1 px-1">
                {formData.lpNo || "..."}
              </span>
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
              <div className="relative" data-field="teacherNote">
                <ReactQuill
                  theme="snow"
                  modules={quillModules}
                  value={formData.teacherNote}
                  onChange={(val) => setFormData(prev => ({ ...prev, teacherNote: val }))}
                  className="w-full bg-white text-slate-900 border-none"
                  placeholder="Enter your preparation notes, formulas, or paste diagrams here..."
                />
              </div>
              <div className="bg-slate-50 p-2 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDrawingTarget("teacherNote");
                    setIsDrawingModalOpen(true);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
                >
                  <PenTool className="w-3.5 h-3.5 text-blue-600" /> Draw Diagram (Whiteboard)
                </button>
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
              <div className="bg-white relative" data-field="homework">
                <ReactQuill
                  theme="snow"
                  modules={quillModules}
                  value={formData.homework}
                  onChange={(val) => setFormData(prev => ({ ...prev, homework: val }))}
                  className="w-full text-slate-900 border-none"
                  placeholder="Enter student homework assignments here..."
                />
              </div>
              <div className="bg-slate-50 p-2 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDrawingTarget("homework");
                    setIsDrawingModalOpen(true);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
                >
                  <PenTool className="w-3.5 h-3.5 text-blue-600" /> Draw Diagram (Whiteboard)
                </button>
              </div>
            </div>
          </div>
        ) : activeStep === 2 ? (
          /* --- STEP 2: LESSON PLAN (EXCEL-STYLE) --- */
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mode Switcher */}
            <div className="flex items-center gap-4 p-2 bg-slate-50 border border-slate-200 rounded-2xl w-full md:w-fit mx-auto">
              {!isPrePrimary && (
                <>
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
                </>
              )}
              {isPrePrimary && (
                <button
                  onClick={() => setLessonPlanMode("PREPRIMARY")}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lessonPlanMode === "PREPRIMARY" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  2C. PRE-PRIMARY
                </button>
              )}
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

                <div className="grid grid-cols-10 border-b border-slate-300 min-h-14">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Unit/Chapter:</div>
                  <div className="col-span-4 p-3 flex items-center border-r border-slate-300 overflow-hidden">
                    {!!formData.chapterDivisionId ? (
                      <input 
                        type="text"
                        name="unitChapterPage" 
                        value={formData.unitChapterPage.split(', Pg')[0].replace(/ \(Div \d+\)/, '')} 
                        className="w-full bg-transparent font-bold text-[13px] outline-none text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                        readOnly
                      />
                    ) : (
                      <select 
                        name="unitChapterPage" 
                        value={formData.unitChapterPage} 
                        disabled={formData.status !== "DRAFT" || !!formData.id}
                        className="w-full bg-transparent border-none outline-none font-bold text-[13px] appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                    )}
                    {formData.unitChapterPage === "custom" && !formData.chapterDivisionId && (
                      <input
                        type="text"
                        placeholder="Type manually..."
                        disabled={formData.status !== "DRAFT"}
                        className="w-full ml-2 border-b border-slate-300 outline-none font-bold text-xs disabled:opacity-50"
                        onChange={(e) => setFormData(prev => ({ ...prev, unitChapterPage: e.target.value }))}
                      />
                    )}
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Page Range:</div>
                  <div className="col-span-4 p-3 flex items-center overflow-hidden">
                    {!!formData.chapterDivisionId ? (
                      <input 
                        type="text"
                        value={(() => {
                          const pagesMatch = formData.unitChapterPage.match(/Pg ([0-9-]+)/);
                          const divMatch = formData.unitTransition || formData.unitChapterPage.match(/\(Div ([0-9]+)\)/);
                          return pagesMatch ? `Pages ${pagesMatch[1]} ${divMatch ? `(Div ${divMatch[1]})` : ''}` : "Fixed Division Pages";
                        })()}
                        className="w-full bg-transparent font-bold text-[13px] outline-none text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                        readOnly
                      />
                    ) : (
                      <select
                        disabled={chapterDivisions.length === 0 || formData.status !== "DRAFT"}
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
                    )}
                  </div>
                </div>

                {/* LP Prep Day/Date Row */}
                <div className="grid grid-cols-10 border-b border-slate-300 h-14">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Day:</div>
                  <div className="col-span-4 p-3 flex items-center border-r border-slate-300 font-bold text-sm text-slate-800">
                    {formData.prepDay}
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Date:</div>
                  <div className="col-span-4 p-3 flex items-center font-bold text-sm text-slate-800">
                    {formData.prepDate}
                  </div>
                </div>

                {/* LP Delivery Day/Date Row */}
                <div className="grid grid-cols-10 border-b border-slate-300 h-14">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Delivery Day:</div>
                  <div className="col-span-4 p-3 flex items-center border-r border-slate-300 font-bold text-sm text-slate-800">
                    {formData.deliveryDay || "-"}
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Delivery Date:</div>
                  <div className="col-span-4 p-3 flex items-center font-bold text-sm text-slate-800">
                    {formData.date || "-"}
                  </div>
                </div>

                {/* Teacher Sign & Reviewer Row */}
                <div className="grid grid-cols-10 border-b border-slate-300 h-14">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Teacher Name/Sign:</div>
                  <div className="col-span-4 p-3 flex items-center border-r border-slate-300 font-bold text-sm truncate">
                    {formData.teacherName || "______"}
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Reviewer/Principal:</div>
                  <div className="col-span-4 p-3 flex items-center">
                    <input 
                      name="reviewerPrincipal" 
                      value={formData.reviewerPrincipal} 
                      onChange={handleChange} 
                      disabled={formData.status !== "DRAFT"}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm disabled:opacity-50" 
                      placeholder="Reviewer Signature..." 
                    />
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
                    <textarea 
                      name="openingTimeEnergizer" 
                      value={formData.openingTimeEnergizer} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm resize-none overflow-hidden" 
                      placeholder="Describe the activity..." 
                    />
                  </div>

                  <div className="contents">
                    <div className="col-span-1 p-4 flex items-center justify-center font-bold text-xs border-r border-slate-300">3 min</div>
                    <div className="col-span-3 p-4 flex flex-col justify-center border-r border-slate-300">
                      <p className="font-bold text-[11px] text-slate-600 mb-2">Roadmap of the day & Learning Indicators</p>
                    </div>
                    <div className="col-span-6 p-4 grid grid-cols-2 gap-4">
                      <textarea 
                        name="openingTimeRoadmap" 
                        value={formData.openingTimeRoadmap} 
                        onChange={handleChange} 
                        ref={adjustHeight}
                        onInput={(e) => adjustHeight(e.currentTarget)}
                        className="w-full bg-white border border-slate-100 rounded-lg p-2 font-bold text-xs resize-none overflow-hidden" 
                        placeholder="Roadmap detail..." 
                      />
                      <textarea 
                        name="learningIndicators" 
                        value={formData.learningIndicators} 
                        onChange={handleChange} 
                        ref={adjustHeight}
                        onInput={(e) => adjustHeight(e.currentTarget)}
                        className="w-full bg-white border border-slate-100 rounded-lg p-2 font-bold text-xs resize-none overflow-hidden" 
                        placeholder="Indicators 1, 2, 3..." 
                      />
                    </div>
                  </div>
                </div>

                {/* Active Learning Time */}
                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-2 row-span-4 p-4 flex items-center justify-center font-black text-center text-[10px] uppercase border-r border-slate-300 text-slate-700 bg-slate-50/30">Active Learning Time (30 min)</div>
                  
                  {/* Row 1 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 border-b border-slate-200 font-bold text-xs">2 min</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b border-slate-200 font-medium text-[11px] text-slate-600">Lesson Intro & Objective</div>
                  <div className="col-span-6 p-3 border-b border-slate-200">
                    <textarea 
                      name="lessonIntroObjective" 
                      value={formData.lessonIntroObjective} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm resize-none overflow-hidden" 
                      placeholder="..." 
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 border-b border-slate-200 font-bold text-xs">8 min</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b border-slate-200 font-medium text-[11px] text-slate-600 leading-tight">New topic Introduction & Explanation</div>
                  <div className="col-span-6 p-3 border-b border-slate-200 flex flex-col gap-2">
                    <div className="relative w-full" data-field="newTopicIntro">
                      <ReactQuill
                        theme="snow"
                        modules={quillModules}
                        value={formData.newTopicIntro}
                        onChange={(val) => setFormData(prev => ({ ...prev, newTopicIntro: val }))}
                        readOnly={formData.status !== "DRAFT"}
                        className="w-full bg-white text-slate-900 border border-slate-100 rounded-lg"
                        placeholder="Enter description, notes, or paste diagrams here..."
                      />
                    </div>
                    {formData.status === "DRAFT" && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setDrawingTarget("newTopicIntro");
                            setIsDrawingModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <PenTool className="w-3 h-3 text-blue-600" /> Draw Diagram (Whiteboard)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Row 3 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 border-b border-slate-200 font-bold text-xs">5 min</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b border-slate-200 font-medium text-[11px] text-slate-600">Knowledge Building / Discussion</div>
                  <div className="col-span-6 p-3 border-b border-slate-200">
                    <textarea 
                      name="knowledgeBuilding" 
                      value={formData.knowledgeBuilding} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-xs resize-none overflow-hidden" 
                      placeholder="..." 
                    />
                  </div>

                  {/* Row 4 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 font-bold text-xs">15 min</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 font-medium text-[11px] text-slate-600">Lesson Activity & Outcome Feedback</div>
                  <div className="col-span-6 grid grid-rows-2 divide-y divide-slate-200 p-3">
                    <div className="pb-2">
                      <span className="text-[8px] uppercase tracking-widest text-slate-400 block mb-1">Activity:</span>
                      <textarea 
                        name="lessonActivity" 
                        value={formData.lessonActivity} 
                        onChange={handleChange} 
                        ref={adjustHeight}
                        onInput={(e) => adjustHeight(e.currentTarget)}
                        className="w-full bg-transparent border-none outline-none font-bold text-xs resize-none overflow-hidden" 
                        placeholder="Activity details..." 
                      />
                    </div>
                    <div className="pt-2">
                      <span className="text-[8px] uppercase tracking-widest text-slate-400 block mb-1">Outcome Feedback:</span>
                      <textarea 
                        name="outcomeFeedback" 
                        value={formData.outcomeFeedback} 
                        onChange={handleChange} 
                        ref={adjustHeight}
                        onInput={(e) => adjustHeight(e.currentTarget)}
                        className="w-full bg-transparent border-none outline-none font-bold text-xs resize-none overflow-hidden" 
                        placeholder="Feedback/Learning outcome..." 
                      />
                    </div>
                  </div>
                </div>

                {/* Closing Time */}
                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-2 row-span-3 p-4 flex items-center justify-center font-black text-center text-[10px] uppercase border-r border-slate-300 text-slate-700 bg-slate-50/30">Closing Time (5 min)</div>
                  
                  {/* Row 1 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 border-b border-slate-200 font-bold text-xs">1 min</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b border-slate-200 font-medium text-[11px] text-slate-600">Closure, Reward & Recognition</div>
                  <div className="col-span-6 p-3 border-b border-slate-200">
                    <textarea 
                      name="closure" 
                      value={formData.closure} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm resize-none overflow-hidden" 
                      placeholder="..." 
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 border-b border-slate-200 font-bold text-xs">2 min</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b border-slate-200 font-medium text-[11px] text-slate-600">Homework for the day</div>
                  <div className="col-span-6 p-3 border-b border-slate-200 font-bold text-slate-400 italic text-[10px] flex items-center">Synced from Step 1 Homework Space</div>

                  {/* Row 3 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 font-bold text-xs">2 min</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight">Submission of Previous day work check</div>
                  <div className="col-span-6 p-3">
                    <textarea 
                      name="prevDayCheck" 
                      value={formData.prevDayCheck} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm resize-none overflow-hidden" 
                      placeholder="..." 
                    />
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

                {/* Meta Rows (Grid style) */}
                <div className="grid grid-cols-10 border-b border-slate-300 h-14 text-slate-900">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Subject:</div>
                  <div className="col-span-4 p-3 flex items-center font-bold text-sm border-r border-slate-300 truncate">{formData.subject || "-"}</div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Grade:</div>
                  <div className="col-span-4 p-3 flex items-center font-bold text-sm truncate">{formData.className || "-"}</div>
                </div>

                <div className="grid grid-cols-10 border-b border-slate-300 min-h-14 text-slate-900">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Unit/Chapter:</div>
                  <div className="col-span-4 p-3 flex items-center border-r border-slate-300 overflow-hidden">
                    {!!formData.chapterDivisionId ? (
                      <input 
                        type="text"
                        name="unitChapterPage" 
                        value={formData.unitChapterPage.split(', Pg')[0].replace(/ \(Div \d+\)/, '')} 
                        className="w-full bg-transparent font-bold text-[13px] outline-none text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                        readOnly
                      />
                    ) : (
                      <select 
                        name="unitChapterPage" 
                        value={formData.unitChapterPage} 
                        disabled={formData.status !== "DRAFT" || !!formData.id}
                        className="w-full bg-transparent border-none outline-none font-bold text-[13px] appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                    )}
                    {formData.unitChapterPage === "custom" && !formData.chapterDivisionId && (
                      <input
                        type="text"
                        placeholder="Type manually..."
                        disabled={formData.status !== "DRAFT"}
                        className="w-full ml-2 border-b border-slate-300 outline-none font-bold text-xs disabled:opacity-50"
                        onChange={(e) => setFormData(prev => ({ ...prev, unitChapterPage: e.target.value }))}
                      />
                    )}
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Page Range:</div>
                  <div className="col-span-4 p-3 flex items-center overflow-hidden">
                    {!!formData.chapterDivisionId ? (
                      <input 
                        type="text"
                        value={(() => {
                          const pagesMatch = formData.unitChapterPage.match(/Pg ([0-9-]+)/);
                          const divMatch = formData.unitChapterPage.match(/\(Div ([0-9]+)\)/);
                          return pagesMatch ? `Pages ${pagesMatch[1]} ${divMatch ? `(Div ${divMatch[1]})` : ''}` : "Fixed Division Pages";
                        })()}
                        className="w-full bg-transparent font-bold text-[13px] outline-none text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                        readOnly
                      />
                    ) : (
                      <select
                        disabled={chapterDivisions.length === 0 || formData.status !== "DRAFT"}
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
                    )}
                  </div>
                </div>

                {/* LP Prep Day/Date Row */}
                <div className="grid grid-cols-10 border-b border-slate-300 h-14 text-slate-900">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Day:</div>
                  <div className="col-span-4 p-3 flex items-center border-r border-slate-300 font-bold text-sm text-slate-800">
                    {formData.prepDay}
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Prep Date:</div>
                  <div className="col-span-4 p-3 flex items-center font-bold text-sm text-slate-800">
                    {formData.prepDate}
                  </div>
                </div>

                {/* LP Delivery Day/Date Row */}
                <div className="grid grid-cols-10 border-b border-slate-300 h-14 text-slate-900">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Delivery Day:</div>
                  <div className="col-span-4 p-3 flex items-center border-r border-slate-300 font-bold text-sm text-slate-800">
                    {formData.deliveryDay || "-"}
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">LP Delivery Date:</div>
                  <div className="col-span-4 p-3 flex items-center font-bold text-sm text-slate-800">
                    {formData.date || "-"}
                  </div>
                </div>

                {/* Teacher Sign & Reviewer Row */}
                <div className="grid grid-cols-10 border-b border-slate-300 h-14 text-slate-900">
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Teacher Name/Sign:</div>
                  <div className="col-span-4 p-3 flex items-center border-r border-slate-300 font-bold text-sm truncate">
                    {formData.teacherName || "______"}
                  </div>
                  <div className="col-span-1 p-3 flex items-center bg-slate-50/50 font-black text-[9px] uppercase tracking-widest border-r border-slate-300 text-slate-500">Reviewer/Principal:</div>
                  <div className="col-span-4 p-3 flex items-center">
                    <input 
                      name="reviewerPrincipal" 
                      value={formData.reviewerPrincipal} 
                      onChange={handleChange} 
                      disabled={formData.status !== "DRAFT"}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm disabled:opacity-50" 
                      placeholder="Reviewer Signature..." 
                    />
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
                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-2 row-span-2 p-4 flex flex-col items-center justify-center border-r border-slate-300 text-slate-700 bg-slate-50/30">
                    <span className="font-black text-[10px] uppercase">Opening Time</span>
                    <span className="font-black text-[10px] mt-1 tracking-widest text-blue-600">घेरा समय</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-2">(5mins)</span>
                  </div>
                  
                  {/* Row 1 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 border-b border-slate-200 font-bold text-xs">2 minutes</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b border-slate-200 font-medium text-[11px] text-slate-600 leading-tight">Lead the students to perform an energizer/fun activity</div>
                  <div className="col-span-6 p-4 border-b border-slate-200">
                    <textarea 
                      name="openingTimeEnergizer" 
                      value={formData.openingTimeEnergizer} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm resize-none overflow-hidden" 
                      placeholder="Describe the activity..." 
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 font-bold text-xs">3 minutes</div>
                  <div className="col-span-3 p-4 flex flex-col justify-center border-r border-slate-300">
                    <p className="font-bold text-[11px] text-slate-600">Roadmap of the day & Learning Indicators</p>
                  </div>
                  <div className="col-span-6 grid grid-cols-2 divide-x divide-slate-300">
                    <div className="p-3">
                      <span className="text-[8px] font-black uppercase text-slate-400 block mb-1">Roadmap:</span>
                      <textarea 
                        name="openingTimeRoadmap" 
                        value={formData.openingTimeRoadmap} 
                        onChange={handleChange} 
                        ref={adjustHeight}
                        onInput={(e) => adjustHeight(e.currentTarget)}
                        className="w-full bg-transparent border-none outline-none font-bold text-[11px] resize-none overflow-hidden" 
                        placeholder="Roadmap detail..." 
                      />
                    </div>
                    <div className="p-3 bg-slate-50/30">
                      <span className="text-[8px] font-black uppercase text-slate-400 block mb-1">Indicators:</span>
                      <textarea 
                        name="learningIndicators" 
                        value={formData.learningIndicators} 
                        onChange={handleChange} 
                        ref={adjustHeight}
                        onInput={(e) => adjustHeight(e.currentTarget)}
                        className="w-full bg-transparent border-none outline-none font-bold text-[11px] resize-none overflow-hidden" 
                        placeholder="Indicators 1, 2, 3..." 
                      />
                    </div>
                  </div>
                </div>

                {/* Active Learning Time (Q & A Specific) */}
                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-2 row-span-3 p-4 flex flex-col items-center justify-center border-r border-slate-300 text-slate-700 bg-slate-50/30">
                    <span className="font-black text-[10px] uppercase text-center">Active Learning Time</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-2">(30mins)</span>
                  </div>
                  
                  {/* Row 1 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 border-b border-slate-200 font-bold text-xs italic">2 Minutes</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b border-slate-200 font-medium text-[11px] text-slate-600 leading-tight italic">Chapter Summary And Quick Revision</div>
                  <div className="col-span-6 p-3 border-b border-slate-200">
                    <textarea 
                      name="chapterSummaryRevision" 
                      value={formData.chapterSummaryRevision} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-xs resize-none overflow-hidden" 
                      placeholder="Write key summary points..." 
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 border-b border-slate-200 font-bold text-xs italic text-blue-600">25 Minutes</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b border-slate-200 font-medium text-[11px] text-slate-600 leading-snug italic">Chapter Based Question Answer - Discussion - Dictation By Teacher And Writing By Students</div>
                  <div className="col-span-6 p-3 border-b border-slate-200">
                    <textarea 
                      name="chapterBasedQA" 
                      value={formData.chapterBasedQA} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-xs resize-none overflow-hidden" 
                      placeholder="List questions, dictation points, and student tasks..." 
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 font-bold text-xs italic">3 Minutes</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight italic">Inspection By Teacher</div>
                  <div className="col-span-6 p-3">
                    <textarea 
                      name="inspectionByTeacher" 
                      value={formData.inspectionByTeacher} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-xs resize-none overflow-hidden" 
                      placeholder="Observations during student writing..." 
                    />
                  </div>
                </div>

                {/* Closing Time (Shared Layout but Q & A specific text) */}
                <div className="grid grid-cols-12 border-b border-slate-300">
                  <div className="col-span-2 p-4 flex flex-col items-center justify-center border-r border-slate-300 text-slate-700 bg-slate-50/30 row-span-3">
                    <span className="font-black text-[10px] uppercase text-center">Closing Time</span>
                    <span className="font-black text-[10px] mt-1 tracking-widest text-rose-600 uppercase text-center">समापन सर्किल समय</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-2">(5mins)</span>
                  </div>
                  
                  {/* Row 1 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 border-b border-slate-200 font-bold text-xs">1 Minute</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b border-slate-200 font-medium text-[11px] text-slate-600 leading-tight italic">Lesson Closure with appreciation, Reward and recognition</div>
                  <div className="col-span-6 p-3 border-b border-slate-200">
                    <textarea 
                      name="closure" 
                      value={formData.closure} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm resize-none overflow-hidden" 
                      placeholder="Appreciate students..." 
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 border-b border-slate-200 font-bold text-xs">2 Minute</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 border-b border-slate-200 font-medium text-[11px] text-slate-600 leading-tight italic">Homework for the day</div>
                  <div className="col-span-6 p-3 border-b border-slate-200 font-bold text-slate-400 italic text-[10px] flex items-center">
                    <ClipboardList className="h-3 w-3 mr-2" />
                    Synced from Step 1 Homework Space
                  </div>

                  {/* Row 3 */}
                  <div className="col-span-1 p-4 flex items-center justify-center border-r border-slate-300 font-bold text-xs text-rose-500">2 Minute</div>
                  <div className="col-span-3 p-4 flex items-center border-r border-slate-300 font-medium text-[11px] text-slate-600 leading-tight italic">Submission of Previous day work check</div>
                  <div className="col-span-6 p-3">
                    <textarea 
                      name="prevDayCheck" 
                      value={formData.prevDayCheck} 
                      onChange={handleChange} 
                      ref={adjustHeight}
                      onInput={(e) => adjustHeight(e.currentTarget)}
                      className="w-full bg-transparent border-none outline-none font-bold text-sm resize-none overflow-hidden" 
                      placeholder="Check student work..." 
                    />
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
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Observations & Feedback</p>
                    {(formData.status === 'APPROVED' || formData.status === 'REJECTED') && formData.reviewerName ? (
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                        Validated By: {formData.reviewerName}
                      </p>
                    ) : (formData.status === 'SUBMITTED' || formData.status === 'DRAFT') ? (
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                        To be validated by: {formData.specialistName ? `${formData.specialistName} & Principal` : "Principal"}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Save className="h-6 w-6 opacity-20" />
              </div>

              {/* 1. Reviewer & Principal Feedback Section (Moved to top of Step 3) */}
              <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 bg-slate-800 text-white rounded-lg flex items-center justify-center font-black text-xs uppercase shadow-sm">3A</div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tight">Reviewer & Principal Feedback</h4>
                </div>
                
                <div className="space-y-6">
                  {/* Specialist Remark */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Specialist / Reviewer Feedback</label>
                    <textarea 
                      name="reviewerRemark" 
                      value={formData.reviewerRemark} 
                      onChange={handleChange} 
                      className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm resize-none shadow-sm focus:border-slate-400 transition-all text-slate-500" 
                      placeholder="No specialist feedback provided yet."
                      readOnly
                    />
                  </div>

                  {/* Principal Remark */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Principal / Approver Feedback</label>
                    <textarea 
                      name="principalRemark" 
                      value={formData.principalRemark || ""} 
                      onChange={handleChange} 
                      className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm resize-none shadow-sm focus:border-slate-400 transition-all text-slate-500" 
                      placeholder="No principal feedback provided yet."
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* 2. Observation Section */}
              <div className="p-8 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs uppercase shadow-sm">3B</div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tight">Teacher Observation</h4>
                </div>
                <textarea 
                  name="teacherObservation" 
                  value={formData.teacherObservation} 
                  onChange={handleChange} 
                  ref={adjustHeight}
                  onInput={(e) => adjustHeight(e.currentTarget)}
                  className="w-full min-h-[160px] p-6 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none font-medium text-sm resize-none focus:bg-white focus:border-blue-200 transition-all placeholder:text-slate-300 overflow-hidden" 
                  placeholder="Write observations here..." 
                />
              </div>

              {/* 3. Student Performance Section */}
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
                    ref={adjustHeight}
                    onInput={(e) => adjustHeight(e.currentTarget)}
                    className="w-full min-h-[128px] p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl outline-none font-bold text-xs resize-none focus:bg-white focus:border-emerald-200 transition-all overflow-hidden" 
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
                    ref={adjustHeight}
                    onInput={(e) => adjustHeight(e.currentTarget)}
                    className="w-full min-h-[128px] p-4 bg-rose-50/30 border border-rose-100 rounded-xl outline-none font-bold text-xs resize-none focus:bg-white focus:border-rose-200 transition-all overflow-hidden" 
                    placeholder="Note areas for improvement..." 
                  />
                </div>
              </div>

              {/* 4. Signatures */}
              <div className="p-8 bg-slate-50/30">
                <div className="mt-8 pt-8 flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="mb-2 h-8 flex flex-col justify-end">
                      <p className="text-xs font-black text-slate-800">
                        {formData.teacherName || "Teacher"}
                      </p>
                      {formData.createdAt && (
                        <p className="text-[9px] font-bold text-slate-400">
                          {new Date(formData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="w-48 border-b border-black"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teacher's Digital Signature</p>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="mb-2 h-8 flex flex-col justify-end items-center">
                      <p className="text-xs font-black text-slate-800">
                        {formData.status === "REVIEWED" || formData.status === "APPROVED" || formData.status === "COMPLETED" ? (formData.specialistName || "Reviewer") : ""}
                      </p>
                      {(formData.status === "REVIEWED" || formData.status === "APPROVED" || formData.status === "COMPLETED") && (
                        <p className="text-[9px] font-bold text-blue-500">
                          Validated
                        </p>
                      )}
                    </div>
                    <div className="w-48 border-b border-black mx-auto"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reviewer Signoff</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="mb-2 h-8 flex flex-col justify-end items-end">
                      <p className="text-xs font-black text-slate-800">
                        {formData.status === "APPROVED" || formData.status === "COMPLETED" ? (formData.principalName || formData.reviewerName || "Principal") : ""}
                      </p>
                      {(formData.status === "APPROVED" || formData.status === "COMPLETED") && (
                        <p className="text-[9px] font-bold text-emerald-500">
                          Approved
                        </p>
                      )}
                    </div>
                    <div className="w-48 border-b border-black ml-auto"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Head/Principal Signoff</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DrawingModal
        isOpen={isDrawingModalOpen}
        onClose={() => {
          setIsDrawingModalOpen(false);
          setEditingDrawingId(null);
          setDrawingInitialData(undefined);
        }}
        onSave={handleDrawingSave}
        initialData={drawingInitialData}
      />

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
          
          {activeStep === 1 && (
            <button
              onClick={() => setActiveStep(2)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
            >
              Continue to Step 2 <ChevronRight className="h-3 w-3" />
            </button>
          )}

          {activeStep === 2 && (
            <button
              onClick={() => {
                if (formData.status === "APPROVED" || formData.status === "REVIEWED" || formData.status === "REJECTED") {
                  setActiveStep(3);
                } else {
                  handleSave(true);
                }
              }}
              disabled={isSaving}
              className={`px-6 py-3 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2 ${
                formData.status === "APPROVED" || formData.status === "REVIEWED" || formData.status === "REJECTED" ? "bg-slate-600 hover:bg-slate-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : formData.status === "APPROVED" || formData.status === "REVIEWED" || formData.status === "REJECTED" ? <ChevronRight className="h-3 w-3" /> : <Save className="h-3 w-3" />}
              {formData.status === "APPROVED" || formData.status === "REVIEWED" || formData.status === "REJECTED" ? "Continue to Step 3" : "Submit for Validation"}
            </button>
          )}

          {activeStep === 3 && formData.status === "APPROVED" && (
            <button
              onClick={() => {
                if (!formData.teacherObservation || !formData.studentPerformanceGood || !formData.studentPerformanceBad) {
                  alert("Please fill out Teacher Observation and Student Performance (Good & Bad) before signing off.");
                  return;
                }
                handleSave(false, "COMPLETED");
              }}
              disabled={isSaving}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-md flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <ClipboardList className="h-3 w-3" />}
              Sign Off & Complete
            </button>
          )}

          {activeStep === 3 && formData.status !== "APPROVED" && formData.status !== "COMPLETED" && (
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <ClipboardList className="h-3 w-3" />}
              Confirm & Final Submit
            </button>
          )}

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
