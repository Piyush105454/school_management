"use server";

import { db } from "@/db";
import { homeVisits, studentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadToS3, getSignedDownloadUrl, deleteFromS3 } from "@/lib/s3-service";
import { getS3UploadContext } from "./admissionActions";

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
      if (data.homePhoto) {
        try {
          const photos = JSON.parse(data.homePhoto);
          if (Array.isArray(photos)) {
            const signedPhotos = await Promise.all(
              photos.map(async (url: string) => await getSignedDownloadUrl(url) || url)
            );
            data.homePhoto = JSON.stringify(signedPhotos);
          }
        } catch (e) {
          // If not JSON, try signing it as a single URL
          data.homePhoto = await getSignedDownloadUrl(data.homePhoto) || data.homePhoto;
        }
      }
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

    if (visitImage && (visitImage.startsWith("data:") || homePhoto?.startsWith("data:"))) {
      const s3Context = await getS3UploadContext(admissionId);
      
      if (visitImage && visitImage.startsWith("data:")) {
        finalVisitImage = await uploadToS3(visitImage, {
          fileName: "visit_image",
          admissionId,
          ...s3Context,
          category: "home-visits"
        }) || undefined;
      }

      if (homePhoto && homePhoto.startsWith("data:")) {
        finalHomePhoto = await uploadToS3(homePhoto, {
          fileName: "home_photo",
          admissionId,
          ...s3Context,
          category: "home-visits"
        }) || undefined;
      }
    }

    const existing = await db.query.homeVisits.findFirst({
      where: eq(homeVisits.admissionId, admissionId),
    });

    // Manual Cleanup Logic (Only delete if explicitly removed, not just replaced)
    if (existing) {
      if (existing.visitImage && (visitImage === null || visitImage === "")) {
        await deleteFromS3(existing.visitImage);
      }
      if (existing.homePhoto && (homePhoto === null || homePhoto === "" || homePhoto === "[]")) {
        try {
          const oldPhotos = JSON.parse(existing.homePhoto);
          if (Array.isArray(oldPhotos)) {
            await Promise.all(oldPhotos.map(p => deleteFromS3(p)));
          }
        } catch (e) {
          await deleteFromS3(existing.homePhoto);
        }
      }
    }

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
    
    if (status === "PASS") {
      await db.update(studentProfiles)
        .set({ admissionStep: 13 })
        .where(eq(studentProfiles.admissionMetaId, admissionId));
    }




    revalidatePath("/office/home-visits", "page");
    revalidatePath("/student/dashboard", "page");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncHomeVisitField(admissionId: string, field: string, value: string | null) {
  try {
    const existing = await db.query.homeVisits.findFirst({
      where: eq(homeVisits.admissionId, admissionId),
    });

    if (field === "visitImage" || field === "visit_report") {
      const dbField = "visitImage";
      if (existing) {
        // Cleanup old file from S3 if it's being removed or replaced
        if (existing.visitImage && existing.visitImage !== value) {
          await deleteFromS3(existing.visitImage);
        }
        await db.update(homeVisits).set({ [dbField]: value, updatedAt: new Date() }).where(eq(homeVisits.admissionId, admissionId));
      } else if (value) {
        await db.insert(homeVisits).values({ admissionId, [dbField]: value });
      }
    } else if (field.startsWith("home_photo_")) {
      const idx = parseInt(field.split("_").pop() || "0");
      let photos: string[] = [];
      try {
        photos = existing?.homePhoto ? JSON.parse(existing.homePhoto) : [];
      } catch (e) {
        photos = existing?.homePhoto ? [existing.homePhoto] : [];
      }
      if (!Array.isArray(photos)) photos = [];
      
      if (value === null) {
        // Cleanup from S3
        const photoToDelete = photos[idx];
        if (photoToDelete) await deleteFromS3(photoToDelete);
        photos.splice(idx, 1);
      } else {
        // Cleanup old photo if replacing
        const photoToDelete = photos[idx];
        if (photoToDelete && photoToDelete !== value) await deleteFromS3(photoToDelete);
        photos[idx] = value;
      }
      
      const photoStr = JSON.stringify(photos);
      if (existing) {
        await db.update(homeVisits).set({ homePhoto: photoStr, updatedAt: new Date() }).where(eq(homeVisits.admissionId, admissionId));
      } else {
        await db.insert(homeVisits).values({ admissionId, homePhoto: photoStr });
      }
    }

    revalidatePath("/office/home-visits", "page");
    revalidatePath("/student/dashboard", "page");
    revalidatePath("/office/admissions/[id]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("syncHomeVisitField error:", error);
    return { success: false, error: error.message };
  }
}


export async function updateHomeVisitAdminRemarks(admissionId: string, remarks: string) {
  try {
    await db.update(homeVisits)
      .set({
        adminRemarks: remarks,
        status: "PENDING", // Force status back to PENDING for corrective action
        updatedAt: new Date(),
      })
      .where(eq(homeVisits.admissionId, admissionId));

    revalidatePath("/office/home-visits", "page");
    revalidatePath("/student/dashboard", "page");
    revalidatePath("/office/admissions/[id]", "page");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
