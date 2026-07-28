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
    let initialData: any = { selectedInstitute };

    if (initialFormData && Object.keys(initialFormData).length > 0) {
      initialData = { ...initialData, ...initialFormData };
      if (initialData.pages) {
        const [pageFrom, pageTo] = initialData.pages.split("-");
        initialData.pageFrom = parseInt(pageFrom);
        initialData.pageTo = parseInt(pageTo);
        delete initialData.pages;
      }
      console.log("Loading from initialFormData:", initialData);
      setFormData(initialData);
    } else if (existingData) {
      console.log("Loading from existingData:", existingData);
      setFormData(existingData);
    } else {
      const saved = localStorage.getItem("dpsLessonPlanDraftV1") || localStorage.getItem("lessonPlanDraft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log("Loading from localStorage:", parsed);
          setFormData({ ...parsed, selectedInstitute });
        } catch {
          console.log("Loading default initialData");
          setFormData(initialData);
        }
      } else {
        console.log("Loading default initialData");
        setFormData(initialData);
      }
    }
  }, [existingData, selectedInstitute, initialFormData]);

  useEffect(() => {
    if (!isMounted) return;
    const timeout = setTimeout(() => {
      localStorage.setItem("dpsLessonPlanDraftV1", JSON.stringify(formData));
    }, 800);
    return () => clearTimeout(timeout);
  }, [formData, isMounted]);

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
      4: ["activityTitle", "activityDescription"],
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
      const value = formData[field];
      return value !== null && value !== undefined && value !== "";
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

  const getStepLabel = (stepId: number) => {
    if (isQALesson && stepId === 3) return "Inspection & Support";
    return LESSON_PLAN_STEPS[stepId].label;
  };

  return (
    <div className="lesson-plan-studio w-full bg-slate-50 min-h-screen">
      <div className="w-full max-w-[1600px] mx-auto p-2 md:p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* SIDEBAR - Step Navigation */}
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                        isCurrent
                          ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                          : isCompleted
                          ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isCurrent
                            ? "bg-emerald-700 text-white"
                            : isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isCompleted ? <CheckCircle size={14} /> : String(displayIdx + 1).padStart(2, "0")}
                      </div>
                      <span className="text-sm">{getStepLabel(actualIdx)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 min-w-0 w-full">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Top Header & Progress */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Step {currentStepOrdinal + 1} of {activeSteps.length}
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {getStepLabel(currentStep)}
                    </h2>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {progress}% Complete
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-300"
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
                  />
                )}
              </div>

              {/* Bottom Sticky Action Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentStepOrdinal === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>

                {isReviewStep ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
                    >
                      <Printer size={16} />
                      Print / Save PDF
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !formData.ownershipConfirm || !isAllStepsValid()}
                      className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      title={!isAllStepsValid() ? "Please complete all required fields in all steps" : ""}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Mark Ready for Reviewer
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!isStepValid(currentStep)}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Continue
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
