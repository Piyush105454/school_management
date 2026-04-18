"use server";

import { db } from "@/db";
import { homeVisits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadToS3, getSignedDownloadUrl } from "@/lib/s3-service";

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

    if (data) {
      if (data.visitImage) data.visitImage = await getSignedDownloadUrl(data.visitImage) || data.visitImage;
      if (data.homePhoto) data.homePhoto = await getSignedDownloadUrl(data.homePhoto) || data.homePhoto;
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateHomeVisitStatus(
  admissionId: string, 
  status: "PASS" | "FAIL" | "PENDING", 
  remarks?: string, 
  visitImage?: string,
  homePhoto?: string
) {
  try {
    let finalVisitImage = visitImage;
    let finalHomePhoto = homePhoto;

    if (visitImage && visitImage.startsWith("data:")) {
      finalVisitImage = await uploadToS3(visitImage, {
        fileName: "visit_image",
        admissionId,
        category: "homevisits"
      }) || undefined;
    }

    if (homePhoto && homePhoto.startsWith("data:")) {
      finalHomePhoto = await uploadToS3(homePhoto, {
        fileName: "home_photo",
        admissionId,
        category: "homevisits"
      }) || undefined;
    }

    const existing = await db.query.homeVisits.findFirst({
      where: eq(homeVisits.admissionId, admissionId),
    });

    if (existing) {
      await db.update(homeVisits)
        .set({
          status,
          remarks,
          visitImage: finalVisitImage,
          homePhoto: finalHomePhoto,
          updatedAt: new Date(),
        })
        .where(eq(homeVisits.admissionId, admissionId));
    } else {
      await db.insert(homeVisits).values({
        admissionId,
        status,
        remarks,
        visitImage: finalVisitImage,
        homePhoto: finalHomePhoto,
      });
    }




    revalidatePath("/office/home-visits", "page");
    revalidatePath("/student/dashboard", "page");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
