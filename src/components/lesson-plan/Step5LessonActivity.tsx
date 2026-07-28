"use client";

import React from "react";

interface Step5LessonActivityProps {
  formData: {
    activityTitle?: string;
    activityMode?: string;
    activitySteps?: string;
    materials?: string;
    teacherRole?: string;
    activitySuccess?: string;
  };
  setFormData: (data: any) => void;
  isEditable?: boolean;
}

const ACTIVITY_MODES = [
  "Notebook-based",
  "Oral",
  "Demonstration",
  "Material-based",
  "Pair work",
  "Individual practice",
];

export default function Step5LessonActivity({
  formData,
  setFormData,
  isEditable = true,
}: Step5LessonActivityProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <section className="step-page active" data-step="4">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 5 Â· Lesson Activity</div>
          <h2>What will students do with the learning?</h2>
          <p>Choose a simple activity that students can realistically complete in this class.</p>
        </div>
        <div className="hero-art">ðŸŽ¨</div>
      </div>

      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="grid">
          <div className="field col-8">
            <label htmlFor="activityTitle">Activity title</label>
            <input
              id="activityTitle"
              name="activityTitle"
              value={formData.activityTitle || ""}
              onChange={(e) => handleChange("activityTitle", e.target.value)}
              placeholder="Give it a short, clear name"
              disabled={!isEditable}
            />
          </div>

          <div className="field col-4">
            <label htmlFor="activityMode">Activity mode</label>
            <select
              id="activityMode"
              name="activityMode"
              value={formData.activityMode || "Notebook-based"}
              onChange={(e) => handleChange("activityMode", e.target.value)}
              disabled={!isEditable}
            >
              {ACTIVITY_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: "16px" }}>
          <label className="required" htmlFor="activitySteps">
            Activity steps
          </label>
          <textarea
            id="activitySteps"
            name="activitySteps"
            value={formData.activitySteps || ""}
            onChange={(e) => handleChange("activitySteps", e.target.value)}
            placeholder="Write 2â€“4 quick steps for how students will perform the activity."
            disabled={!isEditable}
            rows={5}
            required
          />
        </div>
      </div>

      <div className="grid">
        <div className="card col-4">
          <div className="field">
            <label htmlFor="materials">Materials</label>
            <textarea
              id="materials"
              name="materials"
              value={formData.materials ?? "None"}
              onChange={(e) => handleChange("materials", e.target.value)}
              placeholder="Textbook, chalk, chart, leaves, coinsâ€¦"
              disabled={!isEditable}
              rows={4}
            />
          </div>
        </div>

        <div className="card col-4">
          <div className="field">
            <label htmlFor="teacherRole">Teacherâ€™s role</label>
            <textarea
              id="teacherRole"
              name="teacherRole"
              value={formData.teacherRole || ""}
              onChange={(e) => handleChange("teacherRole", e.target.value)}
              placeholder="I will demonstrate once and support students who need help."
              disabled={!isEditable}
              rows={4}
            />
          </div>
        </div>

        <div className="card col-4">
          <div className="field">
            <label htmlFor="activitySuccess">Success check</label>
            <textarea
              id="activitySuccess"
              name="activitySuccess"
              value={formData.activitySuccess || ""}
              onChange={(e) => handleChange("activitySuccess", e.target.value)}
              placeholder="Students will complete / identify / explainâ€¦"
              disabled={!isEditable}
              rows={4}
            />
          </div>
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

        .card {
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid #d7d2c6;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 6px 18px rgba(31, 47, 61, 0.04);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
        }

        .col-4 {
          grid-column: span 4;
        }
        .col-8 {
          grid-column: span 8;
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

        input,
        select {
          width: 100%;
          border: 1px solid #cfd9e1;
          border-radius: 12px;
          background: #fff;
          color: #203040;
          padding: 14px 16px;
          outline: none;
          transition: 0.18s ease;
          min-height: 52px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          font-size: 18px;
          font-weight: 500;
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

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #5c8cac;
          box-shadow: 0 0 0 4px rgba(56, 111, 151, 0.11);
        }

        @media (max-width: 980px) {
          .hero-art {
            display: none;
          }
          .col-4,
          .col-8 {
            grid-column: span 12;
          }
        }
      `}</style>
    </section>
  );
}
