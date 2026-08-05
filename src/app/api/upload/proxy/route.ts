import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFileToS3 } from "@/lib/s3-service";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const contentType = searchParams.get("contentType") || "application/octet-stream";

    if (!key) {
      return NextResponse.json({ success: false, error: "Key is required" }, { status: 400 });
    }

    // Read the binary stream of the file being uploaded
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ success: false, error: "Empty file body" }, { status: 400 });
    }

    // Call our Drive-backed uploadFileToS3 passing the pre-computed key
    const publicUrl = await uploadFileToS3(buffer, contentType, { key });

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("Upload proxy error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
