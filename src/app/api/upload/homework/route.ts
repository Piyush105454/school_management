import { NextRequest, NextResponse } from "next/server";
import { uploadFileToS3 } from "@/lib/s3-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const rollNumber = formData.get("rollNumber") as string || "unknown";
    const date = formData.get("date") as string || new Date().toISOString().split('T')[0];

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Construct path: homework/{rollNumber}/{date}/{filename}
    // uploadFileToS3 uses: dps/{academicYear}/{category}/{studentFolder}/{cleanFileName}.{extension}
    const publicUrl = await uploadFileToS3(buffer, file.type, {
      fileName: `${date}_${file.name}`,
      category: "homework",
      studentId: rollNumber,
      academicYear: "2026-27"
    });

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Homework Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
