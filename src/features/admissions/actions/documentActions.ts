"use server";

import { db } from "@/db";
import { studentDocuments, documentChecklists, studentProfiles, admissionMeta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadToS3, getSignedDownloadUrl, deleteFromS3 } from "@/lib/s3-service";
import { getS3UploadContext } from "./admissionActions";

export async function uploadAffidavit(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const admissionId = formData.get("admissionId") as string;

    if (!file || !admissionId) {
      return { success: false, error: "Missing file or admission ID" };
    }

    // Fetch S3 path metadata (Entry Number and Class)
    const s3Context = await getS3UploadContext(admissionId);

    // Convert file to base64 for storage (needed for our current S3 helper)
    const buffer = await file.arrayBuffer();
    const base64Content = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64Content}`;

    // Upload to S3 instead of local state
    const s3Url = await uploadToS3(dataUrl, {
      fileName: "affidavit",
      admissionId,
      ...s3Context,
      category: "student-documents"
    });

    if (!s3Url) throw new Error("Failed to upload to S3");

    // Update database
    const existing = await db.query.studentDocuments.findFirst({
      where: eq(studentDocuments.admissionId, admissionId),
    });

    if (existing) {
      await db.update(studentDocuments)
        .set({
          affidavit: s3Url,
          updatedAt: new Date(),
        })
        .where(eq(studentDocuments.admissionId, admissionId));
    } else {
      await db.insert(studentDocuments).values({
        admissionId,
        affidavit: s3Url,
      });
    }

    revalidatePath("/student/admission", "page");
    revalidatePath("/office/admissions/[id]", "page");
    revalidatePath("/office/document-verification", "page");
    return { success: true };
  } catch (error: any) {
    console.error("uploadAffidavit error:", error);
    return { success: false, error: error.message };
  }
}

export async function removeAffidavit(admissionId: string) {
  try {
    // 1. Fetch current affidavit URL
    const doc = await db.query.studentDocuments.findFirst({
      where: eq(studentDocuments.admissionId, admissionId),
      columns: { affidavit: true }
    });

    // 2. Perform hard delete if exists
    if (doc?.affidavit) {
      await deleteFromS3(doc.affidavit);
    }

    // 3. Clear DB
    await db.update(studentDocuments)
      .set({
        affidavit: null,
        updatedAt: new Date(),
      })
      .where(eq(studentDocuments.admissionId, admissionId));

    revalidatePath("/student/admission", "page");
    revalidatePath("/office/admissions/[id]", "page");
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
    await db.transaction(async (tx) => {
      await tx.insert(documentChecklists).values({
        admissionId,
        parentAffidavit: "SUBMITTED",
        verifiedAt: new Date(),
      }).onConflictDoUpdate({
        target: documentChecklists.admissionId,
        set: { 
          parentAffidavit: "SUBMITTED",
          verifiedAt: new Date(),
        }
      });

      // 3. Move student profile to Step 10 (Awaiting Verification)
      await tx.update(studentProfiles)
        .set({ admissionStep: 10 })
        .where(eq(studentProfiles.admissionMetaId, admissionId));

      // 4. CLEAR office remarks now that student has submitted corrections
      await tx.update(admissionMeta)
        .set({ officeRemarks: null, updatedAt: new Date() })
        .where(eq(admissionMeta.id, admissionId));
    });

    revalidatePath("/student/admission");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/document-verification");
    revalidatePath("/office/admissions/[id]", "page");
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

    const secureUrl = await getSignedDownloadUrl(data[0].affidavit);
    return { success: true, affidavit: secureUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectAffidavit(admissionId: string) {
  try {
    await db.transaction(async (tx) => {
      // 1. Clear the affidavit file
      await tx.update(studentDocuments)
        .set({
          affidavit: null,
          updatedAt: new Date(),
        })
        .where(eq(studentDocuments.admissionId, admissionId));

      // 2. Update checklist status to REJECTED (using upsert)
      await tx.insert(documentChecklists).values({
        admissionId,
        parentAffidavit: "REJECTED" as any,
        verifiedAt: new Date(),
      }).onConflictDoUpdate({
        target: documentChecklists.admissionId,
        set: {
          parentAffidavit: "REJECTED" as any,
          verifiedAt: new Date(),
        }
      });

      // 3. Move student profile back to Step 10
      await tx.update(studentProfiles)
        .set({
          admissionStep: 10,
        })
        .where(eq(studentProfiles.admissionMetaId, admissionId));
    });

    revalidatePath("/student/admission");
    revalidatePath("/office/admissions/[id]", "page");
    revalidatePath("/office/document-verification", "page");
    return { success: true };
  } catch (error: any) {
    console.error("rejectAffidavit error:", error);
    return { success: false, error: error.message };
  }
}
