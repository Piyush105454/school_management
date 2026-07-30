"use client";

import React from "react";

interface Step7LearningIndicatorsProps {
  formData: {
    indicator1?: string;
    indicator2?: string;
    indicator3?: string;
  };
  setFormData: (data: any) => void;
  isEditable?: boolean;
}

export default function Step7LearningIndicators({
  formData,
  setFormData,
  isEditable = true,
}: Step7LearningIndicatorsProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <section className="step-page active" data-step="6">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 7 · Learning Indicators</div>
          <h2>How will you check if students learned?</h2>
          <p>
            Write 2–3 visible indicators. Each one should help you check students during or
            immediately after the lesson.
          </p>
        </div>
        <div className="hero-art">📊</div>
      </div>

      <div className="connection">
        <div>✓</div>
        <div>
          <strong>Think about what you can actually see, hear or check in class.</strong>
          <p>
            Good indicators are specific, realistic and connected to your objective. Avoid vague
            statements.
          </p>
        </div>
      </div>

      <div className="card">
        <p className="card-note">
          Write at least 2 indicators. You may add a third one if useful.
        </p>

        <div className="repeater">
          <div className="indicator">
            <div className="indicator-num">1</div>
            <div className="field">
              <label className="required" htmlFor="indicator1">
                First Indicator
              </label>
              <input
                id="indicator1"
                name="indicator1"
                value={formData.indicator1 || ""}
                onChange={(e) => handleChange("indicator1", e.target.value)}
                placeholder="Example: Students can solve 3 multiplication problems correctly"
                disabled={!isEditable}
                required
              />
            </div>
          </div>

          <div className="indicator">
            <div className="indicator-num">2</div>
            <div className="field">
              <label className="required" htmlFor="indicator2">
                Second Indicator
              </label>
              <input
                id="indicator2"
                name="indicator2"
                value={formData.indicator2 || ""}
                onChange={(e) => handleChange("indicator2", e.target.value)}
                placeholder="Example: Students can explain the relationship between multiplication and addition"
                disabled={!isEditable}
                required
              />
            </div>
          </div>

          <div className="indicator">
            <div className="indicator-num">3</div>
            <div className="field">
              <label htmlFor="indicator3">Third Indicator (Optional)</label>
              <input
                id="indicator3"
                name="indicator3"
                value={formData.indicator3 || ""}
                onChange={(e) => handleChange("indicator3", e.target.value)}
                placeholder="Example: Students participate actively in discussion"
                disabled={!isEditable}
              />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

