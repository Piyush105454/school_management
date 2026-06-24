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

export async function addSpecializationToTeacher(teacherId: string, className: string, subjectName: string) {
  try {
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.id, teacherId)
    });
    if (!teacher) return { success: false, error: "Teacher not found" };
    
    const specString = `${className} - ${subjectName}`;
    let specs = teacher.specialization
      ? teacher.specialization.split(",").map(s => s.trim()).filter(Boolean)
      : [];
      
    if (!specs.includes(specString)) {
      specs.push(specString);
      await db.update(teachers)
        .set({ specialization: specs.join(", ") })
        .where(eq(teachers.id, teacherId));
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error adding specialization to teacher:", error);
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

    if (teacherId) {
      const subjectRecord = await db.query.subjects.findFirst({
        where: eq(subjects.id, subjectId),
        with: { class: true }
      });
      if (subjectRecord && subjectRecord.class) {
        await addSpecializationToTeacher(teacherId, subjectRecord.class.name, subjectRecord.name);
      }
    }

    revalidatePath("/office/academy-management/classes/");
    return { success: true };
  } catch (error: any) {
    console.error("Error assigning teacher:", error);
    return { success: false, error: error.message };
  }
}

export async function assignReviewerToSubject(subjectId: number, reviewerId: string | null, reviewerIndex: 1 | 2) {
  try {
    const updateObj = reviewerIndex === 1
      ? { reviewerId1: reviewerId }
      : { reviewerId2: reviewerId };
      
    await db
      .update(subjects)
      .set(updateObj)
      .where(eq(subjects.id, subjectId));

    if (reviewerId) {
      const subjectRecord = await db.query.subjects.findFirst({
        where: eq(subjects.id, subjectId),
        with: { class: true }
      });
      if (subjectRecord && subjectRecord.class) {
        await addSpecializationToTeacher(reviewerId, subjectRecord.class.name, subjectRecord.name);
      }
    }

    revalidatePath("/office/academy-management/classes/");
    return { success: true };
  } catch (error: any) {
    console.error(`Error assigning reviewer ${reviewerIndex}:`, error);
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
