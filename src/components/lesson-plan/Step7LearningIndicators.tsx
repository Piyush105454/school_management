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

        .card-note {
          margin: 0 0 14px;
          color: #6f7d89;
          font-size: 13px;
          line-height: 1.45;
        }

        .repeater {
          display: grid;
          gap: 12px;
        }

        .indicator {
          display: grid;
          grid-template-columns: 42px 1fr;
          gap: 10px;
          align-items: start;
        }

        .indicator-num {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #edf4f8;
          color: #17324d;
          display: grid;
          place-items: center;
          font-weight: 900;
          border: 1px solid #d7e2ea;
        }

        .field {
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

        input {
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
          line-height: 1.7;
        }

        input:focus {
          border-color: #5c8cac;
          box-shadow: 0 0 0 4px rgba(56, 111, 151, 0.11);
        }

        input::placeholder {
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
