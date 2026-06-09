import React from "react";
import { protectRoute } from "@/lib/roleGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { resources, resourceIssuances, students, teachers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import LibraryClient from "./LibraryClient";

export default async function LibraryPage() {
  await protectRoute(["OFFICE", "TEACHER", "PRINCIPAL"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // 1. Fetch all resources
  const allResources = await db
    .select()
    .from(resources)
    .orderBy(desc(resources.createdAt));

  // 2. Fetch all issuances with joins
  const allIssuances = await db
    .select({
      id: resourceIssuances.id,
      resourceId: resourceIssuances.resourceId,
      recipientType: resourceIssuances.recipientType,
      studentId: resourceIssuances.studentId,
      teacherId: resourceIssuances.teacherId,
      quantityIssued: resourceIssuances.quantityIssued,
      status: resourceIssuances.status,
      returnComment: resourceIssuances.returnComment,
      issuedAt: resourceIssuances.issuedAt,
      returnedAt: resourceIssuances.returnedAt,
      resourceName: resources.name,
      resourceType: resources.type,
      studentName: students.name,
      studentRoll: students.rollNumber,
      teacherName: teachers.name,
    })
    .from(resourceIssuances)
    .innerJoin(resources, eq(resourceIssuances.resourceId, resources.id))
    .leftJoin(students, eq(resourceIssuances.studentId, students.id))
    .leftJoin(teachers, eq(resourceIssuances.teacherId, teachers.id))
    .orderBy(desc(resourceIssuances.issuedAt));

  // 3. Fetch active students for selection
  const allStudents = await db
    .select({
      id: students.id,
      name: students.name,
      rollNumber: students.rollNumber,
    })
    .from(students)
    .orderBy(students.name);

  // 4. Fetch active teachers for selection
  const allTeachers = await db
    .select({
      id: teachers.id,
      name: teachers.name,
    })
    .from(teachers)
    .orderBy(teachers.name);

  return (
    <LibraryClient
      initialResources={allResources}
      initialIssuances={allIssuances}
      students={allStudents}
      teachers={allTeachers}
    />
  );
}
