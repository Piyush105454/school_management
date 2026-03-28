"use server";

import { db } from "@/db";
import { subjects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createSubject(data: { classId: number; name: string; medium?: string }) {
  try {
    await db.insert(subjects).values({
      classId: data.classId,
      name: data.name,
      medium: data.medium || "English/Hindi",
    });
    
    // We revalidate the subjects page for this class
    // Since className is in the URL, we might need to handle it or revalidate the layout
    revalidatePath("/office/academy-management/classes/[className]/subjects", "page");
    return { success: true };
  } catch (error: any) {
    console.error("createSubject error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSubject(subjectId: number) {
  try {
    await db.delete(subjects).where(eq(subjects.id, subjectId));
    revalidatePath("/office/academy-management/classes/[className]/subjects", "page");
    return { success: true };
  } catch (error: any) {
    console.error("deleteSubject error:", error);
    return { success: false, error: error.message };
  }
}
