"use server";

import { db } from "@/db";
import { subjects, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTeachers() {
  try {
    const allTeachers = await db.query.teachers.findMany();
    return { success: true, data: allTeachers };
  } catch (error: any) {
    console.error("Error fetching teachers:", error);
    return { success: false, error: error.message };
  }
}

export async function assignTeacherToSubject(subjectId: number, teacherId: string | null) {
  try {
    await db
      .update(subjects)
      .set({
        assignedTeacherId: teacherId,
      })
      .where(eq(subjects.id, subjectId));

    revalidatePath("/office/academy-management/classes/");
    return { success: true };
  } catch (error: any) {
    console.error("Error assigning teacher:", error);
    return { success: false, error: error.message };
  }
}

export async function getSubjectWithTeacher(subjectId: number) {
  try {
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, subjectId),
      with: {
        assignedTeacher: true,
      },
    });
    return { success: true, data: subject };
  } catch (error: any) {
    console.error("Error fetching subject:", error);
    return { success: false, error: error.message };
  }
}
