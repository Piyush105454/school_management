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
          <div className="eyebrow">Step 5 · Lesson Activity</div>
          <h2>What will students do with the learning?</h2>
          <p>Choose a simple activity that students can realistically complete in this class.</p>
        </div>
        <div className="hero-art">🧪</div>
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
            placeholder="Write 2 4 quick steps for how students will perform the activity."
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

    </section>
  );
}

