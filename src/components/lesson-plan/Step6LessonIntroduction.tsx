"use client";

import React from "react";

interface Step6LessonIntroductionProps {
  formData: {
    lessonHook?: string;
    introConnection?: string;
  };
  setFormData: (data: any) => void;
  isEditable?: boolean;
}

export default function Step6LessonIntroduction({
  formData,
  setFormData,
  isEditable = true,
}: Step6LessonIntroductionProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <section className="step-page active" data-step="5">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 6 Â· Lesson Introduction</div>
          <h2>Prepare a clear introduction that brings students into the topic.</h2>
          <p>Use a familiar question, situation, object, image, previous lesson or short story.</p>
        </div>
        <div className="hero-art">ðŸ’¡</div>
      </div>

      <div className="connection">
        <div>ðŸ’¡</div>
        <div>
          <strong>Connect before you instruct.</strong>
          <p>
            A short, interesting hook brings student attention into the classroom before you open
            the textbook.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="field">
          <label className="required" htmlFor="lessonHook">
            Lesson introduction / hook
          </label>
          <textarea
            id="lessonHook"
            name="lessonHook"
            value={formData.lessonHook || ""}
            onChange={(e) => handleChange("lessonHook", e.target.value)}
            placeholder="Write how you will start the lesson in 1â€“2 minutes: a question, a short story, a real example or an object."
            disabled={!isEditable}
            rows={5}
            required
          />
        </div>

        <div className="field" style={{ marginTop: "20px" }}>
          <label htmlFor="introConnection">Connection to prior learning</label>
          <textarea
            id="introConnection"
            name="introConnection"
            value={formData.introConnection || ""}
            onChange={(e) => handleChange("introConnection", e.target.value)}
            placeholder="Example: yesterday we learnt addition; today we will see what happens when we add the same number again and again."
            disabled={!isEditable}
            rows={4}
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
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          font-size: clamp(24px, 3vw, 36px);
          line-height: 1.1;
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
          padding: 20px;
          box-shadow: 0 6px 18px rgba(31, 47, 61, 0.04);
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        label {
          font-size: 15px;
          font-weight: 800;
          color: #2f4658;
          margin-bottom: 9px;
        }

        .required::after {
          content: " *";
          color: #b95a50;
        }

        textarea {
          width: 100%;
          border: 1px solid #cfd9e1;
          border-radius: 12px;
          background: #fff;
          color: #203040;
          padding: 14px 16px;
          outline: none;
          transition: 0.18s ease;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          font-size: 18px;
          font-weight: 500;
          line-height: 1.6;
          resize: vertical;
        }

        textarea:focus {
          border-color: #5c8cac;
          box-shadow: 0 0 0 4px rgba(56, 111, 151, 0.11);
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
