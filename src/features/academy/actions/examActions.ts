"use server";

import { db } from "@/db";
import { examSchedules, classes, subjects, timetable } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const EXAM_PATHS = [
  "/office/academy-management/exams",
  "/teacher/exams",
  "/student/exams",
];

function revalidateAll() {
  EXAM_PATHS.forEach(p => revalidatePath(p));
}

interface ExamInput {
  examType: string;
  title: string;
  description?: string;
  classId: number;
  className: string;
  subjectId?: number | null;
  subjectName?: string;
  examDate: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  timetablePeriod?: string;
  maxMarks?: number;
  passingMarks?: number;
  venue?: string;
  instructions?: string;
}

/** Create a new exam/test schedule */
export async function createExamAction(data: ExamInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OFFICE", "PRINCIPAL", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    if (!data.title?.trim() || !data.examType || !data.classId || !data.examDate || !data.startTime || !data.endTime) {
      return { success: false, error: "Title, exam type, class, date and time are required." };
    }

    await db.insert(examSchedules).values({
      examType: data.examType,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      classId: data.classId,
      className: data.className,
      subjectId: data.subjectId || null,
      subjectName: data.subjectName?.trim() || null,
      examDate: data.examDate,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes || null,
      timetablePeriod: data.timetablePeriod?.trim() || null,
      maxMarks: data.maxMarks ?? 100,
      passingMarks: data.passingMarks ?? 35,
      venue: data.venue?.trim() || "Classroom",
      instructions: data.instructions?.trim() || null,
      status: "SCHEDULED",
      createdBy: session.user.id,
    });

    revalidateAll();
    return { success: true };
  } catch (error: any) {
    console.error("createExamAction error:", error);
    return { success: false, error: error.message || "Failed to create exam." };
  }
}

/** Update an existing exam */
export async function updateExamAction(examId: string, data: Partial<ExamInput> & { status?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OFFICE", "PRINCIPAL", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    await db.update(examSchedules)
      .set({
        ...(data.examType && { examType: data.examType }),
        ...(data.title && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.classId && { classId: data.classId }),
        ...(data.className && { className: data.className }),
        ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
        ...(data.subjectName !== undefined && { subjectName: data.subjectName }),
        ...(data.examDate && { examDate: data.examDate }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.timetablePeriod !== undefined && { timetablePeriod: data.timetablePeriod }),
        ...(data.maxMarks !== undefined && { maxMarks: data.maxMarks }),
        ...(data.passingMarks !== undefined && { passingMarks: data.passingMarks }),
        ...(data.venue !== undefined && { venue: data.venue }),
        ...(data.instructions !== undefined && { instructions: data.instructions }),
        ...(data.status && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(examSchedules.id, examId));

    revalidateAll();
    return { success: true };
  } catch (error: any) {
    console.error("updateExamAction error:", error);
    return { success: false, error: error.message || "Failed to update exam." };
  }
}

/** Delete an exam */
export async function deleteExamAction(examId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OFFICE", "PRINCIPAL", "ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized." };
    }

    await db.delete(examSchedules).where(eq(examSchedules.id, examId));

    revalidateAll();
    return { success: true };
  } catch (error: any) {
    console.error("deleteExamAction error:", error);
    return { success: false, error: error.message || "Failed to delete exam." };
  }
}

/** Get all exams (with optional filters) */
export async function getExamsAction(filters?: {
  classId?: number;
  subjectId?: number;
  examType?: string;
  fromDate?: string;
  toDate?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized.", exams: [] };

    const allExams = await db
      .select()
      .from(examSchedules)
      .orderBy(examSchedules.examDate, examSchedules.startTime);

    let filtered = allExams;

    if (filters?.classId) {
      filtered = filtered.filter(e => e.classId === filters.classId);
    }
    if (filters?.subjectId) {
      filtered = filtered.filter(e => e.subjectId === filters.subjectId);
    }
    if (filters?.examType) {
      filtered = filtered.filter(e => e.examType === filters.examType);
    }
    if (filters?.fromDate) {
      filtered = filtered.filter(e => e.examDate >= filters.fromDate!);
    }
    if (filters?.toDate) {
      filtered = filtered.filter(e => e.examDate <= filters.toDate!);
    }

    return { success: true, exams: filtered };
  } catch (error: any) {
    console.error("getExamsAction error:", error);
    return { success: false, error: error.message, exams: [] };
  }
}

/** Get timetable slots for a specific class and day */
export async function getTimetableSlotsAction(classId: number, dayOfWeek: string) {
  try {
    const slots = await db
      .select()
      .from(timetable)
      .where(and(eq(timetable.classId, classId), eq(timetable.dayOfWeek, dayOfWeek)))
      .orderBy(timetable.startTime);

    return { success: true, slots };
  } catch (error: any) {
    return { success: false, slots: [], error: error.message };
  }
}
