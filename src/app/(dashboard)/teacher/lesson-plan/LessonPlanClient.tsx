"use client";

import { useState, useEffect } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Save, Loader2, Printer } from "lucide-react";
import Step1LessonDetails from "@/components/lesson-plan/Step1LessonDetails";
import Step2Objective from "@/components/lesson-plan/Step2Objective";
import Step3TeachingNotes from "@/components/lesson-plan/Step3TeachingNotes";
import Step4Discussion from "@/components/lesson-plan/Step4Discussion";
import Step5LessonActivity from "@/components/lesson-plan/Step5LessonActivity";
import Step6LessonIntroduction from "@/components/lesson-plan/Step6LessonIntroduction";
import Step7LearningIndicators from "@/components/lesson-plan/Step7LearningIndicators";
import Step8Homework from "@/components/lesson-plan/Step8Homework";
import Step9Energizer from "@/components/lesson-plan/Step9Energizer";
import Step10Closure from "@/components/lesson-plan/Step10Closure";
import Step10ReviewUI from "@/components/lesson-plan/Step10ReviewUI";
import "@/components/lesson-plan/AllStepsStyles.css";

import { useSearchParams } from "next/navigation";

const LESSON_PLAN_STEPS = [
  { id: 0, num: "01", label: "Lesson Details" },
  { id: 1, num: "02", label: "Objective" },
  { id: 2, num: "03", label: "Teaching Notes" },
  { id: 3, num: "04", label: "Discussion & Participation" },
  { id: 4, num: "05", label: "Lesson Activity" },
  { id: 5, num: "06", label: "Lesson Introduction" },
  { id: 6, num: "07", label: "Learning Indicators" },
  { id: 7, num: "08", label: "Homework" },
  { id: 8, num: "09", label: "Energizer" },
  { id: 9, num: "10", label: "Closure & Reward" },
  { id: 10, num: "11", label: "Review & Submit" },
];

export default function LessonPlanClient({
  existingData,
  initialClasses = [],
  initialSubjects = [],
  selectedInstitute = "Dhanpuri Public School",
  initialFormData = {},
}: any) {
  const searchParams = useSearchParams();
  const urlPlanId = searchParams ? (searchParams.get("edit") || searchParams.get("id")) : null;

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({ selectedInstitute });
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const isQALesson = formData.lessonType === "Q&A";
  const activeSteps = isQALesson
    ? [0, 1, 2, 3, 5, 6, 7, 8, 9, 10]
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const currentStepOrdinal = activeSteps.indexOf(currentStep);
  const progress = Math.round(((currentStepOrdinal + 1) / activeSteps.length) * 100);
  const isReviewStep = currentStep === 10;
  
  // Check if lesson plan is submitted/reviewed - if so, make it read-only
  const isEditable = !formData.status || formData.status === "DRAFT";

  useEffect(() => {
    setIsMounted(true);
    // Clear any stale local storage keys
    try {
      localStorage.removeItem("dpsLessonPlanDraftV1");
      localStorage.removeItem("lessonPlanDraft");
    } catch (e) {}

    if (existingData) {
      setFormData(existingData);
      return;
    }

    if (urlPlanId) {
      setLoading(true);
      fetch(`/api/lesson-plan?id=${encodeURIComponent(urlPlanId)}&t=${Date.now()}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data) {
            setFormData(res.data);
          }
        })
        .catch((err) => console.error("Error loading lesson plan from url id:", err));
      return;
    }

    let initialData: any = { selectedInstitute };

    if (initialFormData && Object.keys(initialFormData).length > 0) {
      initialData = { ...initialData, ...initialFormData };
      if (initialData.pages && typeof initialData.pages === "string") {
        const [pageFrom, pageTo] = initialData.pages.split("-");
        initialData.pageFrom = parseInt(pageFrom, 10);
        initialData.pageTo = parseInt(pageTo, 10);
        delete initialData.pages;
      }
      setFormData(initialData);
    } else {
      setFormData(initialData);
    }
  }, [existingData, selectedInstitute, initialFormData, urlPlanId]);



  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Validate required fields for each step
  const getRequiredFieldsForStep = (stepId: number): (keyof typeof formData)[] => {
    const requiredFields: { [key: number]: (keyof typeof formData)[] } = {
      0: ["className", "subject", "chapterNo", "chapterName", "pageFrom", "pageTo", "prepDate", "deliveryDate", "preparedBy", "lessonType"],
      1: ["objectiveVerb", "objectiveText"],
      2: ["teacherOwnNotes"],
      3: ["discussionPlan"],
      4: ["activitySteps"],
      5: ["lessonHook"],
      6: ["indicator1"],
      7: ["homeworkGiven"],
      8: ["energizer"],
      9: ["rewardType", "rewardCriteria"],
    };
    return requiredFields[stepId] || [];
  };

  const isStepValid = (stepId: number): boolean => {
    const requiredFields = getRequiredFieldsForStep(stepId);
    return requiredFields.every((field) => {
      let value = formData[field];
      if (!value && field === "teacherOwnNotes") value = formData.teachingNotes;
      if (!value && field === "activitySteps") value = formData.activityDescription;
      return value !== null && value !== undefined && String(value).trim() !== "";
    });
  };


  const handleNext = () => {
    if (!isStepValid(currentStep)) {
      const requiredFields = getRequiredFieldsForStep(currentStep);
      const missingFields = requiredFields.filter(
        (field) => !formData[field]
      );
      alert(`Please fill in the required fields: ${missingFields.join(", ")}`);
      return;
    }

    const currentIdx = activeSteps.indexOf(currentStep);
    if (currentIdx < activeSteps.length - 1) {
      setCurrentStep(activeSteps[currentIdx + 1]);
    }
  };

  const handlePrev = () => {
    const currentIdx = activeSteps.indexOf(currentStep);
    if (currentIdx > 0) {
      setCurrentStep(activeSteps[currentIdx - 1]);
    }
  };

  // Check if all steps are valid
  const isAllStepsValid = (): boolean => {
    for (const stepId of activeSteps) {
      if (!isStepValid(stepId)) {
        return false;
      }
    }
    return true;
  };

  // Get all missing fields from all steps
  const getAllMissingFields = (): string[] => {
    const missingFields: string[] = [];
    for (const stepId of activeSteps) {
      const requiredFields = getRequiredFieldsForStep(stepId);
      const stepMissing = requiredFields.filter((field) => !formData[field]);
      missingFields.push(...stepMissing.map(String));
    }
    return missingFields;
  };

  const handleSubmit = async () => {
    // Check if ownership is confirmed
    if (!formData.ownershipConfirm) {
      alert("Please confirm 'I can teach this plan as written' before submitting.");
      return;
    }

    // Check if all steps are complete
    if (!isAllStepsValid()) {
      const missingFields = getAllMissingFields();
      alert(`Please complete all required fields before submitting.\n\nMissing fields: ${missingFields.join(", ")}`);
      return;
    }

    if (!confirm("Submit this lesson plan for review?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "SUBMITTED",
        }),
      });
      if (res.ok) {
        const result = await res.json();
        alert("Lesson Plan submitted successfully!");
        localStorage.removeItem("dpsLessonPlanDraftV1");
        localStorage.removeItem("lessonPlanDraft");
        
        if (result.data?.id) {
          // Get current user session to determine redirect
          try {
            const sessionRes = await fetch("/api/auth/session");
            const session = await sessionRes.json();
            
            // Redirect based on user role
            if (session?.user?.role === "TEACHER") {
              // Teachers go to their lesson plan page
              window.location.href = `/teacher/lesson-plan?id=${result.data.id}`;
            } else if (session?.user?.role === "PRINCIPAL" || session?.user?.role === "OFFICE" || session?.user?.role === "ADMIN") {
              // Admin/Office/Principal go to lesson plan review page
              window.location.href = `/office/academy-management/lesson-plan/review?id=${result.data.id}`;
            } else {
              // Fallback
              window.location.href = `/teacher/lesson-plan?id=${result.data.id}`;
            }
          } catch (sessionError) {
            console.error("Failed to get session:", sessionError);
            // Fallback to teacher page
            window.location.href = `/teacher/lesson-plan?id=${result.data.id}`;
          }
        }
      } else {
        const err = await res.json();
        alert(`Error submitting lesson plan: ${err.error || "Unknown error"}`);
      }
    } catch (e: any) {
      alert(`Submission error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const [classListStudents, setClassListStudents] = useState<any[]>([]);

  // Fetch class students for post-delivery record
  useEffect(() => {
    if (!formData.className) return;
    fetch(`/api/lesson-plan/form-data?className=${encodeURIComponent(formData.className)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.students && Array.isArray(data.students)) {
          setClassListStudents(data.students);
        }
      })
      .catch((err) => console.error("Failed to load class students:", err));
  }, [formData.className]);

  const isSubmittedPlan = Boolean(formData.status && formData.status !== "DRAFT");

  // Force step 10 when plan is submitted/reviewed/approved
  useEffect(() => {
    if (isSubmittedPlan) {
      setCurrentStep(10);
    }
  }, [isSubmittedPlan]);

  const handleFinalSignoff = async (postDeliveryData: any) => {
    setLoading(true);
    try {
      const updatedPayload = {
        ...formData,
        ...postDeliveryData,
        status: "COMPLETED",
      };

      const res = await fetch("/api/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setFormData((prev: any) => ({ ...prev, ...postDeliveryData, status: "COMPLETED" }));
        return true;
      } else {
        alert(`Error saving post-delivery record: ${result.error || "Unknown error"}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStepLabel = (stepId: number) => {
    if (isQALesson && stepId === 3) return "Inspection & Support";
    return LESSON_PLAN_STEPS[stepId].label;
  };

  return (
    <div className="lesson-plan-studio w-full bg-slate-50 min-h-screen">
      <div className="w-full max-w-[1600px] mx-auto p-2 md:p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* SIDEBAR - Step Navigation (Hidden when plan is submitted/reviewed/approved) */}
          {!isSubmittedPlan && (
            <div className="w-full lg:w-64 xl:w-72 shrink-0">
              <div className="sticky top-20 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">
                  Lesson Plan Steps
                </h3>
                <div className="space-y-1">
                  {LESSON_PLAN_STEPS.filter((_, idx) => activeSteps.includes(idx)).map((s, displayIdx) => {
                    const actualIdx = s.id;
                    const isCompleted = activeSteps.indexOf(actualIdx) < currentStepOrdinal;
                    const isCurrent = actualIdx === currentStep;

                    return (
                      <button
                        key={s.id}
                        onClick={() => setCurrentStep(actualIdx)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${
                          isCurrent
                            ? "bg-blue-50 text-blue-800 font-bold border border-blue-200 shadow-sm"
                            : isCompleted
                            ? "bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium"
                            : "text-slate-500 hover:bg-slate-50 font-normal"
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                            isCurrent
                              ? "bg-blue-600 text-white"
                              : isCompleted
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isCompleted ? <CheckCircle size={15} /> : String(displayIdx + 1).padStart(2, "0")}
                        </div>
                        <span className="text-sm">{getStepLabel(actualIdx)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}


          {/* MAIN CONTENT AREA */}
          <div className="flex-1 min-w-0 w-full">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Top Header & Progress */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                      Step {currentStepOrdinal + 1} of {activeSteps.length}
                    </p>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {getStepLabel(currentStep)}
                    </h2>
                  </div>
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-xs">
                    {progress}% Complete
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Render Step Content Component */}
              <div className="p-4 md:p-6 min-h-[450px]">
                {currentStep === 0 && (
                  <Step1LessonDetails
                    formData={formData}
                    setFormData={setFormData}
                    isEditable={isEditable}
                  />
                )}
                {currentStep === 1 && (
                  <Step2Objective
                    formData={formData}
                    setFormData={setFormData}
                    isEditable={isEditable}
                  />
                )}
                {currentStep === 2 && (
                  <Step3TeachingNotes
                    formData={formData}
                    setFormData={setFormData}
                    isEditable={isEditable}
                  />
                )}
                {currentStep === 3 && (
                  <Step4Discussion
                    formData={formData}
                    setFormData={setFormData}
                    isEditable={isEditable}
                  />
                )}
                {currentStep === 4 && !isQALesson && (
                  <Step5LessonActivity
                    formData={formData}
                    setFormData={setFormData}
                    isEditable={isEditable}
                  />
                )}
                {currentStep === 5 && (
                  <Step6LessonIntroduction
                    formData={formData}
                    setFormData={setFormData}
                    isEditable={isEditable}
                  />
                )}
                {currentStep === 6 && (
                  <Step7LearningIndicators
                    formData={formData}
                    setFormData={setFormData}
                    isEditable={isEditable}
                  />
                )}
                {currentStep === 7 && (
                  <Step8Homework
                    formData={formData}
                    setFormData={setFormData}
                    isEditable={isEditable}
                  />
                )}
                {currentStep === 8 && (
                  <Step9Energizer
                    formData={formData}
                    setFormData={setFormData}
                    isEditable={isEditable}
                  />
                )}
                {currentStep === 9 && (
                  <Step10Closure
                    formData={formData}
                    setFormData={setFormData}
                    isEditable={isEditable}
                  />
                )}
                {currentStep === 10 && (
                  <Step10ReviewUI
                    lessonPlanData={formData}
                    completionScore={progress}
                    onMarkReady={handleSubmit}
                    onPrint={() => window.print()}
                    ownershipConfirmed={!!formData.ownershipConfirm}
                    setOwnershipConfirmed={(val) => handleFieldChange("ownershipConfirm", val)}
                    submissionNote={formData.submissionNote || ""}
                    setSubmissionNote={(val) => handleFieldChange("submissionNote", val)}
                    classListStudents={classListStudents}
                    onFinalSignoff={handleFinalSignoff}
                  />
                )}
              </div>

              {/* Bottom Sticky Action Footer (Hidden when plan is submitted/reviewed/approved) */}
              {!isSubmittedPlan && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={currentStepOrdinal === 0}
                    className="flex items-center gap-2 px-5 py-2.5 h-11 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  <div className="flex items-center gap-3">
                    {currentStep === 10 ? (
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.ownershipConfirm}
                        className="flex items-center gap-2 px-7 py-2.5 h-11 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" size={16} /> Submitting...
                          </>
                        ) : (
                          <>
                            <Save size={16} /> Submit Lesson Plan
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-7 py-2.5 h-11 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md"
                      >
                        Continue <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
