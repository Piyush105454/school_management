"use server";

import { db } from "@/db";
import { chapterDivisions, chapters } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getChapterDivisions(chapterId: number) {
  try {
    const divisions = await db
      .select()
      .from(chapterDivisions)
      .where(eq(chapterDivisions.chapterId, chapterId))
      .orderBy(chapterDivisions.orderNo);
    return divisions;
  } catch (error) {
    console.error("Error fetching chapter divisions:", error);
    throw error;
  }
}

export async function createChapterDivision(
  chapterId: number,
  pageStart: number,
  pageEnd: number,
  orderNo: number
) {
  try {
    const result = await db
      .insert(chapterDivisions)
      .values({
        chapterId,
        pageStart,
        pageEnd,
        orderNo,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Error creating chapter division:", error);
    throw error;
  }
}

export async function updateChapterDivision(
  divisionId: number,
  pageStart: number,
  pageEnd: number,
  orderNo: number
) {
  try {
    const result = await db
      .update(chapterDivisions)
      .set({
        pageStart,
        pageEnd,
        orderNo,
        updatedAt: new Date(),
      })
      .where(eq(chapterDivisions.id, divisionId))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Error updating chapter division:", error);
    throw error;
  }
}

export async function deleteChapterDivision(divisionId: number) {
  try {
    await db
      .delete(chapterDivisions)
      .where(eq(chapterDivisions.id, divisionId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting chapter division:", error);
    throw error;
  }
}

export async function deleteAllChapterDivisions(chapterId: number) {
  try {
    await db
      .delete(chapterDivisions)
      .where(eq(chapterDivisions.chapterId, chapterId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting all chapter divisions:", error);
    throw error;
  }
}
