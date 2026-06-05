import React from "react";
import { protectRoute } from "@/lib/roleGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { examSchedules, teachers } from "@/db/schema";
import { eq, gte } from "drizzle-orm";
import TeacherExamClient from "./TeacherExamClient";

export default async function TeacherExamsPage() {
  await protectRoute(["TEACHER", "PRINCIPAL"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Get teacher record
  const teacherRecords = await db
    .select()
    .from(teachers)
    .where(eq(teachers.userId, session.user.id))
    .limit(1);

  const teacher = teacherRecords[0] || null;

  // Get all upcoming and recent exams
  const today = new Date();
  today.setDate(today.getDate() - 30); // show last 30 days too
  const fromDate = today.toISOString().split("T")[0];

  const allExams = await db
    .select()
    .from(examSchedules)
    .where(gte(examSchedules.examDate, fromDate))
    .orderBy(examSchedules.examDate, examSchedules.startTime);

  return (
    <TeacherExamClient
      exams={allExams}
      teacher={teacher}
    />
  );
}
