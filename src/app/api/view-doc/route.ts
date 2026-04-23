import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDocumentContent } from "@/features/admissions/actions/admissionActions";
import { getAffidavitContent } from "@/features/admissions/actions/documentActions";
import { getHomeVisitData } from "@/features/admissions/actions/homeVisitActions";
import { getEntranceTestData } from "@/features/admissions/actions/testActions";
import { db } from "@/db";
import { admissionMeta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSignedDownloadUrl } from "@/lib/s3-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const field = searchParams.get("field");
    const type = searchParams.get("type") || "standard"; // standard, affidavit, visit, test

    if (!id || !field) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    let secureUrl: string | null | undefined = null;

    // Fetch the signed URL based on type
    if (type === "affidavit") {
      const res = await getAffidavitContent(id);
      secureUrl = res.success ? res.affidavit : null;
    } else if (type === "visit") {
      const res = await getHomeVisitData(id);
      if (res.success && res.data) {
          const data = res.data as any;
          if (field === "visit_report" || field === "visitImage") {
              secureUrl = data.visitImage;
          } else if (field?.startsWith("home_photo_")) {
              const idx = parseInt(field.split("_").pop() || "0");
              try {
                  const photos = JSON.parse(data.homePhoto || "[]");
                  secureUrl = Array.isArray(photos) ? photos[idx] : data.homePhoto;
              } catch (e) {
                  secureUrl = data.homePhoto;
              }
          } else {
              secureUrl = data[field as string];
          }
      }
    } else if (type === "test") {
      const res = await getEntranceTestData(id);
      secureUrl = res.success ? (res.data as any)?.[field] : null;
    } else {
      const res = await getDocumentContent(id, field);
      secureUrl = res.success ? res.content : null;
    }

    if (!secureUrl) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // If it's a data URL (inline base64), decode and serve directly as a file.
    // Redirecting to long data URLs causes ERR_UNSAFE_REDIRECT in many browsers.
    if (secureUrl.startsWith("data:")) {
      const mimeMatch = secureUrl.match(/^data:(.*);base64,(.*)$/);
      if (mimeMatch) {
        const contentType = mimeMatch[1];
        const base64String = mimeMatch[2];
        const buffer = Buffer.from(base64String, "base64");
        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Content-Disposition", `inline; filename="${field}"`);
        headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
        return new NextResponse(buffer, { headers });
      }
    }

    // Fetch from S3 and stream back to browser
    let response = await fetch(secureUrl, { cache: 'no-store' });
    
    // SMART FALLBACK: If 404, try the corrected path (legacy to standard migration)
    if (response.status === 404 && secureUrl.includes("studentdocuments")) {
      console.log(`[Proxy] Initial fetch returned 404 for legacy path. Attempting smart fallback for ID: ${id}`);
      
      const meta = await db.query.admissionMeta.findFirst({
        where: eq(admissionMeta.id, id),
        columns: { entryNumber: true }
      });

      if (meta?.entryNumber) {
        // Construct standard path: student-documents/ENTRY_NUMBER/FIELD_ID.ext
        // We extract the filename and extension from the old failing URL
        const oldUrl = new URL(secureUrl);
        const fileNameWithExt = oldUrl.pathname.split('/').pop() || "";
        
        // Correct the category and folder
        const fallbackKey = `dps/2026-27/student-documents/${meta.entryNumber}/${fileNameWithExt}`;
        const fallbackUrl = await getSignedDownloadUrl(fallbackKey);
        
        if (fallbackUrl) {
           console.log(`[Proxy] Trying fallback URL: ${fallbackUrl.split('?')[0]}`);
           const secondChance = await fetch(fallbackUrl, { cache: 'no-store' });
           if (secondChance.ok) {
             response = secondChance;
           }
        }
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`S3 Fetch Failed: Status ${response.status} - ${response.statusText} for URL: ${secureUrl}`);
      
      return new NextResponse(
        JSON.stringify({ 
          error: response.status === 404 ? "Document Not Found in S3" : `S3 Access Error (${response.status})`, 
          details: response.statusText,
          key_requested: secureUrl.split('?')[0].split('/').slice(-3).join('/')
        }),
        { 
          status: response.status, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${field}"`);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

    return new NextResponse(blob, { headers });

  } catch (error: any) {
    console.error("View Doc Proxy Error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
