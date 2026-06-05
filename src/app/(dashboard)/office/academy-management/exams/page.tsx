import React from "react";
import { protectRoute } from "@/lib/roleGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { examSchedules, classes, subjects } from "@/db/schema";
import { desc } from "drizzle-orm";
import ExamManagementClient from "./ExamManagementClient";

export default async function ExamsPage() {
  await protectRoute(["OFFICE", "PRINCIPAL", "ADMIN"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Fetch all exams ordered by date
  const allExams = await db
    .select()
    .from(examSchedules)
    .orderBy(examSchedules.examDate, examSchedules.startTime);

  // Fetch all classes
  const allClasses = await db.select().from(classes).orderBy(classes.grade, classes.name);

  // Fetch all subjects
  const allSubjects = await db.select().from(subjects).orderBy(subjects.name);

  return (
    <ExamManagementClient
      initialExams={allExams}
      classes={allClasses}
      allSubjects={allSubjects}
    />
  );
}
