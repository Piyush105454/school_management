"use client";

import React from "react";

interface Step4DiscussionProps {
  formData: {
    lessonType?: string;
    discussionPlan?: string;
    quieterStudentSupport?: string;
  };
  setFormData: (data: any) => void;
  isEditable?: boolean;
}

export default function Step4Discussion({
  formData,
  setFormData,
  isEditable = true,
}: Step4DiscussionProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const isQALesson = formData.lessonType === "Q&A";

  return (
    <section className="step-page active" data-step="3">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 4 Â· Discussion & Participation</div>
          <h2>
            {isQALesson
              ? "How will you inspect, support and involve every student during Q&A?"
              : "How will students discuss, answer and ask?"}
          </h2>
          <p>
            {isQALesson
              ? "Plan how you will inspect work, support participation and keep the Q&A moving for the whole class."
              : "Plan one connected discussion instead of several separate question boxes."}
          </p>
        </div>
        <div className="hero-art">ðŸ’¬</div>
      </div>

      <div className="connection">
        <div>â†’</div>
        <div>
          <strong>
            {isQALesson
              ? "Inspection and support must reach every benchâ€”not only the fastest students."
              : "Keep the discussion simple and two-way."}
          </strong>
          <p>
            {isQALesson
              ? "Use quick inclusive support during class. Move unresolved concerns to a calm Red Zone follow-up after the lesson instead of stopping everyone's learning."
              : "Write the question you will ask, how students will respond, and how you will invite their questions."}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="field">
          <label className="required" htmlFor="discussionPlan">
            {isQALesson ? "Inspection & support plan" : "Discussion plan"}
          </label>
          <textarea
            id="discussionPlan"
            name="discussionPlan"
            value={formData.discussionPlan || ""}
            onChange={(e) => handleChange("discussionPlan", e.target.value)}
            placeholder={
              isQALesson
                ? "Plan how you will check all benches, involve quieter students, give short support and save class time. If a concern needs more time, write how you will mark it for Red Zone follow-up and discuss it separately after class."
                : "Example: ask what happens after step 1; allow student pairs to discuss for 1 minute; call 2 quiet students to share; take 1 question from class."
            }
            disabled={!isEditable}
            rows={6}
            required
          />
        </div>

        <div className="field" style={{ marginTop: "20px" }}>
          <label className="required" htmlFor="quieterStudentSupport">
            How will you involve quieter or struggling students?
          </label>
          <textarea
            id="quieterStudentSupport"
            name="quieterStudentSupport"
            value={formData.quieterStudentSupport || ""}
            onChange={(e) => handleChange("quieterStudentSupport", e.target.value)}
            placeholder="Example: give thinking time, begin with an easy question, allow a bench partner discussion, and personally check two students who need support."
            disabled={!isEditable}
            rows={5}
            required
          />
        </div>
      </div>

    </section>
  );
}

