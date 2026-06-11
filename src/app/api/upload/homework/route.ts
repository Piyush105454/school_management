import { NextRequest, NextResponse } from "next/server";
import { uploadFileToDrive } from "@/lib/gdrive-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const rollNumber = formData.get("rollNumber") as string || "unknown";
    const className = formData.get("className") as string || "unknown";
    const date = formData.get("date") as string || new Date().toISOString().split('T')[0];

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Google Drive using the newly created Google Drive service
    const fileName = `${date}_Roll-${rollNumber}_${file.name}`;
    const publicUrl = await uploadFileToDrive(buffer, file.type, fileName, className, rollNumber);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Homework Upload Error (Google Drive):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
