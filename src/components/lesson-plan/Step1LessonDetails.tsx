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

  // Set current preparation date & teacher name immediately on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    let name = session?.user?.name || session?.user?.email || "";
    if (name && name.includes("@")) {
      name = name.split("@")[0];
    }
    
    setFormData((prev: any) => {
      const updates: any = {};
      if (!prev.prepDate) updates.prepDate = today;
      if (!prev.preparedBy && name) updates.preparedBy = name;
      
      if (prev.pages && typeof prev.pages === "string" && !prev.pageFrom) {
        const [pageFrom, pageTo] = prev.pages.split("-");
        updates.pageFrom = pageFrom;
        updates.pageTo = pageTo;
      }
      
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
  }, [session, setFormData]);

  // Load class options on mount
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

  // Fast consolidated load of subjects, approvers, reviewers and chapters
  useEffect(() => {
    if (!formData.className) {
      setSubjectList(DEFAULT_SUBJECTS);
      setChapterList([]);
      setDivisionList([]);
      return;
    }

    const url = `/api/lesson-plan/form-data?className=${encodeURIComponent(formData.className)}${formData.subject ? `&subjectName=${encodeURIComponent(formData.subject)}` : ""}`;
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.subjects && Array.isArray(data.subjects) && data.subjects.length > 0) {
          const merged = Array.from(new Set([...data.subjects, ...DEFAULT_SUBJECTS]));
          setSubjectList(merged);
        } else {
          setSubjectList(DEFAULT_SUBJECTS);
        }

        if (data.approverName && data.approverName !== "NA") {
          setFormData((prev: any) => ({
            ...prev,
            approverName: data.approverName,
          }));
        }

        if (formData.subject) {
          const reviewers = [];
          if (data.reviewer1Name && data.reviewer1Name !== "NA") reviewers.push(data.reviewer1Name);
          if (data.reviewer2Name && data.reviewer2Name !== "NA") reviewers.push(data.reviewer2Name);
          const reviewerDisplay = reviewers.length > 0 ? reviewers.join(" | ") : "NA";
          
          setFormData((prev: any) => ({
            ...prev,
            reviewerName: reviewerDisplay,
          }));

          if (data.chapters && Array.isArray(data.chapters)) {
            setChapterList(data.chapters);
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
        } else {
          setChapterList([]);
          setDivisionList([]);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch lesson plan form data:", error);
      });
  }, [formData.className, formData.subject]);

  // Update chapter details and load divisions when chapter number is selected
  useEffect(() => {
    if (!formData.chapterNo || chapterList.length === 0) {
      setDivisionList([]);
      return;
    }

    // Find the selected chapter
    const selectedChapter = chapterList.find((ch: any) => String(ch.chapterNo) === String(formData.chapterNo));
    
    if (selectedChapter) {
      const divs = selectedChapter.divisions || [];
      // Set local division list FIRST outside setFormData
      setDivisionList(divs);

      // Now set parent form data without calling local setStates inside functional updater
      setFormData((prev: any) => {
        const updates: any = {
          chapterName: selectedChapter.name || "",
        };
        
        const hasValidPageRanges = prev.pageFrom && prev.pageTo && 
                                    parseInt(prev.pageFrom) > 0 && parseInt(prev.pageTo) > 0;
        
        if (!hasValidPageRanges) {
          if (divs.length > 0) {
            const selectedDivision = prev.chapterDivisionId 
              ? divs.find((div: any) => String(div.id) === String(prev.chapterDivisionId)) 
              : divs[0];
            const targetDiv = selectedDivision || divs[0];
            updates.chapterDivisionId = targetDiv.id;
            updates.pageFrom = targetDiv.pageStart?.toString() || "";
            updates.pageTo = targetDiv.pageEnd?.toString() || "";
          } else {
            updates.pageFrom = selectedChapter.pageStart?.toString() || "";
            updates.pageTo = selectedChapter.pageEnd?.toString() || "";
          }
        }
        
        return { ...prev, ...updates };
      });
    }
  }, [formData.chapterNo, chapterList, setFormData]);

  // Update page ranges when division is manually selected
  useEffect(() => {
    if (!formData.chapterDivisionId || divisionList.length === 0) {
      return;
    }

    const selectedDivision = divisionList.find((div: any) => String(div.id) === String(formData.chapterDivisionId));
    
    if (selectedDivision && (formData.pageFrom === "0" || formData.pageFrom === "" || parseInt(formData.pageFrom || "0") === 0)) {
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
            <path d="m43 48 8-8 5 5-8 8-7 2 2-7Z" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2" />
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
    </section>
  );
}

