import React from "react";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { teachers, users, classes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TeacherManagementClient } from "./TeacherManagementClient";

export default async function TeacherManagementPage({
  searchParams
}: {
  searchParams: Promise<{ institute?: string }>
}) {
  const { institute: selectedInstitute } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "OFFICE") redirect("/");

  const query = db
    .select({
      id: teachers.id,
      userId: teachers.userId,
      name: teachers.name,
      contactNumber: teachers.contactNumber,
      classAssigned: teachers.classAssigned,
      institute: teachers.institute,
      responsibility: teachers.responsibility,
      incharge: teachers.incharge,
      specialization: teachers.specialization,
      assignedRole: teachers.assignedRole,
      email: users.email,
    })
    .from(teachers)
    .leftJoin(users, eq(teachers.userId, users.id));

  // Apply institute filter if present
  if (selectedInstitute && selectedInstitute !== "ALL") {
    query.where(eq(teachers.institute, selectedInstitute));
  }

  const teachersList = await query.orderBy(teachers.name);

  const classesQuery = db.select().from(classes);
  if (selectedInstitute && selectedInstitute !== "ALL") {
    classesQuery.where(eq(classes.institute, selectedInstitute));
  }
  const allClasses = await classesQuery.orderBy(classes.grade);
  return <TeacherManagementClient initialTeachers={teachersList as any} allClasses={allClasses} />;
}

