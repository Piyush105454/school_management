"use client";

import React from "react";
import "./Step10ReviewUI.css";

interface LessonPlanData {
  // Step 1: Lesson Details
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
  
  // Step 2: Objective
  objectiveVerb?: string;
  objectiveText?: string;
  
  // Step 3: Teaching Notes
  teachingNotes?: string;
  references?: string;
  
  // Step 4: Discussion & Participation (Explanation) / Q&A Support
  discussionPlan?: string;
  quieterStudentSupport?: string;
  
  // Step 5: Lesson Activity (Explanation only)
  activityTitle?: string;
  activityMode?: string;
  activitySteps?: string;
  materials?: string;
  teacherRole?: string;
  activitySuccess?: string;
  
  // Step 6: Lesson Introduction
  lessonHook?: string;
  introConnection?: string;
  
  // Step 7: Learning Indicators
  indicator1?: string;
  indicator2?: string;
  indicator3?: string;
  
  // Step 8: Homework
  homeworkGiven?: string;
  homeworkTask?: string;
  homeworkDue?: string;
  homeworkInstruction?: string;
  prevDayHomeworkFeedback?: string;
  
  // Step 9: Energizer
  energizer?: string;
  energizerPrepared?: boolean;
  
  // Step 10: Closure & Reward
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
}: Step10ReviewUIProps) {
  const emDash = "—";
  const bullet = "·";
  
  return (
    <div className="step-10-review">
      {!isReviewerMode && (
        <>
          {/* Hero Section */}
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

          {/* Review Banner */}
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

          {/* Review Controls */}
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
                    className="btn btn-success"
                    type="button"
                    onClick={onMarkReady}
                    disabled={!ownershipConfirmed || completionScore < 100}
                  >
                    Mark ready for reviewer
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={onPrint}>
                    Print / Save as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Preview Paper */}
      <div className="preview-paper">
        {/* Header */}
        <div className="preview-head">
          <div className="school-name">Dhanpuri Public School</div>
          <div className="lp-title">
            Lesson Plan Type: {lessonPlanData.lessonType || emDash} {bullet} ID: {lessonPlanData.id || emDash}
          </div>
        </div>

        {/* Meta Grid */}
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
            <span>
              {lessonPlanData.chapterNo || emDash} {bullet} {lessonPlanData.chapterName || emDash}
            </span>
          </div>
          <div className="meta-cell">
            <b>PAGES</b>
            <span>
              {lessonPlanData.pageFrom || emDash} {emDash} {lessonPlanData.pageTo || emDash}
            </span>
          </div>
        </div>

        {/* Second Meta Grid */}
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

        {/* Lesson Table */}
        <div className="table-scroll">
          <table className="lesson-table">
            <colgroup>
              <col className="section-col" />
              <col className="time-col" />
              <col className="label-col" />
              <col className="content-col" />
            </colgroup>
            <tbody>
              {/* Opening Time */}
              <tr>
                <th className="section-cell" rowSpan={2}>
                  Opening Time
                  <br />
                  <span>(5 mins)</span>
                </th>
                <td className="time-cell">2 mins</td>
                <th className="label-cell">Energizer Fun Activity</th>
                <td className="content-cell">{lessonPlanData.energizer || emDash}</td>
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

              {/* Active Learning */}
              <tr>
                <th className="section-cell" rowSpan={5}>
                  Active Learning
                  <br />
                  <span>(30 mins)</span>
                </th>
                <td className="time-cell">2 mins</td>
                <th className="label-cell">Lesson Introduction</th>
                <td className="content-cell">
                  {lessonPlanData.lessonHook ? (
                    <>
                      <strong>Lesson introduction:</strong> {lessonPlanData.lessonHook}
                      {lessonPlanData.introConnection && (
                        <>
                          <br /><br />
                          <strong>Connection:</strong> {lessonPlanData.introConnection}
                        </>
                      )}
                    </>
                  ) : emDash}
                </td>
              </tr>
              <tr>
                <td className="time-cell">12 mins</td>
                <th className="label-cell">Teaching Notes</th>
                <td className="content-cell">
                  {lessonPlanData.teachingNotes || emDash}
                  {lessonPlanData.references && (
                    <>
                      <br /><br />
                      <strong>References:</strong> {lessonPlanData.references}
                    </>
                  )}
                </td>
              </tr>
              <tr>
                <td className="time-cell">8 mins</td>
                <th className="label-cell">
                  {lessonPlanData.lessonType === "Q&A"
                    ? "Inspection & Support by Teacher"
                    : "Lesson Activity"}
                </th>
                <td className="content-cell">
                  {lessonPlanData.lessonType === "Q&A" ? (
                    lessonPlanData.quieterStudentSupport ? (
                      <>
                        <strong>Inspection and support plan:</strong> {lessonPlanData.quieterStudentSupport}
                      </>
                    ) : emDash
                  ) : (
                    lessonPlanData.activityTitle ? (
                      <>
                        <strong>Activity:</strong> {lessonPlanData.activityTitle}
                        {lessonPlanData.activityMode && ` (${lessonPlanData.activityMode})`}
                        <br /><br />
                        <strong>Steps:</strong><br />
                        {lessonPlanData.activitySteps || emDash}
                        {lessonPlanData.materials && (
                          <>
                            <br /><br />
                            <strong>Materials:</strong> {lessonPlanData.materials}
                          </>
                        )}
                        {lessonPlanData.teacherRole && (
                          <>
                            <br /><br />
                            <strong>Teacher's role:</strong> {lessonPlanData.teacherRole}
                          </>
                        )}
                        {lessonPlanData.activitySuccess && (
                          <>
                            <br /><br />
                            <strong>Success check:</strong> {lessonPlanData.activitySuccess}
                          </>
                        )}
                      </>
                    ) : emDash
                  )}
                </td>
              </tr>
              <tr>
                <td className="time-cell">5 mins</td>
                <th className="label-cell">
                  {lessonPlanData.lessonType === "Q&A"
                    ? "Chapter-Based Q&A"
                    : "Knowledge Building · Discussion & Participation"}
                </th>
                <td className="content-cell">
                  {lessonPlanData.discussionPlan || 
                   "Questions and answers will be discussed in the order prepared in the Teacher's Own Q&A Teaching Notes. Students will be invited to respond before the correct answers are explained."}
                </td>
              </tr>
              <tr>
                <td className="time-cell">3 mins</td>
                <th className="label-cell">Learning Outcome & Feedback</th>
                <td className="content-cell">
                  Use this buffer time to assess the learning outcome through short questions,
                  student responses and work checks. Share immediate feedback on performance.
                  During or after delivery, record students who performed <strong>Good</strong> and
                  those who <strong>Need Support</strong>; students not selected in either group
                  will be treated as Average. Record a brief teacher observation on what was
                  understood, what was difficult, and what needs revision or individual follow-up.
                </td>
              </tr>

              {/* Closing Time */}
              <tr>
                <th className="section-cell" rowSpan={2}>
                  Closing Time
                  <br />
                  <span>(5 mins)</span>
                </th>
                <td className="time-cell">2 mins</td>
                <th className="label-cell">Lesson Closure, Reward & Recognition</th>
                <td className="content-cell">
                  {lessonPlanData.rewardCriteria ? (
                    <>
                      Wrap up the lesson by briefly summarising the key takeaways, appreciating students' efforts, and clearly sharing the planned reward or recognition.
                      <br /><br />
                      <strong>Reward type:</strong> {lessonPlanData.rewardType || "Praise / Appreciation"}
                      <br /><br />
                      <strong>Recognition:</strong> {lessonPlanData.rewardCriteria}
                    </>
                  ) : emDash}
                </td>
              </tr>
              <tr>
                <td className="time-cell">3 mins</td>
                <th className="label-cell">Homework & Previous-Day Homework Feedback</th>
                <td className="content-cell">
                  {lessonPlanData.homeworkGiven === "Yes" && lessonPlanData.homeworkTask ? (
                    <>
                      <strong>Today's Homework:</strong> {lessonPlanData.homeworkGiven}
                      <br /><br />
                      {lessonPlanData.homeworkTask}
                      {lessonPlanData.homeworkDue && (
                        <>
                          <br /><br />
                          <strong>Submission date:</strong> {lessonPlanData.homeworkDue}
                        </>
                      )}
                      {lessonPlanData.homeworkInstruction && (
                        <>
                          <br /><br />
                          <strong>Instruction:</strong> {lessonPlanData.homeworkInstruction}
                        </>
                      )}
                      <br /><br />
                      <strong>Previous-Day Homework Feedback:</strong> Share feedback on the students' work from the previous day and assess their understanding before starting the new session.
                    </>
                  ) : (
                    <>
                      <strong>Today's Homework:</strong> {lessonPlanData.homeworkGiven || "No"}
                      <br /><br />
                      <strong>Previous-Day Homework Feedback:</strong> Share feedback on the students' work from the previous day and assess their understanding before starting the new session.
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Post-Delivery Learning Record */}
        <div className="post-delivery-record">
          <div className="post-delivery-heading">
            <div>
              <strong>Post-Delivery Learning Record</strong>
              <span>
                To be completed during or after lesson delivery when the student database is
                connected.
              </span>
            </div>
            <span className="locked-tag">Planning view · Locked</span>
          </div>

          <div className="post-delivery-grid">
            <div className="delivery-box">
              <b>Good</b>
              <p>Select only the names of students who performed notably well.</p>
              <div className="future-field">Student names will load from the class database.</div>
            </div>

            <div className="delivery-box">
              <b>Needs Support</b>
              <p>
                Select only the names of students who require further help. Unselected students will
                be considered Average.
              </p>
              <div className="future-field">Student names will load from the class database.</div>
            </div>

            <div className="delivery-box observation-box">
              <b>Teacher Observation</b>
              <p>
                Briefly record what students understood well, what they found difficult, what needs
                revision or support in the next class, and any important classroom observation.
              </p>
              <div className="future-field">Observation will be recorded after delivery.</div>
            </div>
          </div>
        </div>

        {/* Preview Footer */}
        <div className="preview-foot">
          <div className="signature-box">
            <b>Learning Indicators</b>
            <div>
              {lessonPlanData.indicator1 && `1. ${lessonPlanData.indicator1}`}
              {lessonPlanData.indicator2 && (
                <>
                  <br />
                  2. {lessonPlanData.indicator2}
                </>
              )}
              {lessonPlanData.indicator3 && (
                <>
                  <br />
                  3. {lessonPlanData.indicator3}
                </>
              )}
              {!lessonPlanData.indicator1 && emDash}
            </div>
          </div>
          <div className="signature-box">
            <b>Submission Note</b>
            <div>{submissionNote || emDash}</div>
          </div>
          <div className="signature-box">
            <b>Prepared By</b>
            <span>{lessonPlanData.preparedBy || emDash}</span>
            <br />
            <br />
            Sign: __________________
          </div>
          <div className="signature-box">
            <b>Reviewed / Approved By</b>
            <span>
              {lessonPlanData.reviewerName || emDash} / {lessonPlanData.approverName || emDash}
            </span>
            <br />
            <br />
            Sign: __________________
          </div>
        </div>
      </div>
    </div>
  );
}
