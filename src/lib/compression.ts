import imageCompression from "browser-image-compression";
import { compressPdf } from "./pdf-service";

/**
 * Ensures a file (Image or PDF) is within the specified size limit.
 * If the file is already within the limit, it is returned as-is.
 * Otherwise, it is compressed to fit the limit.
 */
export async function ensureCompressed(file: File, maxSizeMB: number): Promise<File> {
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file; // Already under limit, upload direct
  }

  const fileType = file.type || "application/octet-stream";

  if (fileType.startsWith("image/")) {
    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    const compressedBlob = await imageCompression(file, options);
    // Use the actual type from the compressed blob (it might have changed from HEIC to JPEG)
    return new File([compressedBlob], file.name, { type: compressedBlob.type || "image/jpeg" });
  } 
  
  if (fileType === "application/pdf") {
    return await compressPdf(file, maxSizeMB);
  }

  return file; 
}

/**
 * Compresses a Base64 image string to a smaller size.
 */
export const compressImageToBase64 = (base64Str: string, maxWidth = 1000, maxHeight = 1000): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(base64Str);
  });
};
