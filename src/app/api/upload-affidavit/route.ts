import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studentDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadToS3 } from "@/lib/s3-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const admissionId = formData.get("admissionId") as string;

    if (!file || !admissionId) {
      return NextResponse.json({ error: "Missing file or admission ID" }, { status: 400 });
    }

    // Check file size (1MB limit for affidavits)
    if (file.size > 1024 * 1024) {
      return NextResponse.json({ error: "Affidavit exceeds 1MB limit. Please compress it." }, { status: 413 });
    }

    // Convert file to base64 for S3 helper
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Upload to S3
    const s3Url = await uploadToS3(dataUrl, {
      fileName: "affidavit",
      admissionId,
      category: "studentdocuments"
    });

    if (!s3Url) throw new Error("Failed to upload to S3");

    // Update database (Upsert) - Save the S3 URL
    await db.insert(studentDocuments).values({
      admissionId,
      affidavit: s3Url,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: studentDocuments.admissionId,
      set: {
        affidavit: s3Url,
        updatedAt: new Date(),
      }
    });

    // Revalidate paths to sync UI
    revalidatePath("/student/admission", "page");
    revalidatePath("/office/admissions/[id]", "page");
    revalidatePath("/office/document-verification", "page");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    
    // Provide specific error messages
    if (error.message?.includes("ECONNREFUSED")) {
      return NextResponse.json({ 
        error: "Database connection failed. Please try again." 
      }, { status: 503 });
    }
    
    if (error.message?.includes("timeout")) {
      return NextResponse.json({ 
        error: "Request timeout. File may be too large." 
      }, { status: 504 });
    }

    return NextResponse.json({ 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
