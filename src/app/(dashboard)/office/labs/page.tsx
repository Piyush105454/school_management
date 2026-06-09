import React from "react";
import { protectRoute } from "@/lib/roleGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { resources, resourceIssuances, students, teachers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import LabsClient from "./LabsClient";

const isLabResource = (type: string) => {
  const baseType = type.split("|")[0];
  return (
    ["LAB_EQUIPMENT", "CHEMICAL", "APPARATUS", "LAB_OTHER"].includes(baseType) ||
    baseType.startsWith("LAB_CAT_") ||
    baseType.startsWith("LAB_")
  );
};

export default async function LabsPage() {
  await protectRoute(["OFFICE", "TEACHER", "PRINCIPAL"]);

  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const allResources = await db
    .select()
    .from(resources)
    .orderBy(desc(resources.createdAt));

  // Filter to lab types only
  const labResources = allResources.filter(r => isLabResource(r.type));

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

  // Filter issuances to lab types
  const labIssuances = allIssuances.filter(i => isLabResource(i.resourceType));

  const allStudents = await db
    .select({ id: students.id, name: students.name, rollNumber: students.rollNumber })
    .from(students)
    .orderBy(students.name);

  const allTeachers = await db
    .select({ id: teachers.id, name: teachers.name })
    .from(teachers)
    .orderBy(teachers.name);

  return (
    <LabsClient
      initialResources={labResources}
      initialIssuances={labIssuances}
      students={allStudents}
      teachers={allTeachers}
    />
  );
}
