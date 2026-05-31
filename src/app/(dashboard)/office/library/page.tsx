import React from "react";
import { protectRoute } from "@/lib/roleGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { resources, resourceIssuances, students, teachers } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import LibraryClient from "./LibraryClient";

// Library page: manages BOOK, REFERENCE, NOVEL, MAGAZINE, OTHER_BOOK types
const LIBRARY_TYPES = ["BOOK", "REFERENCE", "NOVEL", "MAGAZINE", "OTHER_BOOK", "TEXTBOOK"];

export default async function LibraryPage() {
  await protectRoute(["OFFICE", "TEACHER", "PRINCIPAL"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Fetch library resources (book-type only)
  const allResources = await db
    .select()
    .from(resources)
    .orderBy(desc(resources.createdAt));

  // Filter to library types
  const libraryResources = allResources.filter(r =>
    LIBRARY_TYPES.includes(r.type) || r.type === "BOOK" || !["DEVICE", "EQUIPMENT", "LAB_EQUIPMENT", "CHEMICAL", "APPARATUS", "OTHER"].includes(r.type)
  );

  const libraryResourceIds = libraryResources.map(r => r.id);

  // Fetch issuances for library resources
  let allIssuances: any[] = [];
  if (libraryResourceIds.length > 0) {
    allIssuances = await db
      .select({
        id: resourceIssuances.id,
        resourceId: resourceIssuances.resourceId,
        recipientType: resourceIssuances.recipientType,
        studentId: resourceIssuances.studentId,
        teacherId: resourceIssuances.teacherId,
        quantityIssued: resourceIssuances.quantityIssued,
        status: resourceIssuances.status,
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
  }

  const allStudents = await db
    .select({ id: students.id, name: students.name, rollNumber: students.rollNumber })
    .from(students)
    .orderBy(students.name);

  const allTeachers = await db
    .select({ id: teachers.id, name: teachers.name })
    .from(teachers)
    .orderBy(teachers.name);

  return (
    <LibraryClient
      initialResources={libraryResources}
      initialIssuances={allIssuances}
      students={allStudents}
      teachers={allTeachers}
    />
  );
}
