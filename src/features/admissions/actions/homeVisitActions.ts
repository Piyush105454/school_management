"use server";

import { db } from "@/db";
import { homeVisits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function scheduleHomeVisit(admissionId: string, data: any) {
  try {
    const existing = await db.query.homeVisits.findFirst({
      where: eq(homeVisits.admissionId, admissionId),
    });

    if (existing) {
      await db.update(homeVisits)
        .set({
          ...data,
          status: data.status || "PENDING",
          updatedAt: new Date(),
        })
        .where(eq(homeVisits.admissionId, admissionId));
    } else {
      await db.insert(homeVisits).values({
        admissionId,
        ...data,
        status: data.status || "PENDING",
      });
    }

    revalidatePath("/office/home-visits", "page");
    revalidatePath("/student/dashboard", "page");
    return { success: true };
  } catch (error: any) {
    console.error("scheduleHomeVisit error:", error);
    return { success: false, error: error.message };
  }
}

export async function getHomeVisitData(admissionId: string) {
  try {
    const data = await db.query.homeVisits.findFirst({
      where: eq(homeVisits.admissionId, admissionId),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateHomeVisitStatus(admissionId: string, status: "PASS" | "FAIL" | "PENDING", remarks?: string, visitImage?: string) {
  try {
    const existing = await db.query.homeVisits.findFirst({
      where: eq(homeVisits.admissionId, admissionId),
    });

    if (existing) {
      await db.update(homeVisits)
        .set({
          status,
          remarks,
          visitImage,
          updatedAt: new Date(),
        })
        .where(eq(homeVisits.admissionId, admissionId));
    } else {
      await db.insert(homeVisits).values({
        admissionId,
        status,
        remarks,
        visitImage,
      });
    }



    revalidatePath("/office/home-visits", "page");
    revalidatePath("/student/dashboard", "page");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
