"use server";

import { db } from "@/db";
import { studentDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function uploadAffidavit(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const admissionId = formData.get("admissionId") as string;

    if (!file || !admissionId) {
      return { success: false, error: "Missing file or admission ID" };
    }

    // Convert file to base64 for storage
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Update database
    const existing = await db.query.studentDocuments.findFirst({
      where: eq(studentDocuments.admissionId, admissionId),
    });

    if (existing) {
      await db.update(studentDocuments)
        .set({
          affidavit: dataUrl,
          updatedAt: new Date(),
        })
        .where(eq(studentDocuments.admissionId, admissionId));
    } else {
      await db.insert(studentDocuments).values({
        admissionId,
        affidavit: dataUrl,
      });
    }

    revalidatePath("/student/document-verification", "page");
    revalidatePath("/office/document-verification", "page");
    return { success: true };
  } catch (error: any) {
    console.error("uploadAffidavit error:", error);
    return { success: false, error: error.message };
  }
}

export async function getDocumentData(admissionId: string) {
  try {
    const data = await db.query.studentDocuments.findFirst({
      where: eq(studentDocuments.admissionId, admissionId),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
