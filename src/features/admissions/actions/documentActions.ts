"use server";

import { db } from "@/db";
import { studentDocuments, documentChecklists } from "@/db/schema";
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

export async function removeAffidavit(admissionId: string) {
  try {
    await db.update(studentDocuments)
      .set({
        affidavit: null,
        updatedAt: new Date(),
      })
      .where(eq(studentDocuments.admissionId, admissionId));

    revalidatePath("/student/document-verification", "page");
    revalidatePath("/office/document-verification", "page");
    return { success: true };
  } catch (error: any) {
    console.error("removeAffidavit error:", error);
    return { success: false, error: error.message };
  }
}

export async function submitAffidavit(admissionId: string) {
  try {
    // Update checklist status to SUBMITTED
    await db.update(documentChecklists)
      .set({
        parentAffidavit: "SUBMITTED",
        verifiedAt: new Date(),
      })
      .where(eq(documentChecklists.admissionId, admissionId));

    revalidatePath("/student/document-verification", "page");
    revalidatePath("/office/document-verification", "page");
    return { success: true };
  } catch (error: any) {
    console.error("submitAffidavit error:", error);
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

export async function getAffidavitContent(admissionId: string) {
  try {
    const data = await db.select({
      affidavit: studentDocuments.affidavit
    })
    .from(studentDocuments)
    .where(eq(studentDocuments.admissionId, admissionId))
    .limit(1);

    if (!data.length || !data[0].affidavit) {
      return { success: false, error: "Document not found" };
    }

    return { success: true, affidavit: data[0].affidavit };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
