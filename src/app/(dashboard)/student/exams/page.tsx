import React from "react";
import { protectRoute } from "@/lib/roleGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { examSchedules, students, studentProfiles, admissionMeta, classes } from "@/db/schema";
import { eq, gte } from "drizzle-orm";
import StudentExamClient from "./StudentExamClient";

export default async function StudentExamsPage() {
  await protectRoute(["STUDENT_PARENT"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Find student profile → class
  const profiles = await db
    .select({
      admissionMetaId: studentProfiles.admissionMetaId,
    })
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, session.user.id))
    .limit(1);

  // Try to find the student's class via the students table (matched by userId / student records)
  // Fallback: show all exams for all classes
  let studentClassId: number | null = null;
  let studentClassName: string | null = null;

  // Look through students table to find classId
  const studentRecords = await db.select().from(students).limit(200);

  // Get from 30 days ago onwards
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 10);

  const allExams = await db
    .select()
    .from(examSchedules)
    .where(gte(examSchedules.examDate, fromDate.toISOString().split("T")[0]))
    .orderBy(examSchedules.examDate, examSchedules.startTime);

  return (
    <StudentExamClient
      exams={allExams}
      studentClassName={studentClassName}
    />
  );
}
