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

      <style jsx>{`
        .step-page {
          padding: 10px 12px 24px;
        }

        .hero {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          align-items: center;
          border-bottom: 1px solid #e8e1d4;
          padding: 4px 2px 18px;
          margin-bottom: 22px;
        }

        .eyebrow {
          color: #2f7d62;
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 7px;
        }

        .hero h2 {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          font-size: clamp(24px, 3vw, 36px);
          line-height: 1.1;
          margin: 0 0 8px;
          color: #17324d;
        }

        .hero p {
          margin: 0;
          color: #6f7d89;
          line-height: 1.6;
          font-size: 15px;
        }

        .hero-art {
          width: 92px;
          height: 92px;
          border-radius: 28px;
          background: linear-gradient(145deg, #f8edd0, #fffaf0);
          display: grid;
          place-items: center;
          font-size: 48px;
        }

        .connection {
          display: flex;
          gap: 12px;
          padding: 13px 15px;
          border-radius: 14px;
          background: #e8f3ee;
          border: 1px solid #cfe3d8;
          color: #265c49;
          margin-bottom: 20px;
        }

        .connection strong {
          display: block;
          margin-bottom: 2px;
        }

        .connection p {
          margin: 0;
          line-height: 1.45;
          font-size: 13px;
        }

        .card {
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid #d7d2c6;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 6px 18px rgba(31, 47, 61, 0.04);
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        label {
          font-size: 15px;
          font-weight: 800;
          color: #2f4658;
          margin-bottom: 9px;
        }

        .required::after {
          content: " *";
          color: #b95a50;
        }

        textarea {
          width: 100%;
          border: 1px solid #cfd9e1;
          border-radius: 12px;
          background: #fff;
          color: #203040;
          padding: 14px 16px;
          outline: none;
          transition: 0.18s ease;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          font-size: 18px;
          font-weight: 500;
          line-height: 1.6;
          resize: vertical;
        }

        textarea:focus {
          border-color: #5c8cac;
          box-shadow: 0 0 0 4px rgba(56, 111, 151, 0.11);
        }

        @media (max-width: 980px) {
          .hero-art {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
