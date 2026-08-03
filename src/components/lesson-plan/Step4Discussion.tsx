"use client";

import React from "react";
import RichTextEditor from "@/components/common/RichTextEditor";

interface Step4DiscussionProps {
  formData: {
    lessonType?: string;
    discussionPlan?: string;
    knowledgeBuildingPlan?: string;
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

  const adjustTextarea = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 100)}px`;
    }
  };

  return (
    <section className="step-page active" data-step="3">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 4 · Discussion &amp; Participation</div>
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
        <div className="hero-art">💬</div>
      </div>

      <div className="connection">
        <div>✦</div>
        <div>
          <strong>
            {isQALesson
              ? "Inspection and support must reach every bench—not only the fastest students."
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
        {/* Field 1: Inspection & Support Plan (Q&A) OR Discussion Plan (Explanation) */}
        <div className="field">
          <label className="required" htmlFor="discussionPlan">
            {isQALesson ? "Inspection & support plan" : "Discussion plan"}
          </label>
          <RichTextEditor
            id="discussionPlan"
            value={formData.discussionPlan || ""}
            onChange={(val) => handleChange("discussionPlan", val)}
            placeholder={
              isQALesson
                ? "Plan how you will check all benches, involve quieter students, give short support and save class time. If a concern needs more time, write how you will mark it for Red Zone follow-up and discuss it separately after class."
                : "Example: ask what happens after step 1; allow student pairs to discuss for 1 minute; call 2 quiet students to share; take 1 question from class."
            }
            disabled={!isEditable}
            minHeight="150px"
          />
        </div>

        {/* Field 2: Knowledge Building · Discussion Plan (separate from Field 1) */}
        <div className="field" style={{ marginTop: "20px" }}>
          <label className="required" htmlFor="knowledgeBuildingPlan">
            {isQALesson
              ? "Knowledge building & discussion plan"
              : "Knowledge building & discussion"}
          </label>
          <RichTextEditor
            id="knowledgeBuildingPlan"
            value={formData.knowledgeBuildingPlan || ""}
            onChange={(val) => handleChange("knowledgeBuildingPlan", val)}
            placeholder={
              isQALesson
                ? "Describe how you will consolidate student understanding through group discussion, peer explanation or key question sequences after the Q&A activity."
                : "Describe how students will build on what they have learned — e.g. pair discussion, class debate, student-led summary or question-and-answer to deepen understanding."
            }
            disabled={!isEditable}
            minHeight="120px"
          />
        </div>

        {/* Field 3: Quieter / Struggling Students */}
        <div className="field" style={{ marginTop: "20px" }}>
          <label className="required" htmlFor="quieterStudentSupport">
            How will you involve quieter or struggling students?
          </label>
          <textarea
            id="quieterStudentSupport"
            name="quieterStudentSupport"
            value={formData.quieterStudentSupport || ""}
            ref={adjustTextarea}
            onInput={(e) => adjustTextarea(e.currentTarget)}
            onChange={(e) => {
              adjustTextarea(e.currentTarget);
              handleChange("quieterStudentSupport", e.target.value);
            }}
            placeholder="Example: give thinking time, begin with an easy question, allow a bench partner discussion, and personally check two students who need support."
            disabled={!isEditable}
            rows={4}
            style={{ overflow: "hidden", resize: "none" }}
            required
          />
        </div>
      </div>

    </section>
  );
}
