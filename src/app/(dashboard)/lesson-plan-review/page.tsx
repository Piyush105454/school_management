"use client";

import React, { useState } from "react";
import Step10ReviewUI from "@/components/lesson-plan/Step10ReviewUI";
import "@/components/lesson-plan/Step10ReviewUI.css";

export default function LessonPlanReviewPage() {
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [submissionNote, setSubmissionNote] = useState("");

  // Sample lesson plan data - replace with your actual data
  const sampleLessonPlan = {
    // Step 1: Lesson Details
    id: "LP-NURSE-ENGL-20260724-C5",
    className: "Nursery",
    subject: "English",
    chapterNo: "5",
    chapterName: "Son",
    pageFrom: "12",
    pageTo: "45",
    prepDate: "2026-07-23",
    deliveryDate: "2026-07-24",
    preparedBy: "Sg",
    reviewerName: "s",
    approverName: "Principal Name",
    lessonType: "Explanation",
    
    // Step 2: Objective
    objectiveVerb: "identify",
    objectiveText: "different types of leaves and their characteristics",
    
    // Step 3: Teaching Notes
    teachingNotes: "Begin by showing real leaves from the school garden. Explain the parts of a leaf: blade, petiole, and veins. Discuss different leaf shapes: oval, heart-shaped, needle-like. Use the textbook diagrams to reinforce learning.",
    references: "Textbook pages 12-15, School garden samples",
    
    // Step 4: Discussion & Participation
    discussionPlan: "Students will share what they observe about different leaves. Ask questions like: What colors do you see? What shapes? Are all leaves the same size?",
    quieterStudentSupport: "Pair quieter students with confident peers. Walk around and ask direct, simple questions to encourage participation.",
    
    // Step 5: Lesson Activity (for Explanation type)
    activityTitle: "Leaf Collection and Classification",
    activityMode: "Material-based",
    activitySteps: "1. Students will collect 3 different leaves from the school garden\n2. They will trace the leaves in their notebooks\n3. They will label the parts: blade, petiole, veins\n4. They will describe each leaf using 2-3 words",
    materials: "Real leaves, notebooks, pencils, crayons",
    teacherRole: "I will demonstrate leaf tracing first and guide students who need help with labeling",
    activitySuccess: "Students will correctly identify and label at least 2 parts of the leaf",
    
    // Step 6: Lesson Introduction
    lessonHook: "Show a colorful autumn leaf and ask: Have you seen leaves change colors? Why do you think that happens?",
    introConnection: "Connect to the previous lesson about plants and trees. Remind students that leaves are an important part of plants.",
    
    // Step 7: Learning Indicators
    indicator1: "Students can identify the three main parts of a leaf",
    indicator2: "Students can describe different leaf shapes",
    indicator3: "Students can collect and classify leaves by their characteristics",
    
    // Step 8: Homework
    homeworkGiven: "Yes",
    homeworkTask: "Draw and color your favorite leaf from today's lesson. Label its parts.",
    homeworkDue: "2026-07-25",
    homeworkInstruction: "Complete independently with parent supervision. Bring your drawing to class tomorrow.",
    
    // Step 9: Energizer
    energizer: "Follow My Taali - Teacher performs 4–5 simple clap patterns. Students observe and repeat together. End with one final class clap.",
    energizerPrepared: true,
    
    // Step 10: Closure & Reward
    rewardType: "Praise / Appreciation",
    rewardCriteria: "Students who correctly identify all three parts of the leaf, participate actively in discussion, or help a classmate understand the concept.",
  };

  const completionScore = 100;

  const handleMarkReady = () => {
    if (ownershipConfirmed && completionScore >= 100) {
      alert("Lesson plan marked ready for reviewer!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Step10ReviewUI
          lessonPlanData={sampleLessonPlan}
          completionScore={completionScore}
          onMarkReady={handleMarkReady}
          onPrint={handlePrint}
          ownershipConfirmed={ownershipConfirmed}
          setOwnershipConfirmed={setOwnershipConfirmed}
          submissionNote={submissionNote}
          setSubmissionNote={setSubmissionNote}
        />
      </div>
    </div>
  );
}
