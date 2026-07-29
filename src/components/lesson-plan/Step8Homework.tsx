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
          <div className="eyebrow">Step 8 Â· Homework</div>
          <h2>Does this lesson need practice at home?</h2>
          <p>
            Homework is optional. Give it only when it strengthens learning and can be clearly
            understood by students and parents.
          </p>
        </div>
        <div className="hero-art">ðŸ </div>
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

    </section>
  );
}

