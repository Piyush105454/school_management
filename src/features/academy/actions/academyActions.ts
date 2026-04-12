"use server";

import { db } from "@/db";
import { classes, subjects, units, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- CLASS ACTIONS ---

export async function deleteClass(className: string) {
  try {
    // We expect the class name to match exactly as it is in the classes table
    const dbClassName = ["Nursery", "LKG", "UKG"].includes(className)
      ? className
      : className.startsWith("Class ") ? className : `Class ${className}`;

    const classRecord = await db.query.classes.findFirst({
      where: eq(classes.name, dbClassName),
    });

    if (!classRecord) {
      return { success: false, error: "Class not found in database." };
    }

    await db.delete(classes).where(eq(classes.id, classRecord.id));
    
    revalidatePath("/office/academy-management/classes");
    return { success: true };
  } catch (error: any) {
    console.error("deleteClass error:", error);
    return { success: false, error: error.message };
  }
}

// --- UNIT ACTIONS ---

export async function updateUnit(unitId: number, data: { name: string }) {
  try {
    await db.update(units)
      .set({ name: data.name })
      .where(eq(units.id, unitId));
    
    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("updateUnit error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteUnit(unitId: number) {
  try {
    await db.delete(units).where(eq(units.id, unitId));
    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("deleteUnit error:", error);
    return { success: false, error: error.message };
  }
}

// --- CHAPTER ACTIONS ---

export async function updateChapter(chapterId: number, data: { 
  name: string; 
  chapterNo: number; 
  pageStart: number; 
  pageEnd: number;
}) {
  try {
    await db.update(chapters)
      .set({ 
        name: data.name,
        chapterNo: data.chapterNo,
        pageStart: data.pageStart,
        pageEnd: data.pageEnd
      })
      .where(eq(chapters.id, chapterId));
    
    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("updateChapter error:", error);
    return { success: false, error: error.message };
  }
}

export async function moveChapter(chapterId: number, newUnitId: number) {
  try {
    await db.update(chapters)
      .set({ unitId: newUnitId })
      .where(eq(chapters.id, chapterId));
    
    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("moveChapter error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteChapter(chapterId: number) {
  try {
    await db.delete(chapters).where(eq(chapters.id, chapterId));
    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("deleteChapter error:", error);
    return { success: false, error: error.message };
  }
}

// --- SUBJECT ACTIONS (Adding updateSubject) ---

export async function updateSubject(subjectId: number, data: { name: string; medium: string }) {
  try {
    await db.update(subjects)
      .set({ 
        name: data.name,
        medium: data.medium
      })
      .where(eq(subjects.id, subjectId));
    
    revalidatePath("/office/academy-management/classes/[className]/subjects", "page");
    return { success: true };
  } catch (error: any) {
    console.error("updateSubject error:", error);
    return { success: false, error: error.message };
  }
}
