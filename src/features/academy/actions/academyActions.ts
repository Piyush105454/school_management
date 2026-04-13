"use server";

import { db } from "@/db";
import { classes, subjects, units, chapters, students, studentAttendance, chapterPdfs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- CLASS ACTIONS ---

export async function deleteClass(className: string) {
  try {
    // We expect the class name to match exactly as it is in the classes table
    const dbClassName = ["LKG", "UKG"].includes(className)
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

export async function cleanupAcademicData() {
  try {
    console.log("Starting full academic data cleanup...");
    const allClasses = await db.query.classes.findMany();
    
    const normalizedMap: Record<string, number> = {};
    const toDelete: number[] = [];

    for (const cls of allClasses) {
      let normalized = cls.name.trim();
      
      // Remove nursery immediately
      if (normalized.toLowerCase() === "nursery") {
        toDelete.push(cls.id);
        continue;
      }

      // Aggressive Format (Standardize to "Class X", "LKG", "UKG")
      if (!["LKG", "UKG"].includes(normalized)) {
        const numMatch = normalized.match(/\d+/);
        if (numMatch) {
          normalized = `Class ${numMatch[0]}`;
        }
      }

      if (!normalizedMap[normalized]) {
        normalizedMap[normalized] = cls.id;
        if (cls.name !== normalized) {
          await db.update(classes).set({ name: normalized }).where(eq(classes.id, cls.id));
        }
      } else {
        // Duplicate!
        const targetId = normalizedMap[normalized];
        
        // Update all related tables
        await db.update(subjects).set({ classId: targetId }).where(eq(subjects.classId, cls.id));
        await db.update(students).set({ classId: targetId }).where(eq(students.classId, cls.id));
        await db.update(studentAttendance).set({ classId: targetId }).where(eq(studentAttendance.classId, cls.id));
        
        toDelete.push(cls.id);
      }
    }

    if (toDelete.length > 0) {
      for (const id of toDelete) {
        await db.delete(classes).where(eq(classes.id, id));
      }
    }

    revalidatePath("/office/academy-management/classes");
    return { success: true, removedCount: toDelete.length };
  } catch (error: any) {
    console.error("cleanupAcademicData error:", error);
    return { success: false, error: error.message };
  }
}

// ... [rest of the actions]

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
  pdfUrl?: string;
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
    
    if (data.pdfUrl !== undefined) {
      const existingPdf = await db.query.chapterPdfs.findFirst({
        where: eq(chapterPdfs.chapterId, chapterId),
      });

      if (data.pdfUrl) {
        if (existingPdf) {
          await db.update(chapterPdfs)
            .set({ fileUrl: data.pdfUrl, uploadedBy: "Teacher Update" })
            .where(eq(chapterPdfs.id, existingPdf.id));
        } else {
          await db.insert(chapterPdfs).values({
            chapterId,
            fileUrl: data.pdfUrl,
            uploadedBy: "Teacher Create"
          });
        }
      } else if (existingPdf) {
        // If url is empty but exists in DB, delete it
        await db.delete(chapterPdfs).where(eq(chapterPdfs.id, existingPdf.id));
      }
    }
    
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

export async function updateSubject(subjectId: number, data: { name: string; bookName?: string; medium: string }) {
  try {
    await db.update(subjects)
      .set({ 
        name: data.name,
        bookName: data.bookName,
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

// --- METADATA ACTIONS ---

export async function getAllAcademicMetadata() {
  try {
    // ONE-TIME FIX: Add missing book_name column if it doesn't exist
    await db.execute(sql`ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "book_name" text;`);

    const allClasses = await db.query.classes.findMany({
      orderBy: (classes, { asc }) => [asc(classes.id)],
    });
    const allSubjects = await db.query.subjects.findMany();
    
    return { success: true, classes: allClasses, subjects: allSubjects };
  } catch (error: any) {
    console.error("getAllAcademicMetadata error:", error);
    return { success: false, error: error.message };
  }
}
