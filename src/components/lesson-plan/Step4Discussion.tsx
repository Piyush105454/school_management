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
