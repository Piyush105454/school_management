"use client";

import React from "react";

interface Step9EnergizerProps {
  formData: {
    energizer?: string;
    energizerPractised?: boolean;
  };
  setFormData: (data: any) => void;
  isEditable?: boolean;
}

const ENERGIZER_ACTIVITIES = [
  {
    name: "Follow My Taali (Sitting)",
    desc: "Teacher performs 4–5 simple clap patterns. Students observe and repeat together. End with one final class clap.",
  },
  {
    name: "Aam–Kela–Papita Rhythm (Sitting)",
    desc: "Aam = 1 clap, Kela = 2 claps, Papita = clap–lap–clap. Teacher calls a fruit and students perform the beat.",
  },
  {
    name: "Count and Clap (Sitting)",
    desc: "Teacher says or shows a number from 1–5. Students clap exactly that many times.",
  },
  {
    name: "Clap–Lap–Snap (Sitting)",
    desc: "Students repeat clap hands, tap thighs, snap or rub fingers. Start slowly and increase speed slightly.",
  },
  {
    name: "Finger Spider Walk (Sitting)",
    desc: "Touch each finger to the thumb, then make fingers walk upward and downward in the air.",
  },
  {
    name: "Finger Copy Challenge (Sitting)",
    desc: "Teacher shows quick hand positions. Students copy, ending with different positions on each hand.",
  },
  {
    name: "Up–Down–Left–Right Hands (Sitting)",
    desc: "Teacher calls hand directions while students keep elbows close to the body and follow quickly.",
  },
  {
    name: "Machhli Jal Ki Rani – Hand Actions (Sitting)",
    desc: "Students use small fish-like hand actions while reciting one short verse.",
  },
  {
    name: "Aloo Kachaloo – Expression Actions (Sitting)",
    desc: "Students recite a short part with small expression and hand actions.",
  },
  {
    name: "Lakdi Ki Kathi – Horse Beat (Sitting)",
    desc: "Students tap alternate hands softly on their thighs like a horse beat.",
  },
  {
    name: "Teacher Says – Shikshak Kehte Hain (Standing at place)",
    desc: "Students act only when the instruction begins with 'Teacher says'.",
  },
  {
    name: "Opposite Action Challenge (Standing at place)",
    desc: "Teacher says up, left or open; students perform the safe opposite action.",
  },
  {
    name: "Red Light–Green Light at Place (Standing at place)",
    desc: "Green = gentle march at place, yellow = slow, red = freeze. No forward movement.",
  },
  {
    name: "Move and Freeze (Standing at place)",
    desc: "Students move only hands, shoulders and head, then freeze immediately on the signal.",
  },
  {
    name: "Cross-Touch Brain Gym (Standing at place)",
    desc: "Students touch opposite shoulder and opposite knee without stepping away from the bench.",
  },
];

export default function Step9Energizer({
  formData,
  setFormData,
  isEditable = true,
}: Step9EnergizerProps) {
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const selectedActivity = ENERGIZER_ACTIVITIES.find((a) => a.name === formData.energizer);

  return (
    <section className="step-page active" data-step="8">
      <div className="hero">
        <div>
          <div className="eyebrow">Step 9 · Energizer</div>
          <h2>Plan a one-minute classroom energizer.</h2>
          <p>
            Choose a simple, inclusive activity that helps students stay alert without leaving
            their seats or causing distraction.
          </p>
        </div>
        <div className="hero-art">⚡</div>
      </div>

      <div className="connection">
        <div>✧</div>
        <div>
          <strong>Short, simple and easy to lead.</strong>
          <p>
            Select an activity you can confidently demonstrate. Practice it once before the actual
            class.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="field">
          <label className="required" htmlFor="energizer">
            Energizer Activity
          </label>
          <select
            id="energizer"
            name="energizer"
            value={formData.energizer || ""}
            onChange={(e) => handleChange("energizer", e.target.value)}
            disabled={!isEditable}
            required
          >
            <option value="">Select an energizer activity</option>
            {ENERGIZER_ACTIVITIES.map((activity) => (
              <option key={activity.name} value={activity.name}>
                {activity.name}
              </option>
            ))}
          </select>
        </div>

        {selectedActivity && (
          <div className="activity-preview show">
            <h4>{selectedActivity.name}</h4>
            <p>{selectedActivity.desc}</p>
          </div>
        )}

        {formData.energizer && (
          <div className="field" style={{ marginTop: "16px" }}>
            <label className="inline-check">
              <input
                type="checkbox"
                checked={formData.energizerPractised || false}
                onChange={(e) => handleChange("energizerPractised", e.target.checked)}
                disabled={!isEditable}
              />
              <span>I have practised this energizer once.</span>
            </label>
          </div>
        )}
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

        select:focus {
          border-color: #5c8cac;
          box-shadow: 0 0 0 4px rgba(56, 111, 151, 0.11);
        }

        .activity-preview {
          margin-top: 12px;
          padding: 13px;
          border-radius: 14px;
          background: #eef5f9;
          border: 1px solid #d5e5ef;
        }

        .activity-preview h4 {
          margin: 0 0 5px;
          color: #17324d;
          font-size: 14px;
          font-weight: 800;
        }

        .activity-preview p {
          margin: 0;
          color: #6f7d89;
          font-size: 13px;
          line-height: 1.45;
        }

        .inline-check {
          display: flex;
          gap: 10px;
          align-items: center;
          font-weight: 600;
          color: #17324d;
          cursor: pointer;
        }

        .inline-check input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .inline-check span {
          font-size: 14px;
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
