"use server";

import { db } from "@/db";
import { entranceTests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function scheduleEntranceTest(admissionId: string, data: any) {
  try {
    const existing = await db.query.entranceTests.findFirst({
      where: eq(entranceTests.admissionId, admissionId),
    });

    if (existing) {
      await db.update(entranceTests)
        .set({
          ...data,
          status: data.status || "PENDING",
          updatedAt: new Date(),
        })
        .where(eq(entranceTests.admissionId, admissionId));
    } else {
      await db.insert(entranceTests).values({
        admissionId,
        ...data,
        status: data.status || "PENDING",
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
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTestResult(admissionId: string, status: "PASS" | "FAIL", remarks?: string) {
  try {
    await db.update(entranceTests)
      .set({
        status,
        remarks,
        resultDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(entranceTests.admissionId, admissionId));

    revalidatePath("/office/entrance-tests", "page");
    revalidatePath("/student/entrance-test", "page");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
