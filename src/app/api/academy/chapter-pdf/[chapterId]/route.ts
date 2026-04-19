import { db } from "@/db";
import { chapterPdfs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const resolvedParams = await params;
    const chapterId = parseInt(resolvedParams.chapterId, 10);

    if (isNaN(chapterId)) {
      return new NextResponse("Invalid chapter ID", { status: 400 });
    }

    const pdfRecord = await db.query.chapterPdfs.findFirst({
      where: eq(chapterPdfs.chapterId, chapterId),
    });

    if (!pdfRecord || !pdfRecord.fileUrl) {
      return new NextResponse("PDF not found", { status: 404 });
    }

    let buffer: Buffer;
    let contentType: string;

    if (pdfRecord.fileUrl.startsWith("http")) {
      // Fetch from S3/External URL
      const response = await fetch(pdfRecord.fileUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF from storage");
      
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = response.headers.get("Content-Type") || "application/pdf";
    } else {
      // Extract the base64 data from the data URL (Legacy support)
      const matches = pdfRecord.fileUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        return new NextResponse("Invalid PDF format in database", { status: 500 });
      }

      contentType = matches[1];
      const base64Data = matches[2];
      buffer = Buffer.from(base64Data, 'base64');
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="chapter-${chapterId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error serving Chapter PDF:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
