"use client";

import { useState, useEffect } from "react";
import { useInstitute } from "@/providers/InstituteProvider";
import { useSession } from "next-auth/react";

interface Step1LessonDetailsProps {
  formData: {
    className?: string;
    subject?: string;
    chapterId?: number | string;
    chapterNo?: string;
    chapterName?: string;
    chapterDivisionId?: string | number;
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

const DEFAULT_CLASSES = ["Nursery", "KG 1", "KG 2", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8"];
const DEFAULT_SUBJECTS = ["English", "Hindi", "Mathematics", "Environmental Studies", "Science", "Social Science", "Computer", "General Knowledge", "Moral Science", "Other"];

export default function Step1LessonDetails({
  formData,
  setFormData,
  isEditable = true,
}: Step1LessonDetailsProps) {
  const { dbClasses } = useInstitute();
  const { data: session } = useSession();
  const [classList, setClassList] = useState<string[]>(DEFAULT_CLASSES);
  const [subjectList, setSubjectList] = useState<string[]>(DEFAULT_SUBJECTS);
  const [chapterList, setChapterList] = useState<any[]>([]);
  const [divisionList, setDivisionList] = useState<any[]>([]);

  // Set current preparation date immediately on mount (don't wait for session)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    
    setFormData((prev: any) => {
      if (prev.prepDate) return prev; // Already set, don't override
      
      const updates: any = {
        prepDate: today,
      };

      // Parse pages string if present (from URL parameters)
      if (prev.pages && typeof prev.pages === 'string' && !prev.pageFrom) {
        const [pageFrom, pageTo] = prev.pages.split("-");
        updates.pageFrom = pageFrom;
        updates.pageTo = pageTo;
      }
      
      return { ...prev, ...updates };
    });
  }, [setFormData]);

  // Set teacher name from session separately
  useEffect(() => {
    if (!session?.user) return;
    
    // Get teacher name from session - use email as fallback
    let name = session.user.name || session.user.email || "";
    
    if (name && name.includes("@")) {
      // If we only have email, use first part
      name = name.split("@")[0];
    }
    
    if (name) {
      setFormData((prev: any) => {
        if (prev.preparedBy) return prev; // Already set, don't override
        return { ...prev, preparedBy: name };
      });
    }
  }, [session, setFormData]);

  // Load classes on mount
  useEffect(() => {
    if (dbClasses && dbClasses.length > 0) {
      setClassList(dbClasses);
    } else {
      fetch("/api/classes")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const names = Array.from(
              new Set(data.map((c: any) => (typeof c === "string" ? c : c.name)).filter(Boolean))
            ) as string[];
            setClassList(names);
          } else {
            setClassList(DEFAULT_CLASSES);
          }
        })
        .catch(() => setClassList(DEFAULT_CLASSES));
    }
  }, [dbClasses]);

  // Load subjects based on selected class - now using consolidated API
  useEffect(() => {
    if (!formData.className) {
      setSubjectList(DEFAULT_SUBJECTS);
      return;
    }

    // Fetch subjects for the selected class
    fetch(`/api/classes/subjects?className=${encodeURIComponent(formData.className)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.subjects && Array.isArray(data.subjects) && data.subjects.length > 0) {
          const subjectNames = data.subjects.map((s: any) => (typeof s === "string" ? s : s.name)).filter(Boolean);
          const merged = Array.from(new Set([...subjectNames, ...DEFAULT_SUBJECTS]));
          setSubjectList(merged);
        } else {
          setSubjectList(DEFAULT_SUBJECTS);
        }
      })
      .catch(() => {
        fetch("/api/form-options?type=subjects")
          .then((res) => res.json())
          .then((data) => {
            if (data.subjects && Array.isArray(data.subjects) && data.subjects.length > 0) {
              const merged = Array.from(new Set([...data.subjects, ...DEFAULT_SUBJECTS]));
              setSubjectList(merged);
            } else {
              setSubjectList(DEFAULT_SUBJECTS);
            }
          })
          .catch(() => setSubjectList(DEFAULT_SUBJECTS));
      });

    // Fetch approver for this class using consolidated endpoint
    fetch(`/api/lesson-plan/form-data?className=${encodeURIComponent(formData.className)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.approverName && data.approverName !== "NA") {
          setFormData((prev: any) => ({
            ...prev,
            approverName: data.approverName,
          }));
        }
      })
      .catch(() => {
        console.warn("Failed to fetch approver name");
      });
  }, [formData.className]);

  // Load subject details including reviewers and chapters - using consolidated API
  useEffect(() => {
    if (!formData.subject || !formData.className) {
      setChapterList([]);
      setDivisionList([]);
      return;
    }

    // Fetch all data (reviewers and chapters) using consolidated endpoint
    const url = `/api/lesson-plan/form-data?className=${encodeURIComponent(formData.className)}&subjectName=${encodeURIComponent(formData.subject)}`;
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.warn("API error:", data.error);
          setChapterList([]);
          setDivisionList([]);
          return;
        }

        // Set reviewer names
        if (data.reviewer1Name || data.reviewer2Name) {
          const reviewers = [];
          if (data.reviewer1Name && data.reviewer1Name !== "NA") reviewers.push(data.reviewer1Name);
          if (data.reviewer2Name && data.reviewer2Name !== "NA") reviewers.push(data.reviewer2Name);
          const reviewerDisplay = reviewers.length > 0 ? reviewers.join(" | ") : "NA";
          setFormData((prev: any) => ({
            ...prev,
            reviewerName: reviewerDisplay,
          }));
        }

        // Load chapters
        if (data.chapters && Array.isArray(data.chapters)) {
          setChapterList(data.chapters);
          
          // Auto-select chapter if chapterId was passed as URL param
          if (formData.chapterId && !formData.chapterNo) {
            const selectedChapter = data.chapters.find((ch: any) => ch.id === parseInt(String(formData.chapterId), 10));
            if (selectedChapter) {
              setFormData((prev: any) => ({
                ...prev,
                chapterNo: selectedChapter.chapterNo,
                chapterName: selectedChapter.name || "",
              }));
            }
          }
        } else {
          setChapterList([]);
          setDivisionList([]);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch subject details:", error);
        setChapterList([]);
        setDivisionList([]);
      });
  }, [formData.subject, formData.className, setFormData]);

  // Update chapter details and load divisions when chapter number is selected
  useEffect(() => {
    if (!formData.chapterNo) {
      setDivisionList([]);
      return;
    }

    if (chapterList.length === 0) {
      setDivisionList([]);
      return;
    }

    // Find the selected chapter
    const selectedChapter = chapterList.find((ch: any) => String(ch.chapterNo) === String(formData.chapterNo));
    
    if (selectedChapter) {
      // Set chapter details
      setFormData((prev: any) => {
        const updates: any = {
          chapterName: selectedChapter.name || "",
        };
        
        // Only set page ranges if they're not already set (0 or empty)
        const hasValidPageRanges = prev.pageFrom && prev.pageTo && 
                                    parseInt(prev.pageFrom) > 0 && parseInt(prev.pageTo) > 0;
        
        if (!hasValidPageRanges) {
          // Load divisions for this chapter
          if (selectedChapter.divisions && selectedChapter.divisions.length > 0) {
            setDivisionList(selectedChapter.divisions);
            
            // If we have a chapterDivisionId from URL, use it
            if (prev.chapterDivisionId) {
              const selectedDivision = selectedChapter.divisions.find(
                (div: any) => String(div.id) === String(prev.chapterDivisionId)
              );
              if (selectedDivision) {
                updates.pageFrom = selectedDivision.pageStart?.toString() || "";
                updates.pageTo = selectedDivision.pageEnd?.toString() || "";
              }
            } else {
              // Auto-select first division
              const firstDivision = selectedChapter.divisions[0];
              updates.chapterDivisionId = firstDivision.id;
              updates.pageFrom = firstDivision.pageStart?.toString() || "";
              updates.pageTo = firstDivision.pageEnd?.toString() || "";
            }
          } else {
            // No divisions, use chapter page range
            setDivisionList([]);
            updates.pageFrom = selectedChapter.pageStart?.toString() || "";
            updates.pageTo = selectedChapter.pageEnd?.toString() || "";
          }
        } else {
          // Page ranges already set, just load divisions for dropdown
          if (selectedChapter.divisions && selectedChapter.divisions.length > 0) {
            setDivisionList(selectedChapter.divisions);
          }
        }
        
        return { ...prev, ...updates };
      });
    }
  }, [formData.chapterNo, chapterList, setFormData]);

  // Update page ranges when division is manually selected (not during initial load)
  useEffect(() => {
    if (!formData.chapterDivisionId || divisionList.length === 0) {
      return;
    }

    const selectedDivision = divisionList.find((div: any) => String(div.id) === String(formData.chapterDivisionId));
    
    if (selectedDivision && (formData.pageFrom === "0" || formData.pageFrom === "" || parseInt(formData.pageFrom || "0") === 0)) {
      // Only update if page ranges are not already set
      setFormData((prev: any) => ({
        ...prev,
        pageFrom: selectedDivision.pageStart?.toString() || "",
        pageTo: selectedDivision.pageEnd?.toString() || "",
      }));
    }
  }, [formData.chapterDivisionId, divisionList, setFormData]);

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
                {classList.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
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
                {subjectList.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="field col-3">
              <label className="required" htmlFor="chapterNo">
                Chapter Number
              </label>
              <select
                id="chapterNo"
                name="chapterNo"
                value={formData.chapterNo || ""}
                onChange={(e) => handleChange("chapterNo", e.target.value)}
                disabled={!isEditable || chapterList.length === 0}
                required
              >
                <option value="">
                  {chapterList.length === 0
                    ? formData.subject
                      ? "Loading chapters..."
                      : "Select subject first"
                    : "Select chapter"}
                </option>
                {chapterList.map((ch) => (
                  <option key={ch.id} value={ch.chapterNo}>
                    Chapter {ch.chapterNo}: {ch.name}
                  </option>
                ))}
              </select>
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
                placeholder="Chapter name will auto-fill"
                disabled={!!formData.chapterName}
                required
              />
            </div>

            {divisionList.length > 0 && (
              <div className="field col-3">
                <label className="required" htmlFor="chapterDivision">
                  Page Division
                </label>
                <select
                  id="chapterDivision"
                  name="chapterDivision"
                  value={formData.chapterDivisionId || ""}
                  onChange={(e) => handleChange("chapterDivisionId", e.target.value)}
                  disabled={!isEditable || divisionList.length === 0}
                  required
                >
                  <option value="">Select division</option>
                  {divisionList.map((div) => (
                    <option key={div.id} value={div.id}>
                      Pages {div.pageStart}-{div.pageEnd}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (parseInt(val) > 0)) {
                    handleChange("pageFrom", val);
                  }
                }}
                placeholder={formData.chapterDivisionId ? "Auto-filled from division" : "Enter page number"}
                disabled={!!formData.chapterDivisionId}
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
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (parseInt(val) > 0)) {
                    handleChange("pageTo", val);
                  }
                }}
                placeholder={formData.chapterDivisionId ? "Auto-filled from division" : "Enter page number"}
                disabled={!!formData.chapterDivisionId}
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
                onChange={(e) => {}}
                disabled={true}
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
                placeholder="Teacher name"
                disabled={true}
                required
              />
            </div>

            <div className="field col-4">
              <label htmlFor="reviewerName">Reviewer</label>
              <input
                id="reviewerName"
                name="reviewerName"
                value={formData.reviewerName || ""}
                onChange={(e) => {}}
                placeholder="Reviewer name"
                disabled={true}
              />
            </div>

            <div className="field col-4">
              <label htmlFor="approverName">Approver</label>
              <input
                id="approverName"
                name="approverName"
                value={formData.approverName || ""}
                onChange={(e) => {}}
                placeholder="Approver name"
                disabled={true}
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
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
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
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
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
