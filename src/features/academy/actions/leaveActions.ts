"use server";

import { db } from "@/db";
import { studentLeaves, students, studentProfiles, admissionMeta, classes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { uploadToS3 } from "@/lib/s3-service";

interface LeaveInput {
  startDate: string;
  endDate: string;
  type: "HALF_DAY" | "FULL_DAY";
  reason: string;
  imageUrl?: string; // Base64 data string (optional)
}

/**
 * Resolves the academic student record from the currently logged-in user session.
 */
async function resolveCurrentStudent(userId: string) {
  const results = await db
    .select({
      id: studentProfiles.admissionMetaId,
      entryNumber: admissionMeta.entryNumber,
    })
    .from(studentProfiles)
    .innerJoin(admissionMeta, eq(studentProfiles.admissionMetaId, admissionMeta.id))
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  if (!results.length || !results[0].entryNumber) {
    throw new Error("Admission profile not found. Complete your admission process first.");
  }

  const student = await db.query.students.findFirst({
    where: eq(students.studentId, results[0].entryNumber),
  });

  if (!student) {
    throw new Error("Academic student record pending synchronization.");
  }

  return student;
}

/**
 * Action for students to apply for leave.
 */
export async function applyForLeaveAction(data: LeaveInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT_PARENT") {
      return { success: false, error: "Unauthorized. Student role required." };
    }

    const student = await resolveCurrentStudent(session.user.id);
    if (!student.classId) {
      return { success: false, error: "You are not assigned to any class yet." };
    }

    // 1. Validate Date ranges & Durations
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (data.type === "FULL_DAY") {
      const sTemp = new Date(data.startDate);
      const eTemp = new Date(data.endDate);
      sTemp.setHours(0, 0, 0, 0);
      eTemp.setHours(0, 0, 0, 0);
      
      const diffTime = eTemp.getTime() - sTemp.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > 2) {
        return { success: false, error: "Full day leaves cannot be requested for more than 2 days." };
      }
      if (sTemp > eTemp) {
        return { success: false, error: "Start date cannot be after end date." };
      }
    }

    // 2. Validate Yearly Quota of 10 Days
    const currentYear = new Date().getFullYear();
    const studentLeavesThisYear = await db
      .select()
      .from(studentLeaves)
      .where(
        and(
          eq(studentLeaves.studentId, student.id),
          eq(studentLeaves.status, "APPROVED")
        )
      );

    let takenDays = 0;
    studentLeavesThisYear.forEach((leave) => {
      if (leave.type === "HALF_DAY") {
        takenDays += 0.5;
      } else {
        const sTemp = new Date(leave.startDate);
        const eTemp = new Date(leave.endDate);
        sTemp.setHours(0, 0, 0, 0);
        eTemp.setHours(0, 0, 0, 0);
        const diffTime = eTemp.getTime() - sTemp.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        takenDays += diffDays;
      }
    });

    let newLeaveDuration = 0.5;
    if (data.type === "FULL_DAY") {
      const sTemp = new Date(data.startDate);
      const eTemp = new Date(data.endDate);
      sTemp.setHours(0, 0, 0, 0);
      eTemp.setHours(0, 0, 0, 0);
      const diffTime = eTemp.getTime() - sTemp.getTime();
      newLeaveDuration = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    if (takenDays + newLeaveDuration > 10) {
      return {
        success: false,
        error: `Leave application exceeds your yearly quota of 10 days. You have already taken ${takenDays} days of approved leaves this year. Requested: ${newLeaveDuration} days.`,
      };
    }

    let finalImageUrl = null;
    if (data.imageUrl && data.imageUrl.startsWith("data:")) {
      try {
        finalImageUrl = await uploadToS3(data.imageUrl, {
          fileName: `leave_${Date.now()}`,
          category: "academy/leaves",
          studentId: student.studentId,
        });
      } catch (uploadError: any) {
        console.error("Leave image upload to S3 failed:", uploadError);
        return { success: false, error: "Failed to upload leave application image. Please try again." };
      }
    }

    await db.insert(studentLeaves).values({
      studentId: student.id,
      classId: student.classId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      type: data.type,
      reason: data.reason.trim(),
      imageUrl: finalImageUrl,
      status: "PENDING",
    });

    revalidatePath("/student/leave");
    revalidatePath("/office/academy-management/leaves");
    return { success: true };
  } catch (error: any) {
    console.error("applyForLeaveAction error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

/**
 * Action for students to get their own leaves.
 */
export async function getStudentLeavesAction() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT_PARENT") {
      return { success: false, error: "Unauthorized." };
    }

    const student = await resolveCurrentStudent(session.user.id);
    const leavesList = await db
      .select()
      .from(studentLeaves)
      .where(eq(studentLeaves.studentId, student.id))
      .orderBy(desc(studentLeaves.createdAt));

    return { success: true, leaves: leavesList };
  } catch (error: any) {
    console.error("getStudentLeavesAction error:", error);
    return { success: false, error: error.message || "Failed to load leaves." };
  }
}

/**
 * Action for office/teacher/principal to get all leaves with optional class filters.
 */
export async function getAllStudentLeavesForManagementAction(filters?: { classId?: number }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OFFICE", "TEACHER", "PRINCIPAL"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    // Use standard SELECT with joins to avoid development hot-reloading schema-caching query issues.
    const baseQuery = db
      .select({
        id: studentLeaves.id,
        studentId: studentLeaves.studentId,
        classId: studentLeaves.classId,
        startDate: studentLeaves.startDate,
        endDate: studentLeaves.endDate,
        type: studentLeaves.type,
        reason: studentLeaves.reason,
        imageUrl: studentLeaves.imageUrl,
        status: studentLeaves.status,
        createdAt: studentLeaves.createdAt,
        updatedAt: studentLeaves.updatedAt,
        student: {
          name: students.name,
          rollNumber: students.rollNumber,
          studentId: students.studentId,
        },
        class: {
          name: classes.name,
        },
      })
      .from(studentLeaves)
      .leftJoin(students, eq(studentLeaves.studentId, students.id))
      .leftJoin(classes, eq(studentLeaves.classId, classes.id));

    const finalQuery = filters?.classId
      ? baseQuery.where(eq(studentLeaves.classId, filters.classId))
      : baseQuery;

    const leavesList = await finalQuery.orderBy(desc(studentLeaves.createdAt));

    return { success: true, leaves: leavesList };
  } catch (error: any) {
    console.error("getAllStudentLeavesForManagementAction error:", error);
    return { success: false, error: error.message || "Failed to load management leaves." };
  }
}

/**
 * Action for office/teacher/principal to approve or reject a leave.
 */
export async function updateLeaveStatusAction(leaveId: number, status: "APPROVED" | "REJECTED") {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OFFICE", "TEACHER", "PRINCIPAL"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    await db
      .update(studentLeaves)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(studentLeaves.id, leaveId));

    revalidatePath("/student/leave");
    revalidatePath("/office/academy-management/leaves");
    return { success: true };
  } catch (error: any) {
    console.error("updateLeaveStatusAction error:", error);
    return { success: false, error: error.message || "Failed to update leave status." };
  }
}
