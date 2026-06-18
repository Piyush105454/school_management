export const dynamic = "force-dynamic";

import React from "react";
import { db } from "@/db";
import { teachers, committeeRoles, committeeMembers } from "@/db/schema";
import { CommitteeManagementClient } from "./CommitteeManagementClient";

export default async function CommitteeManagementPage() {
  const teachersList = await db
    .select({
      id: teachers.id,
      name: teachers.name,
      committees: teachers.committees,
      responsibility: teachers.responsibility,
      assignedRole: teachers.assignedRole,
      specialization: teachers.specialization,
      institute: teachers.institute,
    })
    .from(teachers)
    .orderBy(teachers.name);

  const rolesList = await db.select().from(committeeRoles).orderBy(committeeRoles.id);
  const membersList = await db.select().from(committeeMembers);

  return (
    <div className="p-6 md:p-10 space-y-6">
      <CommitteeManagementClient initialTeachers={teachersList as any} initialRoles={rolesList} initialMembers={membersList} />
    </div>
  );
}
