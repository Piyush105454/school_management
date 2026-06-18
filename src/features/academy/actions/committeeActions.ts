"use server";

import { db } from "@/db";
import { committeeMembers, committeeRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getTeacherCommitteePermissions(teacherId: string) {
  try {
    const memberships = await db
      .select({
        roleName: committeeRoles.roleName,
        canApproveAcademy: committeeRoles.canApproveAcademy,
        canManageTimetable: committeeRoles.canManageTimetable,
      })
      .from(committeeMembers)
      .leftJoin(committeeRoles, eq(committeeMembers.roleId, committeeRoles.id))
      .where(eq(committeeMembers.teacherId, teacherId));

    let canApproveAcademy = false;
    let canManageTimetable = false;

    for (const m of memberships) {
      if (m.canApproveAcademy) canApproveAcademy = true;
      if (m.canManageTimetable) canManageTimetable = true;
    }

    return { success: true, canApproveAcademy, canManageTimetable };
  } catch (error) {
    console.error("getTeacherCommitteePermissions error:", error);
    return { success: false, canApproveAcademy: false, canManageTimetable: false };
  }
}
