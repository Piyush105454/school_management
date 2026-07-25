"use client";

import React from "react";

interface Step1LessonDetailsProps {
  formData: {
    className?: string;
    subject?: string;
    chapterNo?: string;
    chapterName?: string;
    pageFrom?: string;
    pageTo?: string;
    prepDate?: string;
    deliveryDate?: string;
    preparedBy?: string;
    reviewerName?: string;
    approverName?: string;
    lessonType?: string;
  };
  setFormData: (data: any) => void;
  isEditable?: boolean;
}

export default function Step1LessonDetails({
  formData,
  setFormData,
  isEditable = true,
}: Step1LessonDetailsProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <section className="step-page active" data-step="0">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 1 · Lesson Details</div>
          <h2>Begin with the lesson you are actually going to teach.</h2>
          <p>
            Select the class, subject, chapter and exact page range first. Choose the lesson type
            after completing the remaining lesson details.
          </p>
        </div>
        <div className="hero-art">
          <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
            <rect x="10" y="8" width="38" height="48" rx="6" fill="#FFF" stroke="currentColor" strokeWidth="3" />
            <path d="M20 21h19M20 30h19M20 39h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="m43 48 8-8 5 5-8 8-7 2 2-7Z" fill="#E8F3EE" stroke="#2F7D62" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <div className="connection">
        <div>✦</div>
        <div>
          <strong>Your planning starts from the textbook, not from the blank form.</strong>
          <p>Keep the textbook open so the chapter name and page range remain accurate.</p>
        </div>
      </div>

      <div className="grid">
        <div className="card col-12">
          <div className="grid">
            <div className="field col-3">
              <label className="required" htmlFor="className">
                Class
              </label>
              <select
                id="className"
                name="className"
                value={formData.className || ""}
                onChange={(e) => handleChange("className", e.target.value)}
                disabled={!isEditable}
                required
              >
                <option value="">Select class</option>
                <option>Nursery</option>
                <option>KG 1</option>
                <option>KG 2</option>
                <option>Class 1</option>
                <option>Class 2</option>
                <option>Class 3</option>
                <option>Class 4</option>
                <option>Class 5</option>
                <option>Class 6</option>
                <option>Class 7</option>
                <option>Class 8</option>
              </select>
            </div>

            <div className="field col-3">
              <label className="required" htmlFor="subject">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject || ""}
                onChange={(e) => handleChange("subject", e.target.value)}
                disabled={!isEditable}
                required
              >
                <option value="">Select subject</option>
                <option>English</option>
                <option>Hindi</option>
                <option>Mathematics</option>
                <option>Environmental Studies</option>
                <option>Science</option>
                <option>Social Science</option>
                <option>Computer</option>
                <option>General Knowledge</option>
                <option>Moral Science</option>
                <option>Other</option>
              </select>
            </div>

            <div className="field col-3">
              <label className="required" htmlFor="chapterNo">
                Chapter Number
              </label>
              <input
                id="chapterNo"
                name="chapterNo"
                value={formData.chapterNo || ""}
                onChange={(e) => handleChange("chapterNo", e.target.value)}
                placeholder="Example: 5"
                disabled={!isEditable}
                required
              />
            </div>

            <div className="field col-3">
              <label className="required" htmlFor="chapterName">
                Chapter Name
              </label>
              <input
                id="chapterName"
                name="chapterName"
                value={formData.chapterName || ""}
                onChange={(e) => handleChange("chapterName", e.target.value)}
                placeholder="Write the exact chapter name"
                disabled={!isEditable}
                required
              />
            </div>

            <div className="field col-3">
              <label className="required" htmlFor="pageFrom">
                Page From
              </label>
              <input
                id="pageFrom"
                name="pageFrom"
                type="number"
                min="1"
                value={formData.pageFrom || ""}
                onChange={(e) => handleChange("pageFrom", e.target.value)}
                placeholder="12"
                disabled={!isEditable}
                required
              />
            </div>

            <div className="field col-3">
              <label className="required" htmlFor="pageTo">
                Page To
              </label>
              <input
                id="pageTo"
                name="pageTo"
                type="number"
                min="1"
                value={formData.pageTo || ""}
                onChange={(e) => handleChange("pageTo", e.target.value)}
                placeholder="15"
                disabled={!isEditable}
                required
              />
            </div>

            <div className="field col-3">
              <label className="required" htmlFor="prepDate">
                Preparation Date
              </label>
              <input
                id="prepDate"
                name="prepDate"
                type="date"
                value={formData.prepDate || ""}
                onChange={(e) => handleChange("prepDate", e.target.value)}
                disabled={!isEditable}
                required
              />
            </div>

            <div className="field col-3">
              <label className="required" htmlFor="deliveryDate">
                Delivery Date
              </label>
              <input
                id="deliveryDate"
                name="deliveryDate"
                type="date"
                value={formData.deliveryDate || ""}
                onChange={(e) => handleChange("deliveryDate", e.target.value)}
                disabled={!isEditable}
                required
              />
            </div>

            <div className="field col-4">
              <label className="required" htmlFor="preparedBy">
                Prepared By
              </label>
              <input
                id="preparedBy"
                name="preparedBy"
                value={formData.preparedBy || ""}
                onChange={(e) => handleChange("preparedBy", e.target.value)}
                placeholder="Teacher name"
                disabled={!isEditable}
                required
              />
            </div>

            <div className="field col-4">
              <label htmlFor="reviewerName">Reviewer</label>
              <input
                id="reviewerName"
                name="reviewerName"
                value={formData.reviewerName || ""}
                onChange={(e) => handleChange("reviewerName", e.target.value)}
                placeholder="Reviewer name"
                disabled={!isEditable}
              />
            </div>

            <div className="field col-4">
              <label htmlFor="approverName">Approver</label>
              <input
                id="approverName"
                name="approverName"
                value={formData.approverName || ""}
                onChange={(e) => handleChange("approverName", e.target.value)}
                placeholder="Approver name"
                disabled={!isEditable}
              />
            </div>

            <div className="field col-12">
              <label className="required">Finally, choose the Lesson Plan Type</label>
              <span className="hint" style={{ marginBottom: "10px" }}>
                Your next planning questions will adjust according to this selection.
              </span>
              <div className="choice-row">
                <label className="choice">
                  <input
                    type="radio"
                    name="lessonType"
                    value="Explanation"
                    checked={formData.lessonType === "Explanation"}
                    onChange={(e) => handleChange("lessonType", e.target.value)}
                    disabled={!isEditable}
                    required
                  />
                  <div>
                    <strong>Explanation</strong>
                    <span>
                      Introduce and explain a new concept, followed by discussion and a student
                      activity.
                    </span>
                  </div>
                </label>
                <label className="choice">
                  <input
                    type="radio"
                    name="lessonType"
                    value="Q&A"
                    checked={formData.lessonType === "Q&A"}
                    onChange={(e) => handleChange("lessonType", e.target.value)}
                    disabled={!isEditable}
                    required
                  />
                  <div>
                    <strong>Question & Answer</strong>
                    <span>
                      Discuss, solve and write chapter-based answers with teacher inspection and
                      support.
                    </span>
                  </div>
                </label>
              </div>
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
        }

        .connection {
          display: flex;
          gap: 12px;
          align-items: flex-start;
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

        .grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
        }

        .col-12 {
          grid-column: span 12;
        }
        .col-4 {
          grid-column: span 4;
        }
        .col-3 {
          grid-column: span 3;
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
          line-height: 1.35;
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
        }

        input,
        select {
          font-family: "Kalam", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive;
          font-size: 20px;
          font-weight: 500;
          line-height: 1.7;
          letter-spacing: 0.01em;
        }

        input::placeholder {
          color: #8a9299;
          opacity: 0.86;
        }

        input:focus,
        select:focus {
          border-color: #5c8cac;
          box-shadow: 0 0 0 4px rgba(56, 111, 151, 0.11);
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
          min-height: auto;
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

        @media (max-width: 980px) {
          .hero-art {
            display: none;
          }
          .col-4,
          .col-3 {
            grid-column: span 12;
          }
        }
      `}</style>
    </section>
  );
}
