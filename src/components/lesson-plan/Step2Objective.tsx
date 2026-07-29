"use client";

import React from "react";

interface Step2ObjectiveProps {
  formData: {
    objectiveVerb?: string;
    objectiveText?: string;
  };
  setFormData: (data: any) => void;
  isEditable?: boolean;
}

const OBJECTIVE_VERBS = [
  "understand",
  "identify",
  "describe",
  "explain",
  "differentiate",
  "compare",
  "demonstrate",
  "apply",
  "solve",
  "analyse",
  "create",
  "summarise",
];

export default function Step2Objective({
  formData,
  setFormData,
  isEditable = true,
}: Step2ObjectiveProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const objectivePreview =
    formData.objectiveVerb && formData.objectiveText
      ? `Students will be able to ${formData.objectiveVerb} ${formData.objectiveText}.`
      : "Your objective will appear here as one complete sentence.";

  return (
    <section className="step-page active" data-step="1">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 2 Â· Objective</div>
          <h2>What should students be able to do by the end?</h2>
          <p>Write one clear and realistic result for this lesson.</p>
        </div>
        <div className="hero-art">ðŸŽ¯</div>
      </div>

      <div className="connection">
        <div>â†’</div>
        <div>
          <strong>One lesson, one clear direction.</strong>
          <p>Choose an action word and complete the sentence in your own words.</p>
        </div>
      </div>

      <div className="card">
        <div className="grid">
          <div className="field col-4">
            <label className="required" htmlFor="objectiveVerb">
              Students will be able to...
            </label>
            <select
              id="objectiveVerb"
              name="objectiveVerb"
              value={formData.objectiveVerb || ""}
              onChange={(e) => handleChange("objectiveVerb", e.target.value)}
              disabled={!isEditable}
              required
            >
              <option value="">Select an action</option>
              {OBJECTIVE_VERBS.map((verb) => (
                <option key={verb} value={verb}>
                  {verb}
                </option>
              ))}
            </select>
          </div>

          <div className="field col-8">
            <label className="required" htmlFor="objectiveText">
              Complete the objective
            </label>
            <input
              id="objectiveText"
              name="objectiveText"
              value={formData.objectiveText || ""}
              onChange={(e) => handleChange("objectiveText", e.target.value)}
              placeholder="Example: solve multiplication questions using repeated addition"
              disabled={!isEditable}
              required
            />
          </div>
        </div>

        <div className="example-box">
          <p>{objectivePreview}</p>
        </div>
      </div>

      <style jsx>{`
        .example-box {
          margin-top: 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 14px 16px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #1e40af;
          line-height: 1.5;
        }

        .example-box p {
          margin: 0;
          font-style: italic;
        }
      `}</style>
    </section>
  );
}

