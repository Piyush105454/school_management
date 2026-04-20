import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export interface UploadOptions {
  fileName: string;
  academicYear?: string;
  category?: string;
  admissionId?: string; // UUID (fallback)
  studentId?: string;   // Human readable ID (e.g. ADM-2627-0077)
  appliedClass?: string; // e.g. "Class 3"
}

/**
 * Uploads a base64 document/image to S3
 * Logic: dps/${year}/${category}/${appliedClass}/${studentId}/${fileName}.${ext}
 */
export async function uploadToS3(
  base64Data: string, 
  options: UploadOptions
) {
  if (!base64Data || base64Data.startsWith("http")) return base64Data; // Already a URL or empty

  try {
    const academicYear = options.academicYear || "2026-27";
    const category = options.category || "student-documents";
    
    // Sanitize class name (e.g. "Class 3" -> "class-3")
    const classFolder = options.appliedClass 
      ? options.appliedClass.toLowerCase().trim().replace(/\s+/g, '-') 
      : "unassigned";

    // Prefer human-readable studentId over UUID
    const studentFolder = options.studentId || options.admissionId || "unknown";

    // Extract content type and base64 string
    const mimeMatch = base64Data.match(/^data:(.*);base64,(.*)$/);
    if (!mimeMatch) return base64Data;

    const contentType = mimeMatch[1];
    const base64String = mimeMatch[2];
    const buffer = Buffer.from(base64String, "base64");
    
    // --- File Size Validation ---
    const fileSizeInBytes = buffer.length;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (fileSizeInBytes > maxSize) {
      throw new Error(`File size exceeds limit (5MB). Please compress the file and try again.`);
    }

    // Determine extension
    let extension = options.fileName.split('.').pop() || "";
    if (!extension || extension === options.fileName) {
      if (contentType === "application/pdf") extension = "pdf";
      else if (contentType.startsWith("image/")) extension = contentType.split('/')[1] || "jpg";
      else extension = "bin";
    }

    const cleanFileName = options.fileName.split('.')[0];
    const finalKey = `dps/${academicYear}/${category}/${classFolder}/${studentFolder}/${cleanFileName}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: finalKey,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    
    const publicUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${finalKey}`;
    return publicUrl;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw error;
  }
}

/**
 * Generates a temporary secure link for a private S3 file
 */
export async function getSignedDownloadUrl(s3UrlOrKey: string) {
  if (!s3UrlOrKey) return null;
  // If it's already a base64 string, return it as is
  if (s3UrlOrKey.startsWith("data:")) return s3UrlOrKey;

  try {
    let key = s3UrlOrKey;
    // Extract key from full URL if provided
    // https://bucket.s3.region.amazonaws.com/key
    if (s3UrlOrKey.startsWith("http")) {
      const urlPart = `.s3.${process.env.AWS_REGION}.amazonaws.com/`;
      if (s3UrlOrKey.includes(urlPart)) {
        key = s3UrlOrKey.split(urlPart)[1];
      }
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    // Link valid for 3600 seconds (1 hour)
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return s3UrlOrKey; // Fallback to original
  }
}
