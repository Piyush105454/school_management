"use server";

import { db } from "@/db";
import { students, classes, studentAttendance } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveFaceEmbeddingAction(studentId: number, embedding: number[]) {
  try {
    if (!studentId) {
      return { success: false, error: "Student ID is required" };
    }
    if (!embedding || embedding.length !== 128) {
      return { success: false, error: "Invalid face descriptor vector length (must be 128)" };
    }

    const faceEmbeddingString = JSON.stringify(embedding);

    await db
      .update(students)
      .set({
        faceEmbedding: faceEmbeddingString,
      })
      .where(eq(students.id, studentId));

    revalidatePath("/office/academy-management/attendance");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving student face embedding:", error);
    return { success: false, error: error.message };
  }
}

export async function getAllEnrolledStudentsAction() {
  try {
    const list = await db
      .select({
        id: students.id,
        name: students.name,
        rollNumber: students.rollNumber,
        studentId: students.studentId,
        faceEmbedding: students.faceEmbedding,
        classId: students.classId,
        className: classes.name,
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .orderBy(students.name);

    const mapped = list.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      studentId: s.studentId,
      faceEmbedding: s.faceEmbedding ? (JSON.parse(s.faceEmbedding) as number[]) : null,
      classId: s.classId,
      className: s.className || "Unassigned",
    }));

    return { success: true, data: mapped };
  } catch (error: any) {
    console.error("Error fetching enrolled students:", error);
    return { success: false, error: error.message };
  }
}

export async function markKioskAttendanceAction(studentId: number) {
  try {
    const studentRecord = await db.query.students.findFirst({
      where: eq(students.id, studentId),
    });

    if (!studentRecord) {
      return { success: false, error: "Student not found" };
    }

    const attendanceDate = new Date();
    attendanceDate.setHours(0, 0, 0, 0); // Consistently match daily midnight timestamps

    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const day = dayNames[attendanceDate.getDay()];
    const month = monthNames[attendanceDate.getMonth()];
    const year = attendanceDate.getFullYear();

    // Check if attendance already logged for today
    const existing = await db
      .select()
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.studentId, studentId),
          eq(studentAttendance.date, attendanceDate)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const record = existing[0];
      if (record.status === "P") {
        return {
          success: true,
          alreadyMarked: true,
          studentName: studentRecord.name,
          rollNumber: studentRecord.rollNumber,
          studentIdString: studentRecord.studentId,
        };
      }

      // Update non-present status to present (P)
      await db
        .update(studentAttendance)
        .set({ status: "P" })
        .where(eq(studentAttendance.id, record.id));
    } else {
      // Insert new daily present record
      await db.insert(studentAttendance).values({
        studentId,
        classId: studentRecord.classId,
        date: attendanceDate,
        day,
        month,
        year,
        status: "P",
      });
    }

    revalidatePath("/office/academy-management/attendance");
    return {
      success: true,
      alreadyMarked: false,
      studentName: studentRecord.name,
      rollNumber: studentRecord.rollNumber,
      studentIdString: studentRecord.studentId,
    };
  } catch (error: any) {
    console.error("Kiosk face marking error:", error);
    return { success: false, error: error.message };
  }
}
