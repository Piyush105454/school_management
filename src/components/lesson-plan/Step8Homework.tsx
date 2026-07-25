"use client";

import React from "react";

interface Step8HomeworkProps {
  formData: {
    homeworkGiven?: string;
    homeworkTask?: string;
    homeworkDue?: string;
    homeworkInstruction?: string;
  };
  setFormData: (data: any) => void;
  isEditable?: boolean;
}

export default function Step8Homework({
  formData,
  setFormData,
  isEditable = true,
}: Step8HomeworkProps) {
  return (
    <section className="step-page active" data-step="7">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 8 · Homework</div>
          <h2>Does this lesson need practice at home?</h2>
          <p>
            Homework is optional. Give it only when it strengthens learning and can be clearly
            understood by students and parents.
          </p>
        </div>
        <div className="hero-art">🏠</div>
      </div>

      <div className="card">
        <label className="required">Will you give homework?</label>
        <div className="choice-row">
          <label className="choice">
            <input
              type="radio"
              name="homeworkGiven"
              value="Yes"
              checked={formData.homeworkGiven === "Yes"}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  homeworkGiven: e.target.value,
                }))
              }
              disabled={!isEditable}
              required
            />
            <div>
              <strong>Yes</strong>
              <span>I have a clear, useful task for students.</span>
            </div>
          </label>
          <label className="choice">
            <input
              type="radio"
              name="homeworkGiven"
              value="No"
              checked={formData.homeworkGiven === "No"}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  homeworkGiven: e.target.value,
                }))
              }
              disabled={!isEditable}
              required
            />
            <div>
              <strong>No</strong>
              <span>The lesson does not need homework today.</span>
            </div>
          </label>
        </div>
      </div>

      {formData.homeworkGiven === "Yes" && (
        <div className="grid" style={{ marginTop: "16px" }}>
          <div className="card col-8">
            <div className="field">
              <label className="required" htmlFor="homeworkTask">
                Homework task
              </label>
              <textarea
                id="homeworkTask"
                name="homeworkTask"
                value={formData.homeworkTask || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    homeworkTask: e.target.value,
                  }))
                }
                placeholder="Write exactly what students must do at home."
                disabled={!isEditable}
              />
            </div>
          </div>
          <div className="card col-4">
            <div className="field">
              <label htmlFor="homeworkDue">Submission date</label>
              <input
                id="homeworkDue"
                name="homeworkDue"
                type="date"
                value={formData.homeworkDue || ""}

                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    homeworkDue: e.target.value,
                  }))
                }
                disabled={!isEditable}
              />
            </div>
            <div className="field">
              <label htmlFor="homeworkInstruction">Special instruction</label>
              <textarea
                id="homeworkInstruction"
                name="homeworkInstruction"
                value={formData.homeworkInstruction || ""}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    homeworkInstruction: e.target.value,
                  }))
                }
                placeholder="Example: complete independently; parent signature; bring one local example."
                disabled={!isEditable}
              />
            </div>
          </div>
        </div>
      )}

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
          display: inline-flex;
          align-items: center;
          gap: 8px;
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
          max-width: 780px;
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
          border: 1px solid #ead9ad;
          color: #c99a34;
          font-size: 48px;
        }

        .card {
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid #d7d2c6;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 6px 18px rgba(31, 47, 61, 0.04);
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

        .choice-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .choice {
          position: relative;
          flex: 1 1 180px;
          border: 1px solid #d3dce3;
          background: #fff;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          gap: 11px;
          align-items: flex-start;
          transition: 0.18s ease;
          cursor: pointer;
        }

        .choice:hover {
          border-color: #83a8c2;
          transform: translateY(-1px);
        }

        .choice input {
          width: auto;
          margin-top: 3px;
          cursor: pointer;
        }

        .choice:has(input:checked) {
          border-color: #2f7d62;
          background: #e8f3ee;
        }

        .choice strong {
          display: block;
          color: #17324d;
          font-size: 14px;
        }

        .choice span {
          display: block;
          color: #6f7d89;
          font-size: 12px;
          line-height: 1.35;
          margin-top: 3px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
        }

        .col-8 {
          grid-column: span 8;
        }

        .col-4 {
          grid-column: span 4;
        }

        .field {
          margin-bottom: 16px;
        }

        .field:last-child {
          margin-bottom: 0;
        }

        input,
        textarea {
          width: 100%;
          border: 1px solid #cfd9e1;
          border-radius: 12px;
          background: #fff;
          color: #203040;
          padding: 14px 16px;
          outline: none;
          transition: 0.18s ease;
          font-family: "Kalam", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive;
          font-size: 20px;
          font-weight: 500;
          line-height: 1.7;
          letter-spacing: 0.01em;
        }

        input[type="date"] {
          min-height: 52px;
        }

        textarea {
          min-height: 150px;
          resize: vertical;
        }

        input:focus,
        textarea:focus {
          border-color: #5c8cac;
          box-shadow: 0 0 0 4px rgba(56, 111, 151, 0.11);
        }

        input::placeholder,
        textarea::placeholder {
          color: #8a9299;
          opacity: 0.86;
        }

        @media (max-width: 980px) {
          .hero-art {
            display: none;
          }
          .col-8,
          .col-4 {
            grid-column: span 12;
          }
        }
      `}</style>
    </section>
  );
}
