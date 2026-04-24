"use server";

import { db } from "@/db";
import { entranceTests, studentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadToS3, getSignedDownloadUrl, deleteFromS3 } from "@/lib/s3-service";
import { getS3UploadContext } from "./admissionActions";

function sanitizeTestData(data: any) {
  if (!data) return data;
  const sanitized = { ...data };
  
  const numericFields = ["marksObtained", "graceMarks", "totalMarks"];
  numericFields.forEach(field => {
    if (sanitized[field] === "" || sanitized[field] === undefined || sanitized[field] === null) {
      sanitized[field] = null;
    } else if (typeof sanitized[field] === "string") {
      const val = parseFloat(sanitized[field]);
      sanitized[field] = isNaN(val) ? null : val;
    }
  });

  return sanitized;
}

export async function scheduleEntranceTest(admissionId: string, data: any) {
  try {
    const existing = await db.query.entranceTests.findFirst({
      where: eq(entranceTests.admissionId, admissionId),
    });

    const sanitizedData = sanitizeTestData(data);

    if (existing) {
      await db.update(entranceTests)
        .set({
          ...sanitizedData,
          status: sanitizedData.status || "PENDING",
          updatedAt: new Date(),
        })
        .where(eq(entranceTests.admissionId, admissionId));
    } else {
      await db.insert(entranceTests).values({
        admissionId,
        ...sanitizedData,
        status: sanitizedData.status || "PENDING",
      });
    }

    revalidatePath("/office/entrance-tests", "page");
    revalidatePath("/student/entrance-test", "page");
    return { success: true };
  } catch (error: any) {
    console.error("scheduleEntranceTest error:", error);
    return { success: false, error: error.message };
  }
}

export async function getEntranceTestData(admissionId: string) {
  try {
    const data = await db.query.entranceTests.findFirst({
      where: eq(entranceTests.admissionId, admissionId),
    });

    if (data && data.reportLink) {
      data.reportLink = await getSignedDownloadUrl(data.reportLink) || data.reportLink;
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTestResult(
  admissionId: string, 
  remarks?: string,
  marksObtained?: string | number,
  graceMarks?: string | number,
  reportLink?: string
) {
  try {
    let finalReportLink = reportLink;

    if (reportLink && reportLink.startsWith("data:")) {
      const s3Context = await getS3UploadContext(admissionId);
      finalReportLink = await uploadToS3(reportLink, {
        fileName: "test_report",
        admissionId,
        ...s3Context,
        category: "entrance-tests"
      }) || undefined;
    }

    const marks = marksObtained ? parseFloat(marksObtained.toString()) : 0;
    const grace = graceMarks ? parseFloat(graceMarks.toString()) : 0;
    const totalGained = marks + grace;
    
    // Auto-calculate status based on 33% threshold (Total Marks Fixed at 100)
    const status = totalGained >= 33 ? "PASS" : "FAIL";

    // Manual Cleanup: Check if the user is explicitly removing the file
    // If reportLink comes in as empty/null, but an old one existed, delete it from S3.
    const existing = await db.query.entranceTests.findFirst({
      where: eq(entranceTests.admissionId, admissionId),
    });

    if (existing?.reportLink && (reportLink === null || reportLink === "")) {
      await deleteFromS3(existing.reportLink);
    }

    await db.update(entranceTests)
      .set({
        status,
        remarks,
        marksObtained: marks,
        graceMarks: grace,
        totalMarks: 100,
        reportLink: finalReportLink || null,
        resultDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(entranceTests.admissionId, admissionId));
    
    if (status === "PASS") {
      await db.update(studentProfiles)
        .set({ admissionStep: 12 })
        .where(eq(studentProfiles.admissionMetaId, admissionId));
    }


    revalidatePath("/office/entrance-tests", "page");
    revalidatePath("/student/entrance-test", "page");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEntranceTestAdminRemarks(admissionId: string, remarks: string) {
  try {
    await db.update(entranceTests)
      .set({
        adminRemarks: remarks,
        status: "PENDING", // Force status back to PENDING for corrective action
        updatedAt: new Date(),
      })
      .where(eq(entranceTests.admissionId, admissionId));

    revalidatePath("/office/admissions/[id]", "page");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncEntranceTestField(admissionId: string, field: string, value: string | null) {
  try {
    const existing = await db.query.entranceTests.findFirst({
      where: eq(entranceTests.admissionId, admissionId),
    });

    if (field === "test_report" || field === "reportLink") {
      if (existing) {
        if (existing.reportLink && existing.reportLink !== value) {
          await deleteFromS3(existing.reportLink);
        }
        await db.update(entranceTests)
          .set({ reportLink: value, updatedAt: new Date() })
          .where(eq(entranceTests.admissionId, admissionId));
      } else if (value) {
        await db.insert(entranceTests).values({ admissionId, reportLink: value });
      }
    }

    revalidatePath("/office/entrance-tests", "page");
    revalidatePath("/student/entrance-test", "page");
    revalidatePath("/office/admissions/[id]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("syncEntranceTestField error:", error);
    return { success: false, error: error.message };
  }
}
