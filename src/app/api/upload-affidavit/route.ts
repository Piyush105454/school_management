import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studentDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 413 });
    }

    // Convert file to base64 for storage in DB
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Check base64 size (should be ~33% larger than original)
    if (dataUrl.length > 6.5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "File too large after encoding. Try a smaller file or compress it first." 
      }, { status: 413 });
    }

    // Update database (Upsert)
    await db.insert(studentDocuments).values({
      admissionId,
      affidavit: dataUrl,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: studentDocuments.admissionId,
      set: {
        affidavit: dataUrl,
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
