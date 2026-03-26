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

    // Extract the base64 data from the data URL
    // Format is typically "data:application/pdf;base64,JVBER..."
    const matches = pdfRecord.fileUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return new NextResponse("Invalid PDF format in database", { status: 500 });
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
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
