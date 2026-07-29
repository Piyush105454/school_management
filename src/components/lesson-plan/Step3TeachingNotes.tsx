"use client";

import React from "react";

interface Step3TeachingNotesProps {
  formData: {
    lessonType?: string;
    teacherOwnNotes?: string;
    teachingReferences?: string;
  };
  setFormData: (data: any) => void;
  isEditable?: boolean;
}

export default function Step3TeachingNotes({
  formData,
  setFormData,
  isEditable = true,
}: Step3TeachingNotesProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const isQALesson = formData.lessonType === "Q&A";

  return (
    <section className="step-page active" data-step="2">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 3 Â· Teaching Notes</div>
          <h2>
            {isQALesson
              ? "Write the questions, answers and teaching flow you will use."
              : "Write the teaching flow you will actually use."}
          </h2>
          <p>
            {isQALesson
              ? "Keep it practical: question, student response, correct answer and explanation."
              : "Keep it simple. Write in the same order in which you will teach."}
          </p>
        </div>
        <div className="hero-art">ðŸ“</div>
      </div>

      <div className="connection">
        <div>âœ¦</div>
        <div>
          <strong>Easy way to write:</strong>
          <p>
            {isQALesson
              ? "Write each question, the expected answer, how you will explain it, and the order in which students will write."
              : "Begin with the first point, continue in teaching order, and finish with what students must understand."}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="field">
          <label className="required" htmlFor="teacherOwnNotes">
            {isQALesson
              ? "Teacherâ€™s own Q&A teaching notes"
              : "Teacherâ€™s own teaching notes"}
          </label>
          <textarea
            id="teacherOwnNotes"
            name="teacherOwnNotes"
            value={formData.teacherOwnNotes || ""}
            onChange={(e) => handleChange("teacherOwnNotes", e.target.value)}
            placeholder={
              isQALesson
                ? "Write your complete Q&A teaching flow here:\n\n1. Read / ask the first questionâ€¦\n2. Let students answerâ€¦\n3. Explain the correct answerâ€¦\n4. Continue with the next questionâ€¦"
                : "Write your teaching flow here. Short points or numbering are enough:\n\n1. First I will explainâ€¦\n2. Then I will ask / solveâ€¦\n3. Students will respondâ€¦\n4. Finally I will summariseâ€¦"
            }
            disabled={!isEditable}
            rows={10}
            required
          />
        </div>

        <div className="field" style={{ marginTop: "20px" }}>
          <label htmlFor="teachingReferences">References</label>
          <textarea
            id="teachingReferences"
            name="teachingReferences"
            value={formData.teachingReferences || ""}
            onChange={(e) => handleChange("teachingReferences", e.target.value)}
            placeholder="Textbook page, notebook exercise, chart or board diagram reference."
            disabled={!isEditable}
            rows={3}
          />
        </div>
      </div>

    </section>
  );
}

