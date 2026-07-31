"use client";

import React from "react";
import "./Step10ReviewUI.css";

interface LessonPlanData {
  id?: string;
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
  objectiveVerb?: string;
  objectiveText?: string;
  teachingNotes?: string;
  references?: string;
  discussionPlan?: string;
  quieterStudentSupport?: string;
  activityTitle?: string;
  activityMode?: string;
  activitySteps?: string;
  materials?: string;
  teacherRole?: string;
  activitySuccess?: string;
  lessonHook?: string;
  introConnection?: string;
  indicator1?: string;
  indicator2?: string;
  indicator3?: string;
  homeworkGiven?: string;
  homeworkTask?: string;
  homeworkDue?: string;
  homeworkInstruction?: string;
  prevDayHomeworkFeedback?: string;
  energizer?: string;
  energizerPrepared?: boolean;
  rewardType?: string;
  rewardCriteria?: string;
  [key: string]: any;
}

interface Step10ReviewUIProps {
  lessonPlanData: LessonPlanData;
  completionScore: number;
  onMarkReady: () => void;
  onPrint: () => void;
  ownershipConfirmed: boolean;
  setOwnershipConfirmed: (val: boolean) => void;
  submissionNote: string;
  setSubmissionNote: (val: string) => void;
  isReviewerMode?: boolean;
  classListStudents?: { id: number; name: string }[];
  onFinalSignoff?: (postDeliveryData: any) => Promise<void>;
}

export default function Step10ReviewUI({
  lessonPlanData,
  completionScore,
  onMarkReady,
  onPrint,
  ownershipConfirmed,
  setOwnershipConfirmed,
  submissionNote,
  setSubmissionNote,
  isReviewerMode = false,
  classListStudents = [],
  onFinalSignoff,
}: Step10ReviewUIProps) {
  const emDash = "—";
  const bullet = "·";

  const isSubmitted = Boolean(
    lessonPlanData.status && lessonPlanData.status !== "DRAFT"
  );
  const isApprovedOrCompleted =
    lessonPlanData.status === "APPROVED" || lessonPlanData.status === "COMPLETED";
  const isCompleted = lessonPlanData.status === "COMPLETED";

  const todayStr = new Date().toISOString().split("T")[0];
  const deliveryDate = lessonPlanData.deliveryDate || lessonPlanData.date || "";

  let effectiveStatus = lessonPlanData.status || "DRAFT";
  if (deliveryDate && todayStr > deliveryDate) {
    if (effectiveStatus === "SUBMITTED") effectiveStatus = "OVERDUE_REVIEW";
    if (effectiveStatus === "REVIEWED") effectiveStatus = "OVERDUE_APPROVE";
  }

  const renderHtmlContent = (content: string | undefined | null) => {
    if (!content) return emDash;
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return (
        <div
          className="prose prose-sm max-w-none text-slate-800 leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  };

  const [goodStudents, setGoodStudents] = React.useState<string[]>(
    lessonPlanData.goodStudents || []
  );
  const [needsSupportStudents, setNeedsSupportStudents] = React.useState<string[]>(
    lessonPlanData.needsSupportStudents || []
  );
  const [teacherObservation, setTeacherObservation] = React.useState<string>(
    lessonPlanData.teacherObservation || ""
  );

  // ✅ FIX: Re-sync state when lessonPlanData loads async
  // React.useState only initialises once on mount, so if data arrives later it is ignored.
  React.useEffect(() => {
    if (lessonPlanData.goodStudents?.length) setGoodStudents(lessonPlanData.goodStudents);
    if (lessonPlanData.needsSupportStudents?.length) setNeedsSupportStudents(lessonPlanData.needsSupportStudents);
    if (lessonPlanData.teacherObservation) setTeacherObservation(lessonPlanData.teacherObservation);
  }, [lessonPlanData.id]);

  const [confirmStep, setConfirmStep] = React.useState<number>(0);
  const [isSubmittingSignoff, setIsSubmittingSignoff] = React.useState<boolean>(false);
  const [showCelebration, setShowCelebration] = React.useState<boolean>(false);

  const averageStudents = classListStudents.filter(
    (st) => !goodStudents.includes(st.name) && !needsSupportStudents.includes(st.name)
  );
  // Filter lists so selected students don't appear in the other category
  const eligibleForGood = classListStudents.filter((st) => !needsSupportStudents.includes(st.name));
  const eligibleForNeedsSupport = classListStudents.filter((st) => !goodStudents.includes(st.name));

  const toggleStudent = (name: string, category: "GOOD" | "NEEDS_SUPPORT") => {
    if (isCompleted) return;
    if (category === "GOOD") {
      setGoodStudents((prev) =>
        prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
      );
      setNeedsSupportStudents((prev) => prev.filter((n) => n !== name));
    } else {
      setNeedsSupportStudents((prev) =>
        prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
      );
      setGoodStudents((prev) => prev.filter((n) => n !== name));
    }
  };

  const handleSignoffSubmit = async () => {
    if (!onFinalSignoff) return;
    setIsSubmittingSignoff(true);
    try {
      await onFinalSignoff({
        goodStudents,
        needsSupportStudents,
        averageStudents: averageStudents.map((s) => s.name),
        teacherObservation,
        status: "COMPLETED",
      });
      setConfirmStep(0);
      setShowCelebration(true); // Show congrats modal!
    } catch (e: any) {
      alert(`Error completing sign-off: ${e.message || "Unknown error"}`);
    } finally {
      setIsSubmittingSignoff(false);
    }
  };

  return (
    <div className="step-10-review">
      {!isReviewerMode && !isSubmitted && (
        <>
          <div className="hero">
            <div>
              <div className="eyebrow">STEP 10 · REVIEW & SUBMIT</div>
              <h2>Your lesson plan is ready to become a teaching tool.</h2>
              <p>
                Review the plan once as a teacher—not only as a form filler. Check whether you can
                genuinely deliver what is written.
              </p>
            </div>
            <div className="hero-art">📖</div>
          </div>

          <div className="review-banner">
            <div>
              <h3 id="reviewStatusTitle">
                {completionScore >= 100 ? "Ready for your final ownership check" : "Almost ready for review"}
              </h3>
              <p id="reviewStatusText">
                {completionScore >= 100
                  ? "Read the plan once, confirm that you can teach it, and mark it ready for the reviewer."
                  : "Complete the remaining required items before marking this lesson plan ready."}
              </p>
            </div>
            <div className="score">
              <span>{completionScore}%</span>
              <small>complete</small>
            </div>
          </div>

          <div className="review-controls card-soft">
            <div className="grid-layout">
              <div className="col-6">
                <label htmlFor="submissionNote">Note to reviewer</label>
                <textarea
                  id="submissionNote"
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="Optional: mention any special context, material limitation or support needed."
                  className="textarea-field"
                />
              </div>

              <div className="col-6">
                <label className="choice-label">
                  <input
                    type="checkbox"
                    checked={ownershipConfirmed}
                    onChange={(e) => setOwnershipConfirmed(e.target.checked)}
                  />
                  <div>
                    <strong>I can teach this plan as written.</strong>
                    <span>I have read the full plan and made it practical for my classroom.</span>
                  </div>
                </label>

                <div className="review-button-row">
                  <button
                    type="button"
                    onClick={onMarkReady}
                    disabled={!ownershipConfirmed || completionScore < 100}
                    className="btn btn-success"
                  >
                    Mark ready for reviewer
                  </button>
                  <button type="button" onClick={onPrint} className="btn btn-secondary">
                    Print / Save as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="document-paper">
        {/* Status Badge Banner */}
        <div className="status-badge-banner mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Current Status:</span>
            {effectiveStatus === "DRAFT" && (
              <span className="px-3.5 py-1 bg-slate-200/80 text-slate-700 border border-slate-300 rounded-full text-xs font-black uppercase tracking-wider">
                📝 Draft (Saved)
              </span>
            )}
            {effectiveStatus === "SUBMITTED" && (
              <span className="px-3.5 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded-full text-xs font-black uppercase tracking-wider">
                ⏳ Pending Review
              </span>
            )}
            {effectiveStatus === "REVIEWED" && (
              <span className="px-3.5 py-1 bg-indigo-100/80 text-indigo-700 border border-indigo-300 rounded-full text-xs font-black uppercase tracking-wider">
                📋 Reviewed · Pending Principal Approval
              </span>
            )}
            {effectiveStatus === "APPROVED" && (
              <span className="px-3.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-xs font-black uppercase tracking-wider">
                ✅ Approved
              </span>
            )}
            {effectiveStatus === "COMPLETED" && (
              <span className="px-3.5 py-1 bg-pink-100 text-pink-700 border border-pink-300 rounded-full text-xs font-black uppercase tracking-wider">
                🏆 Signed Off
              </span>
            )}
            {effectiveStatus === "REJECTED" && (
              <span className="px-3.5 py-1 bg-rose-100/80 text-rose-700 border border-rose-300 rounded-full text-xs font-black uppercase tracking-wider">
                ❌ Rejected
              </span>
            )}
            {effectiveStatus === "OVERDUE_REVIEW" && (
              <span className="px-3.5 py-1 bg-amber-100 text-amber-900 border border-amber-400 rounded-full text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-xs">
                <span>⚠️</span> Overdue Review (Delivery Date Passed)
              </span>
            )}
            {effectiveStatus === "OVERDUE_APPROVE" && (
              <span className="px-3.5 py-1 bg-rose-100 text-rose-900 border border-rose-400 rounded-full text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-xs">
                <span>⚠️</span> Overdue Approval (Delivery Date Passed)
              </span>
            )}
          </div>
          {deliveryDate && (
            <span className="text-xs font-bold text-slate-500">
              Delivery Date: <strong className="text-slate-900">{deliveryDate}</strong>
            </span>
          )}
        </div>

        <div className="doc-head">
          <h3 className="text-lg font-black text-slate-900 m-0">
            {lessonPlanData.selectedInstitute || "Dhanpuri Public School"}
          </h3>
          <div className="doc-meta">
            Lesson Plan Type: <strong>{lessonPlanData.lessonType || emDash}</strong> {bullet} ID: <strong>{lessonPlanData.id || emDash}</strong>
          </div>
        </div>

        <div className="meta-grid">
          <div className="meta-cell">
            <b>SUBJECT</b>
            <span>{lessonPlanData.subject || emDash}</span>
          </div>
          <div className="meta-cell">
            <b>CLASS</b>
            <span>{lessonPlanData.className || emDash}</span>
          </div>
          <div className="meta-cell">
            <b>CHAPTER</b>
            <span>{lessonPlanData.chapterNo || emDash} {bullet} {lessonPlanData.chapterName || emDash}</span>
          </div>
          <div className="meta-cell">
            <b>PAGES</b>
            <span>{lessonPlanData.pageFrom || emDash} {emDash} {lessonPlanData.pageTo || emDash}</span>
          </div>
        </div>

        <div className="meta-grid">
          <div className="meta-cell">
            <b>PREPARATION DATE</b>
            <span>{lessonPlanData.prepDate || emDash}</span>
          </div>
          <div className="meta-cell">
            <b>DELIVERY DATE</b>
            <span>{lessonPlanData.deliveryDate || emDash}</span>
          </div>
          <div className="meta-cell">
            <b>PREPARED BY</b>
            <span>{lessonPlanData.preparedBy || emDash}</span>
          </div>
          <div className="meta-cell">
            <b>REVIEWER</b>
            <span>{lessonPlanData.reviewerName || emDash}</span>
          </div>
        </div>

        <div className="table-scroll">
          <table className="lesson-table">
            <colgroup>
              <col className="section-col" />
              <col className="time-col" />
              <col className="label-col" />
              <col className="content-col" />
            </colgroup>
            <tbody>
              <tr>
                <th className="section-cell" rowSpan={2}>Opening Time<br/><span>(5 mins)</span></th>
                <td className="time-cell">2 mins</td>
                <th className="label-cell">Energizer Fun Activity</th>
                <td className="content-cell">{renderHtmlContent(lessonPlanData.energizer)}</td>
              </tr>
              <tr>
                <td className="time-cell">3 mins</td>
                <th className="label-cell">Session Roadmap & Objectives</th>
                <td className="content-cell">
                  {lessonPlanData.objectiveVerb && lessonPlanData.objectiveText ? (
                    <>
                      <strong>Objective:</strong> Students will be able to {lessonPlanData.objectiveVerb} {lessonPlanData.objectiveText}
                      <br /><br />
                      <strong>Learning indicators:</strong> {lessonPlanData.indicator1 || ""}{lessonPlanData.indicator2 ? `; ${lessonPlanData.indicator2}` : ""}{lessonPlanData.indicator3 ? `; ${lessonPlanData.indicator3}` : ""}
                      <br /><br />
                      <strong>Class flow:</strong> {lessonPlanData.lessonType === "Q&A" ? "Q&A discussion, answer writing, inspection and support" : "Explanation, discussion, answer writing, inspection and support"}
                      <br /><br />
                      <strong>Reward:</strong> {lessonPlanData.rewardType || "Praise / Appreciation"}
                    </>
                  ) : emDash}
                </td>
              </tr>
              <tr>
                <th className="section-cell" rowSpan={5}>Active Learning<br/><span>(30 mins)</span></th>
                <td className="time-cell">2 mins</td>
                <th className="label-cell">Lesson Introduction</th>
                <td className="content-cell">{renderHtmlContent(lessonPlanData.lessonHook)}</td>
              </tr>
              <tr>
                <td className="time-cell">12 mins</td>
                <th className="label-cell">Teaching Notes</th>
                <td className="content-cell">{renderHtmlContent(lessonPlanData.teachingNotes || lessonPlanData.teacherOwnNotes)}</td>
              </tr>
              <tr>
                <td className="time-cell">8 mins</td>
                <th className="label-cell">{lessonPlanData.lessonType === "Q&A" ? "Inspection & Support" : "Lesson Activity"}</th>
                <td className="content-cell">{renderHtmlContent(lessonPlanData.activityTitle || lessonPlanData.quieterStudentSupport)}</td>
              </tr>
              <tr>
                <td className="time-cell">5 mins</td>
                <th className="label-cell">Knowledge Building · Discussion</th>
                <td className="content-cell">{renderHtmlContent(lessonPlanData.discussionPlan)}</td>
              </tr>
              <tr>
                <td className="time-cell">3 mins</td>
                <th className="label-cell">Learning Outcome & Feedback</th>
                <td className="content-cell">Use this buffer time to assess the learning outcome through short questions, student responses and work checks. Share immediate feedback on performance.</td>
              </tr>
              <tr>
                <th className="section-cell" rowSpan={2}>Closing Time<br/><span>(5 mins)</span></th>
                <td className="time-cell">2 mins</td>
                <th className="label-cell">Lesson Closure, Reward & Recognition</th>
                <td className="content-cell">{renderHtmlContent(lessonPlanData.rewardCriteria)}</td>
              </tr>
              <tr>
                <td className="time-cell">3 mins</td>
                <th className="label-cell">Homework & Feedback</th>
                <td className="content-cell">{renderHtmlContent(lessonPlanData.homeworkTask || "No homework assigned.")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Post-Delivery Learning Record */}
        <div className="post-delivery-record my-6">
          <div className="post-delivery-heading flex justify-between items-center mb-4">
            <div>
              <strong className="text-base font-bold text-slate-800">Post-Delivery Learning Record</strong>
              <p className="text-xs text-slate-500 m-0">
                {isCompleted
                  ? "Final student performance and observations recorded and completed."
                  : isApprovedOrCompleted
                  ? "Record student performance and observations after lesson delivery."
                  : "To be completed during or after lesson delivery once the lesson plan is approved."}
              </p>
            </div>
            {isCompleted ? (
              <span className="unlocked-tag bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3.5 py-1.5 rounded-full text-xs">
                ✓ Post-Delivery Record · Completed & Signed Off
              </span>
            ) : isApprovedOrCompleted ? (
              <span className="unlocked-tag">Post-Delivery Record · Unlocked</span>
            ) : (
              <span className="locked-tag">Planning view · Locked</span>
            )}
          </div>

          <div className="post-delivery-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">

            {/* Card 1: Good — green theme */}
            <div className="delivery-box bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🌟</span>
                <b className="text-sm font-bold text-emerald-800">Good</b>
                {goodStudents.length > 0 && (
                  <span className="ml-auto text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">{goodStudents.length}</span>
                )}
              </div>
              <p className="text-xs text-emerald-700 mb-3 font-medium">Notable performance — select students:</p>
              {isApprovedOrCompleted ? (
                <div className="student-select-box min-h-[120px] bg-white/70 rounded-xl border border-emerald-200 p-2 flex flex-col gap-1">
                  {eligibleForGood.length > 0 ? (
                    eligibleForGood.map((st) => (
                      <label key={st.id} className="flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={goodStudents.includes(st.name)}
                          disabled={isCompleted}
                          onChange={() => !isCompleted && toggleStudent(st.name, "GOOD")}
                          className="accent-emerald-600 rounded disabled:opacity-60 w-4 h-4 shrink-0"
                        />
                        <span className={`text-xs font-semibold ${goodStudents.includes(st.name) ? "text-emerald-800" : "text-slate-600"}`}>{st.name}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 p-2 italic">No students available.</div>
                  )}
                </div>
              ) : (
                <div className="future-field bg-emerald-100/50 text-emerald-700 border border-emerald-200">Student names will load when plan is approved.</div>
              )}
            </div>

            {/* Card 2: Needs Support — red theme */}
            <div className="delivery-box bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🆘</span>
                <b className="text-sm font-bold text-rose-800">Needs Support</b>
                {needsSupportStudents.length > 0 && (
                  <span className="ml-auto text-xs font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">{needsSupportStudents.length}</span>
                )}
              </div>
              <p className="text-xs text-rose-700 mb-3 font-medium">Requires further support — select students:</p>
              {isApprovedOrCompleted ? (
                <div className="student-select-box min-h-[120px] bg-white/70 rounded-xl border border-rose-200 p-2 flex flex-col gap-1">
                  {eligibleForNeedsSupport.length > 0 ? (
                    eligibleForNeedsSupport.map((st) => (
                      <label key={st.id} className="flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer hover:bg-rose-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={needsSupportStudents.includes(st.name)}
                          disabled={isCompleted}
                          onChange={() => !isCompleted && toggleStudent(st.name, "NEEDS_SUPPORT")}
                          className="accent-rose-600 rounded disabled:opacity-60 w-4 h-4 shrink-0"
                        />
                        <span className={`text-xs font-semibold ${needsSupportStudents.includes(st.name) ? "text-rose-800" : "text-slate-600"}`}>{st.name}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 p-2 italic">No students available.</div>
                  )}
                </div>
              ) : (
                <div className="future-field bg-rose-100/50 text-rose-700 border border-rose-200">Student names will load when plan is approved.</div>
              )}
            </div>

            {/* Card 3: Average — amber/yellow theme, auto */}
            <div className="delivery-box bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📊</span>
                <b className="text-sm font-bold text-amber-800">Average</b>
                <span className="ml-auto text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">{averageStudents.length}</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded">Auto</span>
              </div>
              <p className="text-xs text-amber-700 mb-3 font-medium">All remaining students (not in Good or Needs Support):</p>
              {isApprovedOrCompleted ? (
                <div className="avg-chip-container min-h-[120px] bg-white/70 rounded-xl border border-amber-200 p-2 flex flex-wrap content-start gap-1.5">
                  {averageStudents.length > 0 ? (
                    averageStudents.map((st) => (
                      <span key={st.id} className="inline-flex items-center text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full">
                        {st.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic p-1">All students categorised</span>
                  )}
                </div>
              ) : (
                <div className="future-field bg-amber-100/50 text-amber-700 border border-amber-200">Auto-filled based on selected categories.</div>
              )}
            </div>

            {/* Card 4: Teacher Observation — blue theme */}
            <div className="delivery-box bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📝</span>
                <b className="text-sm font-bold text-blue-800">Teacher Observation</b>
                {!teacherObservation && isApprovedOrCompleted && !isCompleted && (
                  <span className="ml-auto text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">Required</span>
                )}
              </div>
              <p className="text-xs text-blue-700 mb-3 font-medium">
                {isCompleted ? "Final classroom observation notes:" : "Record delivery observation before final sign-off:"}
              </p>
              {isApprovedOrCompleted ? (
                <textarea
                  value={teacherObservation}
                  readOnly={isCompleted}
                  onChange={(e) => !isCompleted && setTeacherObservation(e.target.value)}
                  placeholder="Record key observations about the lesson delivery, student engagement, and learning outcomes..."
                  className="flex-1 w-full border border-blue-300 rounded-xl p-2.5 text-xs min-h-[120px] outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 bg-white/80 disabled:bg-slate-50 resize-none"
                />
              ) : (
                <div className="future-field bg-blue-100/50 text-blue-700 border border-blue-200">Observation will be recorded after delivery.</div>
              )}
            </div>
          </div>

          {/* Hide Sign-off button if already COMPLETED */}
          {isApprovedOrCompleted && !isCompleted && onFinalSignoff && (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmStep(1)}
                disabled={!teacherObservation.trim()}
                title={!teacherObservation.trim() ? "Please fill in Teacher Observation to complete sign-off" : ""}
                className="px-7 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2"
              >
                ✓ Final Sign-off & Complete Lesson
              </button>
            </div>
          )}
        </div>

        {/* Improved 3-Card Footer Signatures */}
        <div className="preview-foot border-t border-slate-200 pt-6 mt-6">
          <div className="signature-box bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <b className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">PREPARED BY</b>
              <div className="text-sm font-bold text-slate-900">{lessonPlanData.preparedBy || emDash}</div>
              {(submissionNote || lessonPlanData.submissionNote || lessonPlanData.noteToReviewer) && (
                <div className="note-content"><strong>Note:</strong> {submissionNote || lessonPlanData.submissionNote || lessonPlanData.noteToReviewer}</div>
              )}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 text-xs font-medium text-slate-500">Sign: ______________________</div>
          </div>

          <div className="signature-box bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <b className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">REVIEWED BY</b>
              <div className="text-sm font-bold text-slate-900">{lessonPlanData.reviewerName || emDash}</div>
              {(lessonPlanData.specialistFeedback || lessonPlanData.reviewerFeedback || lessonPlanData.reviewerNote || lessonPlanData.reviewerRemark) ? (
                <div className="note-content"><strong>Feedback:</strong> {lessonPlanData.specialistFeedback || lessonPlanData.reviewerFeedback || lessonPlanData.reviewerNote || lessonPlanData.reviewerRemark}</div>
              ) : <div className="text-xs text-slate-400 italic my-2">Review pending</div>}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 text-xs font-medium text-slate-500">Sign: ______________________</div>
          </div>

          <div className="signature-box bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <b className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">APPROVED BY</b>
              <div className="text-sm font-bold text-slate-900">{lessonPlanData.approverName || emDash}</div>
              {(lessonPlanData.finalApprovalFeedback || lessonPlanData.approverFeedback || lessonPlanData.approverNote || lessonPlanData.principalRemark) ? (
                <div className="note-content"><strong>Approval Note:</strong> {lessonPlanData.finalApprovalFeedback || lessonPlanData.approverFeedback || lessonPlanData.approverNote || lessonPlanData.principalRemark}</div>
              ) : <div className="text-xs text-slate-400 italic my-2">Approval pending</div>}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 text-xs font-medium text-slate-500">Sign: ______________________</div>
          </div>
        </div>
      </div>

      {confirmStep > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            {confirmStep === 1 && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Step 1 of 2: Confirm Post-Delivery Record</h3>
                <p className="text-sm text-slate-600 mb-6">Are you sure you want to finalize the post-delivery learning record?</p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setConfirmStep(0)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                  <button type="button" onClick={() => setConfirmStep(2)} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl">Proceed to Final Step →</button>
                </div>
              </div>
            )}
            {confirmStep === 2 && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Step 2 of 2: Final Sign-off Submission</h3>
                <p className="text-sm text-slate-600 mb-6">This action will permanently sign off this lesson plan and mark it <strong>COMPLETED</strong>.</p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setConfirmStep(1)} disabled={isSubmittingSignoff} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Back</button>
                  <button type="button" onClick={handleSignoffSubmit} disabled={isSubmittingSignoff} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">{isSubmittingSignoff ? "Saving..." : "✓ Confirm Final Sign-off"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎉 Celebration / Congratulations Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 text-center relative overflow-hidden flex flex-col items-center">
            {/* Background Confetti Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[32px] flex flex-wrap gap-4 p-4">
              🎉 🌟 ✨ 🏆 🧑‍🏫 🎨 📝 📖 🍎 ⭐ 🚀 ⚡
            </div>

            {/* Main Trophy / Confetti Graphic */}
            <div className="w-20 h-20 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-4xl mb-5 shadow-inner animate-bounce">
              🏆
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Congratulations, Teacher! 🎉
            </h3>
            <p className="text-sm font-semibold text-slate-500 mb-6 max-w-xs leading-relaxed">
              Your lesson plan is officially <strong>Signed Off & Completed</strong>! You are ready to deliver this awesome lesson in your classroom. 🌟
            </p>

            <button
              type="button"
              onClick={() => {
                setShowCelebration(false);
                // Reload the page to reflect signed-off status in UI
                window.location.reload();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Awesome, Let's Go! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
