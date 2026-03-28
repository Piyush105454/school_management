"use server";

import { db } from "@/db";
import { chapterPdfs, units, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function uploadChapterPdf(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const chapterIdStr = formData.get("chapterId") as string;
    const uploadedBy = formData.get("uploadedBy") as string;

    if (!file || !chapterIdStr) {
      return { success: false, error: "Missing file or chapter ID" };
    }

    const chapterId = parseInt(chapterIdStr, 10);

    // Convert file to base64 for storage
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Update database (check if already exists)
    const existing = await db.query.chapterPdfs.findFirst({
      where: eq(chapterPdfs.chapterId, chapterId),
    });

    if (existing) {
      await db.update(chapterPdfs)
        .set({
          fileUrl: dataUrl,
          uploadedBy: uploadedBy || "Teacher",
          uploadedAt: new Date(),
        })
        .where(eq(chapterPdfs.chapterId, chapterId));
    } else {
      await db.insert(chapterPdfs).values({
        chapterId,
        fileUrl: dataUrl,
        uploadedBy: uploadedBy || "Teacher",
      });
    }

    // Revalidate paths to update UI
    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("uploadChapterPdf error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteChapterPdf(chapterId: number) {
  try {
    await db.delete(chapterPdfs).where(eq(chapterPdfs.chapterId, chapterId));
    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createUnit(data: { subjectId: number; name: string; orderNo: number }) {
  try {
    await db.insert(units).values({
      subjectId: data.subjectId,
      name: data.name,
      orderNo: data.orderNo,
    });
    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("createUnit error:", error);
    return { success: false, error: error.message };
  }
}

export async function createChapter(data: { 
  unitId: number; 
  name: string; 
  chapterNo: number; 
  pageStart: number; 
  pageEnd: number; 
  orderNo: number;
  pdfUrl?: string;
}) {
  try {
    const [newChapter] = await db.insert(chapters).values({
      unitId: data.unitId,
      name: data.name,
      chapterNo: data.chapterNo,
      pageStart: data.pageStart,
      pageEnd: data.pageEnd,
      orderNo: data.orderNo,
    }).returning({ id: chapters.id });

    if (data.pdfUrl) {
      await db.insert(chapterPdfs).values({
        chapterId: newChapter.id,
        fileUrl: data.pdfUrl,
        uploadedBy: "Teacher",
      });
    }
    revalidatePath("/office/academy-management/classes/[className]/subjects/[subjectId]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("createChapter error:", error);
    return { success: false, error: error.message };
  }
}
