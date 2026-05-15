"use server";

import { db } from "@/db";
import { studentAttendance } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveDailyAttendanceAction(data: {
  classId: number;
  date: string;
  attendance: { studentId: number; status: string }[];
}) {
  try {
    const attendanceDate = new Date(data.date);
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const day = dayNames[attendanceDate.getDay()];
    const month = monthNames[attendanceDate.getMonth()];
    const year = attendanceDate.getFullYear();

    await db.transaction(async (tx) => {
      // 1. Fetch all existing records for these students on this date in ONE query
      const studentIds = data.attendance.map(a => a.studentId);
      const existingRecords = await tx.select().from(studentAttendance).where(
        and(
          inArray(studentAttendance.studentId, studentIds),
          eq(studentAttendance.date, attendanceDate)
        )
      );

      const existingMap = new Map<number, number>();
      existingRecords.forEach(r => {
        if (r.studentId !== null && r.id !== null) {
          existingMap.set(r.studentId, r.id);
        }
      });

      const toInsert: any[] = [];
      const toUpdate: { id: number, status: string }[] = [];

      for (const record of data.attendance) {
        const existingId = existingMap.get(record.studentId);
        if (existingId) {
          toUpdate.push({ id: existingId, status: record.status });
        } else {
          toInsert.push({
            studentId: record.studentId,
            classId: data.classId,
            date: attendanceDate,
            day: day,
            month: month,
            year: year,
            status: record.status
          });
        }
      }

      // 2. Perform Batch Updates
      for (const update of toUpdate) {
        await tx.update(studentAttendance)
          .set({ status: update.status })
          .where(eq(studentAttendance.id, update.id));
      }

      // 3. Perform Batch Inserts
      if (toInsert.length > 0) {
        await tx.insert(studentAttendance).values(toInsert);
      }
    });

    revalidatePath("/office/academy-management/attendance");
    return { success: true };
  } catch (error: any) {
    console.error("Daily Attendance Error:", error);
    return { success: false, error: error.message };
  }
}
export async function getStudentAttendance(studentId: number) {
  try {
    const attendance = await db.select().from(studentAttendance)
      .where(eq(studentAttendance.studentId, studentId))
      .orderBy(studentAttendance.date);
    return { success: true, data: attendance };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
