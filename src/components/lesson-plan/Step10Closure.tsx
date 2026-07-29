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
          <div className="eyebrow">Step 10 Â· Closure & Reward</div>
          <h2>How will you close the lesson and recognise effort?</h2>
          <p>
            The lesson summary, appreciation and closure guidance are already included. Plan only
            the reward or recognition.
          </p>
        </div>
        <div className="hero-art">ðŸ†</div>
      </div>

      <div className="connection">
        <div>âœ“</div>
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

    </section>
  );
}

