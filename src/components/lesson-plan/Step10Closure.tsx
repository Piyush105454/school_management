"use client";

import React from "react";

interface Step10ClosureProps {
  formData: {
    rewardType?: string;
    rewardCriteria?: string;
  };
  setFormData: (data: any) => void;
  isEditable?: boolean;
}

const REWARD_TYPES = [
  "Praise / Appreciation",
  "Points",
  "Recognition Card",
  "Small Item",
  "Class Applause",
  "No material reward",
];

export default function Step10Closure({
  formData,
  setFormData,
  isEditable = true,
}: Step10ClosureProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <section className="step-page active" data-step="9">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 10 · Closure & Reward</div>
          <h2>How will you close the lesson and recognise effort?</h2>
          <p>
            The lesson summary, appreciation and closure guidance are already included. Plan only
            the reward or recognition.
          </p>
        </div>
        <div className="hero-art">🏆</div>
      </div>

      <div className="connection">
        <div>✓</div>
        <div>
          <strong>Recognition motivates when it is specific and fair.</strong>
          <p>
            Name what students did well and why they deserve recognition. Keep it simple and
            inclusive.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="field">
          <label className="required" htmlFor="rewardType">
            Reward Type
          </label>
          <select
            id="rewardType"
            name="rewardType"
            value={formData.rewardType || ""}
            onChange={(e) => handleChange("rewardType", e.target.value)}
            disabled={!isEditable}
            required
          >
            <option value="">Select reward type</option>
            {REWARD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="required" htmlFor="rewardCriteria">
            Who will be recognised, and why?
          </label>
          <span className="hint">
            Be specific about student actions or participation. Avoid vague praise.
          </span>
          <textarea
            id="rewardCriteria"
            name="rewardCriteria"
            value={formData.rewardCriteria || ""}
            onChange={(e) => handleChange("rewardCriteria", e.target.value)}
            placeholder="Example: Students who complete the activity correctly and help their bench partner will receive praise and class applause."
            disabled={!isEditable}
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

        .field {
          margin-bottom: 16px;
        }

        .field:last-child {
          margin-bottom: 0;
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

        .hint {
          display: block;
          font-weight: 400;
          color: #6f7d89;
          margin-top: 4px;
          margin-bottom: 9px;
          line-height: 1.35;
          font-size: 13px;
        }

        select,
        textarea {
          width: 100%;
          border: 1px solid #cfd9e1;
          border-radius: 12px;
          background: #fff;
          color: #203040;
          padding: 14px 16px;
          outline: none;
          transition: 0.18s ease;
          font-family: "Kalam", "Segoe Print", cursive;
          font-size: 20px;
          font-weight: 500;
          line-height: 1.7;
        }

        select {
          min-height: 52px;
        }

        textarea {
          min-height: 150px;
          resize: vertical;
        }

        select:focus,
        textarea:focus {
          border-color: #5c8cac;
          box-shadow: 0 0 0 4px rgba(56, 111, 151, 0.11);
        }

        textarea::placeholder {
          color: #8a9299;
          opacity: 0.86;
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
