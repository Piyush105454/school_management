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
          <div className="eyebrow">Step 2 · Objective</div>
          <h2>What should students be able to do by the end?</h2>
          <p>Write one clear and realistic result for this lesson.</p>
        </div>
        <div className="hero-art">🎯</div>
      </div>

      <div className="connection">
        <div>→</div>
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
          font-family: Georgia, serif;
          font-size: clamp(26px, 3vw, 38px);
          line-height: 1.08;
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
          padding: 18px;
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
          margin-bottom: 16px;
        }

        label {
          display: block;
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
          font-family: "Kalam", "Segoe Print", cursive;
          font-size: 20px;
          font-weight: 500;
        }

        input:focus,
        select:focus {
          border-color: #5c8cac;
          box-shadow: 0 0 0 4px rgba(56, 111, 151, 0.11);
        }

        .example-box {
          margin-top: 16px;
          background: #fff6de;
          border: 1px solid #ead9ad;
          border-radius: 14px;
          padding: 14px 17px;
          font-family: "Kalam", "Segoe Print", cursive;
          font-size: 17px;
          font-weight: 500;
          color: #755b1f;
          line-height: 1.6;
        }

        .example-box p {
          margin: 0;
          font-style: italic;
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
