"use client";

import { useState, useEffect } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";

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

export default function LessonPlanClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const isQALesson = formData.lessonType === "Q&A";
  const activeSteps = isQALesson ? [0, 1, 2, 3, 5, 6, 7, 8, 9, 10] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const progress = Math.round(((activeSteps.indexOf(currentStep) + 1) / activeSteps.length) * 100);
  const isReviewStep = currentStep === 10;

  useEffect(() => {
    const saved = localStorage.getItem("lessonPlanDraft");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem("lessonPlanDraft", JSON.stringify(formData));
    }, 800);
    return () => clearTimeout(timeout);
  }, [formData]);

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const handleSubmit = async () => {
    if (!confirm("Submit this lesson plan?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Lesson Plan submitted successfully!");
        localStorage.removeItem("lessonPlanDraft");
        setFormData({});
        setCurrentStep(0);
      } else {
        alert("Error submitting lesson plan");
      }
    } finally {
      setLoading(false);
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
          {/* SIDEBAR - Step Navigation */}
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
                        isCurrent
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : isCompleted
                          ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isCurrent
                          ? "bg-blue-600 text-white"
                          : isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
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

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Step {currentStepOrdinal + 1} of {activeSteps.length}</p>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{getStepLabel(currentStep)}</h2>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 min-h-[400px]">
                {!isReviewStep ? (
                  <StepContent step={currentStep} formData={formData} onChange={handleFieldChange} isQALesson={isQALesson} />
                ) : (
                  <ReviewContent formData={formData} />
                )}
              </div>

              {/* Footer - Navigation */}
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
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Submit Lesson Plan
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
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

function StepContent({ step, formData, onChange, isQALesson }: any) {
  // Step 0: Lesson Details
  if (step === 0) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Class *</label>
            <select value={formData.className || ""} onChange={(e) => onChange("className", e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
              <option value="">Select class</option>
              {["Nursery", "KG 1", "KG 2", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Subject *</label>
            <select value={formData.subject || ""} onChange={(e) => onChange("subject", e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
              <option value="">Select subject</option>
              {["English", "Hindi", "Mathematics", "Environmental Studies", "Science", "Social Science", "Computer", "General Knowledge", "Moral Science", "Other"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Chapter Number *</label>
            <input type="text" value={formData.chapterNo || ""} onChange={(e) => onChange("chapterNo", e.target.value)} placeholder="Example: 5" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Chapter Name *</label>
            <input type="text" value={formData.chapterName || ""} onChange={(e) => onChange("chapterName", e.target.value)} placeholder="Write the exact chapter name" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Page From *</label>
            <input type="number" min="1" value={formData.pageFrom || ""} onChange={(e) => onChange("pageFrom", e.target.value)} placeholder="12" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Page To *</label>
            <input type="number" min="1" value={formData.pageTo || ""} onChange={(e) => onChange("pageTo", e.target.value)} placeholder="15" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Preparation Date *</label>
            <input type="date" value={formData.prepDate || ""} onChange={(e) => onChange("prepDate", e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Delivery Date *</label>
            <input type="date" value={formData.deliveryDate || ""} onChange={(e) => onChange("deliveryDate", e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Prepared By *</label>
            <input type="text" value={formData.preparedBy || ""} onChange={(e) => onChange("preparedBy", e.target.value)} placeholder="Teacher name" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Reviewer</label>
            <input type="text" value={formData.reviewerName || ""} onChange={(e) => onChange("reviewerName", e.target.value)} placeholder="Reviewer name" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Approver</label>
            <input type="text" value={formData.approverName || ""} onChange={(e) => onChange("approverName", e.target.value)} placeholder="Approver name" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-semibold text-slate-900 mb-3">Lesson Plan Type *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.lessonType === "Explanation" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
              <input type="radio" name="lessonType" value="Explanation" checked={formData.lessonType === "Explanation"} onChange={(e) => onChange("lessonType", e.target.value)} className="mt-1" />
              <div>
                <strong className="block text-sm font-bold text-slate-900">Explanation</strong>
                <span className="text-xs text-slate-600">Introduce and explain a new concept, followed by discussion and a student activity.</span>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.lessonType === "Q&A" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
              <input type="radio" name="lessonType" value="Q&A" checked={formData.lessonType === "Q&A"} onChange={(e) => onChange("lessonType", e.target.value)} className="mt-1" />
              <div>
                <strong className="block text-sm font-bold text-slate-900">Question & Answer</strong>
                <span className="text-xs text-slate-600">Discuss, solve and write chapter-based answers with teacher inspection and support.</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }
  
  // Step 1: Objective
  else if (step === 1) {
    const objectivePreview = formData.objectiveVerb && formData.objectiveText 
      ? `Students will be able to ${formData.objectiveVerb} ${formData.objectiveText}.`
      : "Your objective will appear here as one complete sentence.";
    
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 mb-4">Write one clear and realistic result for this lesson.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Students will be able to... *</label>
            <select value={formData.objectiveVerb || ""} onChange={(e) => onChange("objectiveVerb", e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
              <option value="">Select an action</option>
              {["understand", "identify", "describe", "explain", "differentiate", "compare", "demonstrate", "apply", "solve", "analyse", "create", "summarise"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Complete the objective *</label>
            <input type="text" value={formData.objectiveText || ""} onChange={(e) => onChange("objectiveText", e.target.value)} placeholder="Example: solve multiplication questions using repeated addition" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
        </div>
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-900 italic">{objectivePreview}</p>
        </div>
      </div>
    );
  }
  
  // Step 2: Teaching Notes
  else if (step === 2) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">{isQALesson ? "Write the questions, answers and teaching flow you will use." : "Write the teaching flow you will actually use."}</h3>
        <p className="text-sm text-slate-600 mb-4">{isQALesson ? "Keep it practical: question, student response, correct answer and explanation." : "Keep it simple. Write in the same order in which you will teach."}</p>
        {isQALesson && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 mb-4">
            <span>✦</span>
            <div>
              <strong>Easy way to write:</strong> Write each question, the expected answer, how you will explain it, and the order in which students will write.
            </div>
          </div>
        )}
        {!isQALesson && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 mb-4">
            <span>✦</span>
            <div>
              <strong>Easy way to write:</strong> Begin with the first point, continue in teaching order, and finish with what students must understand.
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">{isQALesson ? "Teacher's Own Q&A Teaching Notes *" : "Teacher's Own Teaching Notes *"}</label>
          <textarea 
            value={formData.teacherOwnNotes || ""} 
            onChange={(e) => onChange("teacherOwnNotes", e.target.value)} 
            placeholder={isQALesson 
              ? "Write your complete Q&A teaching flow here:\n\n1. Read / ask the first question…\n2. Let students answer…\n3. Explain the correct answer…\n4. Continue with the next question…"
              : "Write your teaching flow here. Short points or numbering are enough:\n\n1. First I will explain…\n2. Then I will ask / solve…\n3. Students will respond…\n4. Finally I will summarise…"
            }
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical" 
            rows={10} 
          />
        </div>
      </div>
    );
  }
  
  // Step 3: Discussion & Participation OR Inspection & Support
  else if (step === 3) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">{isQALesson ? "How will you inspect, support and involve every student during Q&A?" : "How will students discuss, answer and ask?"}</h3>
        <p className="text-sm text-slate-600 mb-4">{isQALesson ? "Plan how you will inspect work, support participation and keep the Q&A moving for the whole class." : "Plan one connected discussion instead of several separate question boxes."}</p>
        <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900 mb-4">
          <span>→</span>
          <div>
            <strong>{isQALesson ? "Inspection and support must reach every bench—not only the fastest students." : "Keep the discussion simple and two-way."}</strong>
            <p className="mt-1">{isQALesson ? "Use quick inclusive support during class. Move unresolved concerns to a calm Red Zone follow-up after the lesson instead of stopping everyone's learning." : "Write the question you will ask, how students will respond, and how you will invite their questions."}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">{isQALesson ? "How will you involve quieter or struggling students during Q&A? *" : "How will you involve quieter or struggling students? *"}</label>
          <textarea 
            value={formData.discussionPlan || ""} 
            onChange={(e) => onChange("discussionPlan", e.target.value)} 
            placeholder={isQALesson 
              ? "Plan how you will check all benches, involve quieter students, give short support and save class time. If a concern needs more time, write how you will mark it for Red Zone follow-up and discuss it separately after class."
              : "Example: give thinking time, begin with an easy question, allow a bench partner discussion, and personally check two students who need support."
            }
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical" 
            rows={8} 
          />
        </div>
      </div>
    );
  }
  
  // Step 4: Lesson Activity
  else if (step === 4) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 mb-4">Choose a simple activity that students can realistically complete in this class.</p>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Activity Type *</label>
          <select value={formData.activityType || ""} onChange={(e) => onChange("activityType", e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
            <option value="">Select activity type</option>
            {["Worksheet", "Group Work", "Individual Practice", "Pair Work", "Drawing/Diagram", "Hands-on Activity", "Role Play", "Discussion", "Quiz", "Other"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Activity Description *</label>
          <textarea value={formData.activityDescription || ""} onChange={(e) => onChange("activityDescription", e.target.value)} placeholder="Describe what students will do in this activity..." className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical" rows={6} />
        </div>
      </div>
    );
  }
  
  // Step 5: Lesson Introduction
  else if (step === 5) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 mb-4">Use a familiar question, situation, object, image, previous lesson or short story.</p>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Lesson Introduction *</label>
          <textarea value={formData.lessonIntroduction || ""} onChange={(e) => onChange("lessonIntroduction", e.target.value)} placeholder="Describe how you will introduce this lesson to engage students..." className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical" rows={6} />
        </div>
      </div>
    );
  }
  
  // Step 6: Learning Indicators
  else if (step === 6) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 mb-4">Write 2–3 visible indicators. Each one should help you check students during or immediately after the lesson.</p>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Learning Indicators *</label>
          <textarea value={formData.learningIndicators || ""} onChange={(e) => onChange("learningIndicators", e.target.value)} placeholder="Example:&#10;1. Students can solve 3 multiplication problems correctly&#10;2. Students can explain the relationship between multiplication and addition&#10;3. Students participate actively in discussion" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical" rows={6} />
        </div>
      </div>
    );
  }
  
  // Step 7: Homework
  else if (step === 7) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 mb-4">Homework is optional. Give it only when it strengthens learning and can be clearly understood by students and parents.</p>
        
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">Will you give homework? *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.homeworkGiven === "Yes" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
              <input 
                type="radio" 
                name="homeworkGiven" 
                value="Yes" 
                checked={formData.homeworkGiven === "Yes"} 
                onChange={(e) => onChange("homeworkGiven", e.target.value)} 
                className="mt-1" 
              />
              <div>
                <strong className="block text-sm font-bold text-slate-900">Yes</strong>
                <span className="text-xs text-slate-600">I have a clear, useful task for students.</span>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.homeworkGiven === "No" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
              <input 
                type="radio" 
                name="homeworkGiven" 
                value="No" 
                checked={formData.homeworkGiven === "No"} 
                onChange={(e) => onChange("homeworkGiven", e.target.value)} 
                className="mt-1" 
              />
              <div>
                <strong className="block text-sm font-bold text-slate-900">No</strong>
                <span className="text-xs text-slate-600">The lesson does not need homework today.</span>
              </div>
            </label>
          </div>
        </div>

        {formData.homeworkGiven === "Yes" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Homework Task *</label>
              <textarea 
                value={formData.homeworkTask || ""} 
                onChange={(e) => onChange("homeworkTask", e.target.value)} 
                placeholder="Write exactly what students must do at home." 
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical" 
                rows={5} 
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Submission Date</label>
                <input 
                  type="date" 
                  value={formData.homeworkDue || ""} 
                  onChange={(e) => onChange("homeworkDue", e.target.value)} 
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Special Instruction</label>
                <textarea 
                  value={formData.homeworkInstruction || ""} 
                  onChange={(e) => onChange("homeworkInstruction", e.target.value)} 
                  placeholder="Example: complete independently; parent signature; bring one local example." 
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical" 
                  rows={3} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Step 8: Energizer
  else if (step === 8) {
    const ENERGIZERS = [
      { name: "Follow My Taali", desc: "Teacher performs 4–5 simple clap patterns. Students observe and repeat together. End with one final class clap." },
      { name: "Aam–Kela–Papita Rhythm", desc: "Aam = 1 clap, Kela = 2 claps, Papita = clap–lap–clap. Teacher calls a fruit and students perform the beat." },
      { name: "Count and Clap", desc: "Teacher says or shows a number from 1–5. Students clap exactly that many times." },
      { name: "Clap–Lap–Snap", desc: "Students repeat clap hands, tap thighs, snap or rub fingers. Start slowly and increase speed slightly." },
      { name: "Finger Spider Walk", desc: "Touch each finger to the thumb, then make fingers walk upward and downward in the air." },
      { name: "Finger Copy Challenge", desc: "Teacher shows quick hand positions. Students copy, ending with different positions on each hand." },
      { name: "Up–Down–Left–Right Hands", desc: "Teacher calls hand directions while students keep elbows close to the body and follow quickly." },
      { name: "Machhli Jal Ki Rani – Hand Actions", desc: "Students use small fish-like hand actions while reciting one short verse." },
      { name: "Aloo Kachaloo – Expression Actions", desc: "Students recite a short part with small expression and hand actions." },
      { name: "Lakdi Ki Kathi – Horse Beat", desc: "Students tap alternate hands softly on their thighs like a horse beat." },
      { name: "Teacher Says – Shikshak Kehte Hain", desc: "Students act only when the instruction begins with 'Teacher says'." },
      { name: "Opposite Action Challenge", desc: "Teacher says up, left or open; students perform the safe opposite action." },
      { name: "Red Light–Green Light at Place", desc: "Green = gentle march at place, yellow = slow, red = freeze. No forward movement." },
      { name: "Move and Freeze", desc: "Students move only hands, shoulders and head, then freeze immediately on the signal." },
      { name: "Cross-Touch Brain Gym", desc: "Students touch opposite shoulder and opposite knee without stepping away from the bench." },
    ];

    const selectedEnergizer = ENERGIZERS.find(e => e.name === formData.energizer);

    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 mb-4">Choose a one-minute activity that can be performed while sitting or standing at the same place.</p>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Energizer Activity *</label>
          <select value={formData.energizer || ""} onChange={(e) => onChange("energizer", e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
            <option value="">Select an activity</option>
            {ENERGIZERS.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
          </select>
        </div>
        {selectedEnergizer && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-bold text-blue-900 mb-2">{selectedEnergizer.name}</h4>
            <p className="text-sm text-blue-800">{selectedEnergizer.desc}</p>
          </div>
        )}
      </div>
    );
  }
  
  // Step 9: Closure & Reward
  else if (step === 9) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 mb-4">The lesson summary, appreciation and closure guidance are already included. Plan only the reward or recognition.</p>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Reward/Recognition Plan *</label>
          <textarea value={formData.closure || ""} onChange={(e) => onChange("closure", e.target.value)} placeholder="Describe how you will recognize student effort and close the lesson..." className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical" rows={5} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center py-12 text-slate-500">
      <p className="text-sm">Step {step + 1} content</p>
    </div>
  );
}

function ReviewContent({ formData }: any) {
  const isQA = formData.lessonType === "Q&A";
  
  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-emerald-900">✓ Review your lesson plan before submitting</p>
      </div>

      {/* Lesson Plan Preview - styled like a document */}
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-lg">
        {/* Header */}
        <div className="grid grid-cols-2 border-b border-slate-400">
          <div className="p-4 border-r border-slate-400">
            <h3 className="text-center text-xl font-bold text-slate-900">DPS Lesson Plan</h3>
          </div>
          <div className="p-4">
            <p className="text-center text-lg font-semibold text-slate-800">Lesson Preparation Form</p>
          </div>
        </div>

        {/* Meta Information */}
        <div className="grid grid-cols-4 border-b border-slate-400 text-xs">
          <div className="p-2 border-r border-slate-400">
            <strong className="block text-slate-600 uppercase mb-1">Class</strong>
            <span className="text-slate-900">{formData.className || "—"}</span>
          </div>
          <div className="p-2 border-r border-slate-400">
            <strong className="block text-slate-600 uppercase mb-1">Subject</strong>
            <span className="text-slate-900">{formData.subject || "—"}</span>
          </div>
          <div className="p-2 border-r border-slate-400">
            <strong className="block text-slate-600 uppercase mb-1">Chapter</strong>
            <span className="text-slate-900">{formData.chapterNo ? `${formData.chapterNo}: ${formData.chapterName}` : "—"}</span>
          </div>
          <div className="p-2">
            <strong className="block text-slate-600 uppercase mb-1">Pages</strong>
            <span className="text-slate-900">{formData.pageFrom && formData.pageTo ? `${formData.pageFrom}-${formData.pageTo}` : "—"}</span>
          </div>
        </div>

        {/* Main Content Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <tbody>
              {/* Objective */}
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-3 font-bold text-slate-800 w-48 border-r border-slate-300 align-top">Objective</td>
                <td className="p-3 text-slate-900">
                  {formData.objectiveVerb && formData.objectiveText 
                    ? `Students will be able to ${formData.objectiveVerb} ${formData.objectiveText}.`
                    : "—"}
                </td>
              </tr>

              {/* Teaching Notes */}
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-3 font-bold text-slate-800 border-r border-slate-300 align-top">
                  {isQA ? "Q&A Teaching Notes" : "Teaching Notes"}
                </td>
                <td className="p-3 text-slate-900 whitespace-pre-wrap font-mono text-xs">{formData.teacherOwnNotes || "—"}</td>
              </tr>

              {/* Discussion/Inspection */}
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-3 font-bold text-slate-800 border-r border-slate-300 align-top">
                  {isQA ? "Inspection & Support" : "Discussion & Participation"}
                </td>
                <td className="p-3 text-slate-900 whitespace-pre-wrap">{formData.discussionPlan || "—"}</td>
              </tr>

              {/* Activity (only for Explanation type) */}
              {!isQA && formData.activityType && (
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-3 font-bold text-slate-800 border-r border-slate-300 align-top">Lesson Activity</td>
                  <td className="p-3 text-slate-900">
                    <strong className="block mb-1">{formData.activityType}</strong>
                    <p className="whitespace-pre-wrap">{formData.activityDescription || "—"}</p>
                  </td>
                </tr>
              )}

              {/* Lesson Introduction */}
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-3 font-bold text-slate-800 border-r border-slate-300 align-top">Lesson Introduction</td>
                <td className="p-3 text-slate-900 whitespace-pre-wrap">{formData.lessonIntroduction || "—"}</td>
              </tr>

              {/* Learning Indicators */}
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-3 font-bold text-slate-800 border-r border-slate-300 align-top">Learning Indicators</td>
                <td className="p-3 text-slate-900 whitespace-pre-wrap">{formData.learningIndicators || "—"}</td>
              </tr>

              {/* Homework */}
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-3 font-bold text-slate-800 border-r border-slate-300 align-top">Homework</td>
                <td className="p-3 text-slate-900 whitespace-pre-wrap">{formData.homework || "None"}</td>
              </tr>

              {/* Energizer */}
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-3 font-bold text-slate-800 border-r border-slate-300 align-top">Energizer</td>
                <td className="p-3 text-slate-900">{formData.energizer || "—"}</td>
              </tr>

              {/* Closure & Reward */}
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-3 font-bold text-slate-800 border-r border-slate-300 align-top">Closure & Reward</td>
                <td className="p-3 text-slate-900 whitespace-pre-wrap">{formData.closure || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer - Signatures */}
        <div className="grid grid-cols-3 border-t border-slate-400 text-xs">
          <div className="p-3 border-r border-slate-400">
            <strong className="block text-slate-600 uppercase mb-2">Prepared By</strong>
            <p className="text-slate-900 mb-3">{formData.preparedBy || "—"}</p>
            <p className="text-slate-500">Date: {formData.prepDate || "—"}</p>
          </div>
          <div className="p-3 border-r border-slate-400">
            <strong className="block text-slate-600 uppercase mb-2">Reviewer</strong>
            <p className="text-slate-900 mb-3">{formData.reviewerName || "—"}</p>
          </div>
          <div className="p-3">
            <strong className="block text-slate-600 uppercase mb-2">Approver</strong>
            <p className="text-slate-900 mb-3">{formData.approverName || "—"}</p>
          </div>
        </div>

        {/* Delivery Date */}
        <div className="bg-slate-50 p-3 border-t border-slate-300 text-xs">
          <strong className="text-slate-600 uppercase">Delivery Date:</strong>
          <span className="ml-2 text-slate-900">{formData.deliveryDate || "—"}</span>
        </div>
      </div>
    </div>
  );
}
