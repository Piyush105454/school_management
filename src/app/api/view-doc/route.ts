import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDocumentContent } from "@/features/admissions/actions/admissionActions";
import { getAffidavitContent } from "@/features/admissions/actions/documentActions";
import { getHomeVisitData } from "@/features/admissions/actions/homeVisitActions";
import { getEntranceTestData } from "@/features/admissions/actions/testActions";

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
      secureUrl = res.success ? (res.data as any)?.[field] : null;
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

    // If it's still a data URL (legacy), we return it differently or it might be too large
    if (secureUrl.startsWith("data:")) {
        // Redirect to a helper or handle base64
        // For simplicity, we can let the legacy ones open as they were or handle them here
        return NextResponse.redirect(secureUrl);
    }

    // Fetch from S3 and stream back to browser
    const response = await fetch(secureUrl);
    if (!response.ok) throw new Error("Failed to fetch from S3");

    const blob = await response.blob();
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${field}"`);
    headers.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    return new NextResponse(blob, { headers });

  } catch (error: any) {
    console.error("View Doc Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
