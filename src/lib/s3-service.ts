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
  admissionId?: string;
}

/**
 * Uploads a base64 document/image to S3
 * Logic: dps/${year}/${category}/${admissionId}_${fieldName}.${ext}
 */
export async function uploadToS3(
  base64Data: string, 
  options: UploadOptions
) {
  if (!base64Data || base64Data.startsWith("http")) return base64Data; // Already a URL or empty

  try {
    const academicYear = options.academicYear || "2026-27";
    const category = options.category || "studentdocuments";
    const admissionId = options.admissionId || "unknown";

    // Extract content type and base64 string
    const mimeMatch = base64Data.match(/^data:(.*);base64,(.*)$/);
    if (!mimeMatch) return base64Data;

    const contentType = mimeMatch[1];
    const base64String = mimeMatch[2];
    const buffer = Buffer.from(base64String, "base64");
    
    // --- File Size Validation ---
    const fileSizeInBytes = buffer.length;
    const isAffidavit = options.fileName.toLowerCase().includes("affidavit");
    const maxSize = isAffidavit ? 1024 * 1024 : 500 * 1024; // 1MB vs 500KB

    if (fileSizeInBytes > maxSize) {
      const sizeLabel = isAffidavit ? "1 MB" : "500 KB";
      throw new Error(`File size exceeds limit (${sizeLabel}). Please compress the file and try again.`);
    }

    // Determine extension
    let extension = options.fileName.split('.').pop() || "";
    if (!extension || extension === options.fileName) {
      if (contentType === "application/pdf") extension = "pdf";
      else if (contentType.startsWith("image/")) extension = contentType.split('/')[1] || "jpg";
      else extension = "bin";
    }

    const cleanFileName = options.fileName.split('.')[0];
    const finalKey = `dps/${academicYear}/${category}/${admissionId}_${cleanFileName}.${extension}`;

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
