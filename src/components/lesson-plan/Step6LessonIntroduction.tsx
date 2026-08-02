"use client";

import React from "react";
import RichTextEditor from "@/components/common/RichTextEditor";

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
          <div className="eyebrow">Step 6 · Lesson Introduction</div>
          <h2>Prepare a clear introduction that brings students into the topic.</h2>
          <p>Use a familiar question, situation, object, image, previous lesson or short story.</p>
        </div>
        <div className="hero-art">🚀</div>
      </div>

      <div className="connection">
        <div>✦</div>
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
          <RichTextEditor
            id="lessonHook"
            value={formData.lessonHook || ""}
            onChange={(val) => handleChange("lessonHook", val)}
            placeholder="Write how you will start the lesson in 1–2 minutes: a question, a short story, a real example or an object."
            disabled={!isEditable}
            minHeight="140px"
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

    </section>
  );
}

