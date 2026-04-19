"use server";

import { db } from "@/db";
import { chapterPdfs, units, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadToS3 } from "@/lib/s3-service";

export async function uploadChapterPdf(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    const fileUrl = formData.get("fileUrl") as string | null;
    const chapterIdStr = formData.get("chapterId") as string;
    const uploadedBy = formData.get("uploadedBy") as string;

    const chapterId = parseInt(chapterIdStr);
    if (!chapterId || (!file && !fileUrl)) {
      return { success: false, error: "Missing file/url or chapter ID" };
    }

    let dataUrl = fileUrl || "";

    if (file) {
      // Convert file to base64 for S3 helper
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      dataUrl = `data:${file.type};base64,${base64}`;
    }

    // Upload to S3 if it's a base64 string (handles external URLs automatically)
    const finalUrl = await uploadToS3(dataUrl, {
      fileName: `chapter_${chapterId}`,
      category: "academy/chapters",
      admissionId: chapterId.toString() // Use chapterId as the reference ID
    });

    // Update database (check if already exists)
    const existing = await db.query.chapterPdfs.findFirst({
      where: eq(chapterPdfs.chapterId, chapterId),
    });

    if (existing) {
      await db.update(chapterPdfs)
        .set({
          fileUrl: finalUrl,
          uploadedBy: uploadedBy || "Teacher",
          uploadedAt: new Date(),
        })
        .where(eq(chapterPdfs.chapterId, chapterId));
    } else {
      await db.insert(chapterPdfs).values({
        chapterId,
        fileUrl: finalUrl,
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
