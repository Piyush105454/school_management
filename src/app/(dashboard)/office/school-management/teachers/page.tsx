import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { teachers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TeacherManagementClient } from "./TeacherManagementClient";

export default async function TeacherManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "OFFICE") redirect("/");

  const teachersList = await db
    .select({
      id: teachers.id,
      userId: teachers.userId,
      name: teachers.name,
      contactNumber: teachers.contactNumber,
      classAssigned: teachers.classAssigned,
      email: users.email,
    })
    .from(teachers)
    .leftJoin(users, eq(teachers.userId, users.id))
    .orderBy(teachers.name);

  return <TeacherManagementClient initialTeachers={teachersList as any} />;
}

