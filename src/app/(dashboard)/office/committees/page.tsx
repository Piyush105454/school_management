import React from "react";
export const dynamic = "force-dynamic";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { CommitteeManagementClient } from "./CommitteeManagementClient";

export default async function CommitteeManagementPage() {
  const teachersList = await db.select({
    id: teachers.id,
    name: teachers.name,
    committees: teachers.committees,
    responsibility: teachers.responsibility,
    assignedRole: teachers.assignedRole,
    specialization: teachers.specialization,
  }).from(teachers);

  return <CommitteeManagementClient initialTeachers={teachersList as any} />;
}
