import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { redirect } from "next/navigation";
import { TeacherManagementClient } from "./TeacherManagementClient";

export default async function TeacherManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "OFFICE") redirect("/");

  const teachersList = await db.select().from(teachers).orderBy(teachers.name);

  return <TeacherManagementClient initialTeachers={teachersList} />;
}

