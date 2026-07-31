"use client";
import { useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Printer } from "lucide-react";

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
  { id: 10, num: "11", label: "Review" },
];

export default function LessonPlanReadOnly({ lessonPlanData }: any) {
  const [currentStep, setCurrentStep] = useState(0);

  const isQALesson = lessonPlanData?.lessonType === "Q&A";
  const activeSteps = isQALesson ? [0, 1, 2, 3, 5, 6, 7, 8, 9, 10] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const progress = Math.round(((activeSteps.indexOf(currentStep) + 1) / activeSteps.length) * 100);
  const isReviewStep = currentStep === 10;

  const handleNext = () => {
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

  const step = LESSON_PLAN_STEPS[currentStep];
  const getStepLabel = (stepId: number) => {
    if (isQALesson && stepId === 3) return "Inspection & Support";
    return LESSON_PLAN_STEPS[stepId].label;
  };

  const currentStepOrdinal = activeSteps.indexOf(currentStep);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Steps</h3>
              <div className="space-y-1">
                {LESSON_PLAN_STEPS.filter((_, idx) => activeSteps.includes(idx)).map((s, displayIdx) => {
                  const actualIdx = activeSteps[displayIdx];
                  const isCompleted = activeSteps.indexOf(actualIdx) < currentStepOrdinal;
                  const isCurrent = actualIdx === currentStep;
                  
                  return (
                    <button
                      key={s.id}
                      onClick={() => setCurrentStep(actualIdx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                        isCurrent ? "bg-blue-50 text-blue-700 font-semibold" : isCompleted ? "bg-slate-50 text-slate-700 hover:bg-slate-100" : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isCurrent ? "bg-blue-600 text-white" : isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                      }`}>
                        {isCompleted ? <CheckCircle size={14} /> : String(displayIdx + 1).padStart(2, "0")}
                      </div>
                      <span className="text-sm">{getStepLabel(actualIdx)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Step {currentStepOrdinal + 1} of {activeSteps.length}</p>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{getStepLabel(currentStep)}</h2>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="p-6 min-h-[400px]">
                {!isReviewStep ? (
                  <ReadOnlyContent step={currentStep} formData={lessonPlanData} isQALesson={isQALesson} />
                ) : (
                  <ReviewReadOnly formData={lessonPlanData} />
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button onClick={handlePrev} disabled={currentStepOrdinal === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={16} />
                  Back
                </button>

                {isReviewStep ? (
                  <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">
                    <Printer size={16} />
                    Print / Save as PDF
                  </button>
                ) : (
                  <button onClick={handleNext} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">
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

function ReadOnlyContent({ step, formData, isQALesson }: any) {
  const display = (v: any) => {
    if (v === null || v === undefined || v === '') return "—";
    return v;
  };

  if (step === 0) return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: "className", label: "Class Name" },
          { key: "subject", label: "Subject" },
          { key: "chapterNo", label: "Chapter No" },
          { key: "chapterName", label: "Chapter Name" },
          { key: "pageFrom", label: "Page From" },
          { key: "pageTo", label: "Page To" },
          { key: "prepDate", label: "Prep Date" },
          { key: "deliveryDate", label: "Delivery Date" },
          { key: "preparedBy", label: "Prepared By" },
          { key: "reviewerName", label: "Reviewer Name" },
          { key: "approverName", label: "Approver Name" },
        ].map(field => (
          <div key={field.key}>
            <label className="block text-sm font-semibold text-slate-900 mb-2">{field.label}</label>
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900">
              {display(formData?.[field.key])}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">Lesson Plan Type</label>
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm font-bold text-slate-900">
          {display(formData?.lessonType)}
        </div>
      </div>
    </div>
  );

  if (step === 1) {
    const verb = formData?.objectiveVerb;
    const text = formData?.objectiveText;
    const objective = verb && text ? `Students will be able to ${verb} ${text}.` : "—";
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Will be able to</label>
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900">
              {display(verb)}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Complete</label>
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900">
              {display(text)}
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-900 italic">{objective}</p>
        </div>
      </div>
    );
  }

  if (step === 2) return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">
        {isQALesson ? "Q&A Notes" : "Teaching Notes"}
      </label>
      <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 whitespace-pre-wrap font-mono min-h-[200px]">
        {display(formData?.teacherOwnNotes)}
      </div>
    </div>
  );

  if (step === 3) return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">
        {isQALesson ? "Inspection & Support" : "Discussion"}
      </label>
      <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 whitespace-pre-wrap min-h-[200px]">
        {display(formData?.discussionPlan)}
      </div>
    </div>
  );

  if (step === 4) return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Activity Type</label>
        <div className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900">
          {display(formData?.activityType)}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
        <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 whitespace-pre-wrap min-h-[150px]">
          {display(formData?.activityDescription)}
        </div>
      </div>
    </div>
  );

  if (step === 5) return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">Lesson Introduction</label>
      <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 whitespace-pre-wrap min-h-[200px]">
        {display(formData?.lessonIntroduction)}
      </div>
    </div>
  );

  if (step === 6) return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">Learning Indicators</label>
      <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 whitespace-pre-wrap min-h-[200px]">
        {display(formData?.learningIndicators)}
      </div>
    </div>
  );

  if (step === 7) return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Homework Given</label>
        <div className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900">
          {display(formData?.homeworkGiven)}
        </div>
      </div>
      {formData?.homeworkGiven === "Yes" && (
        <>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Task</label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 whitespace-pre-wrap min-h-[100px]">
              {display(formData?.homeworkTask)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Due Date</label>
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900">
              {display(formData?.homeworkDue)}
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (step === 8) return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">Energizer</label>
      <div className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900">
        {display(formData?.energizer)}
      </div>
    </div>
  );

  if (step === 9) return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">Closure & Reward</label>
      <div className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 whitespace-pre-wrap min-h-[150px]">
        {display(formData?.closure)}
      </div>
    </div>
  );

  return <div className="text-slate-500">Step content</div>;
}

function ReviewReadOnly({ formData }: any) {
  const display = (v: any) => v || "—";
  const emDash = "—";
  const bullet = "·";
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-1">DPS Lesson Plan</h2>
        <p className="text-slate-300">Lesson Preparation Form</p>
      </div>

      {/* Metadata Grid - Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border-2 border-slate-300 rounded p-3 bg-white">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Class</p>
          <p className="text-base font-bold text-slate-900">{display(formData?.className || formData?.class?.name)}</p>
        </div>
        <div className="border-2 border-slate-300 rounded p-3 bg-white">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Subject</p>
          <p className="text-base font-bold text-slate-900">{display(formData?.subject || formData?.subject?.name)}</p>
        </div>
        <div className="border-2 border-slate-300 rounded p-3 bg-white">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Chapter</p>
          <p className="text-base font-bold text-slate-900">{display(formData?.chapterNo)} {bullet} {display(formData?.chapterName)}</p>
        </div>
        <div className="border-2 border-slate-300 rounded p-3 bg-white">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Pages</p>
          <p className="text-base font-bold text-slate-900">{display(formData?.pageFrom)}{emDash}{display(formData?.pageTo)}</p>
        </div>
      </div>

      {/* Details Table - Main Content */}
      <div className="overflow-x-auto border-2 border-slate-300 rounded">
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <tbody>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900 w-1/3">Class</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800 break-words">{display(formData?.className || formData?.class?.name)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900">Subject</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800 break-words">{display(formData?.subject || formData?.subject?.name)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900">Objective</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800 break-words">{display(formData?.objectiveText)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900">Teaching Notes</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800 whitespace-pre-wrap break-words max-w-xl">{display(formData?.teacherOwnNotes)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900">Discussion & Participation</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800 whitespace-pre-wrap break-words max-w-xl">{display(formData?.discussionPlan)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900">Lesson Activity</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800 whitespace-pre-wrap break-words max-w-xl">{display(formData?.activityDescription)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900">Lesson Introduction</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800 whitespace-pre-wrap break-words max-w-xl">{display(formData?.lessonIntroduction)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900">Learning Indicators</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800 whitespace-pre-wrap break-words max-w-xl">{display(formData?.learningIndicators)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900">Homework</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800 break-words">{display(formData?.homeworkGiven)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900">Energizer</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800">{display(formData?.energizer)}</td>
            </tr>
            <tr>
              <td className="border border-slate-300 bg-slate-100 p-3 font-bold text-slate-900">Closure & Reward</td>
              <td className="border border-slate-300 bg-white p-3 text-slate-800 whitespace-pre-wrap max-w-xl">{display(formData?.closure)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t-2 border-slate-300">
        <div className="border-2 border-slate-300 rounded p-4 bg-white">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Prepared By</p>
          <p className="text-sm font-semibold text-slate-900 mb-6">{display(formData?.preparedBy)}</p>
          <p className="text-xs text-slate-600">Date: {display(formData?.prepDate)}</p>
        </div>
        <div className="border-2 border-slate-300 rounded p-4 bg-white">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Reviewer</p>
          <p className="text-sm font-semibold text-slate-900 mb-6">{display(formData?.reviewerName)}</p>
          <p className="text-xs text-slate-600">Sign: ___________</p>
        </div>
        <div className="border-2 border-slate-300 rounded p-4 bg-white">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Approver</p>
          <p className="text-sm font-semibold text-slate-900 mb-6">{display(formData?.approverName)}</p>
          <p className="text-xs text-slate-600">Sign: ___________</p>
        </div>
      </div>
    </div>
  );
}
