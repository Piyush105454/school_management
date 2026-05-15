import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) return new NextResponse("Path missing", { status: 400 });

    // Clean the path to get the S3 key
    // Path might be a full URL or just the key
    let key = path;
    if (path.startsWith("http")) {
        try {
            const url = new URL(path);
            key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
            // Strip bucket name if present in path-style URL
            const bucketName = process.env.S3_BUCKET_NAME;
            if (bucketName && key.startsWith(bucketName + "/")) {
                key = key.replace(bucketName + "/", "");
            }
        } catch (e) {}
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: decodeURIComponent(key),
    });

    const { Body, ContentType } = await s3Client.send(command);

    if (!Body) return new NextResponse("File not found", { status: 404 });

    // Handle different stream types (Node.js vs Web)
    const streamToBuffer = async (stream: any): Promise<Buffer> => {
        if (stream.transformToByteArray) {
            const arr = await stream.transformToByteArray();
            return Buffer.from(arr);
        }
        // Fallback for older/different stream types
        const chunks: any[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    };

    const data = await streamToBuffer(Body);

    return new NextResponse(data, {
      headers: {
        "Content-Type": ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Homework Proxy Error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
