import { google } from "googleapis";
import { Readable } from "stream";

// Re-use Google Drive credentials
const SCOPES = ["https://www.googleapis.com/auth/drive"];

async function getDriveClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google Drive credentials in environment variables.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  return google.drive({ version: "v3", auth: authClient as any });
}

// Cache to speed up repeat lookups of the same documents
const driveUrlCache = new Map<string, string>();

export interface UploadOptions {
  fileName?: string;
  academicYear?: string;
  category?: string;
  admissionId?: string;
  studentId?: string;
  appliedClass?: string;
  key?: string;
}

async function getOrCreateFolder(drive: any, folderName: string, parentId: string): Promise<string> {
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`;
  const response = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentId],
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
    supportsAllDrives: true,
  });

  return folder.data.id!;
}

/**
 * Uploads a raw Buffer/File to Google Drive mimicking S3's path keys
 */
export async function uploadFileToS3(
  fileData: Buffer | ArrayBuffer,
  contentType: string,
  options: UploadOptions
) {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_HOMEWORK_FOLDER_ID;
    if (!rootFolderId) {
      throw new Error("Missing GOOGLE_DRIVE_HOMEWORK_FOLDER_ID in environment variables.");
    }

    const drive = await getDriveClient();
    
    // Determine the key to use
    const finalKey = options.key || (() => {
      const academicYear = options.academicYear || "2026-27";
      const category = options.category || "student-documents";
      const studentFolder = options.studentId || options.admissionId || "unknown";
      const fileName = options.fileName || "file";
      
      let extension = fileName.split('.').pop() || "";
      if (!extension || extension === fileName) {
        if (contentType === "application/pdf") extension = "pdf";
        else if (contentType.startsWith("image/")) extension = contentType.split('/')[1] || "jpg";
      }

      const cleanFileName = fileName.split('.')[0].replace(/[^a-z0-9]/gi, '_');
      return `dps/${academicYear}/${category}/${studentFolder}/${cleanFileName}.${extension}`;
    })();

    // Replicate S3 path in Google Drive folders
    const parts = finalKey.split('/');
    const fileName = parts.pop()!;
    
    let currentParentId = rootFolderId;
    for (const folderName of parts) {
      currentParentId = await getOrCreateFolder(drive, folderName, currentParentId);
    }

    const fileMetadata = {
      name: fileName,
      parents: [currentParentId],
    };

    const media = {
      mimeType: contentType,
      body: Readable.from(Buffer.from(fileData as ArrayBuffer)),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
      supportsAllDrives: true,
    });

    if (file.data.id) {
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
        supportsAllDrives: true,
      });

      const driveUrl = `https://drive.google.com/uc?export=view&id=${file.data.id}`;
      // Seed cache
      driveUrlCache.set(finalKey, driveUrl);
    }

    // Return virtual S3 URL to keep database strings fully backward compatible
    return `https://school-admissions.s3.amazonaws.com/${finalKey}`;
  } catch (error) {
    console.error("Drive upload proxy Error:", error);
    throw error;
  }
}

/**
 * Uploads base64 document/image to S3-alternative (Drive)
 */
export async function uploadToS3(
  base64Data: string, 
  options: UploadOptions
) {
  if (!base64Data || base64Data.startsWith("http")) return base64Data;

  try {
    const mimeMatch = base64Data.match(/^data:(.*);base64,(.*)$/);
    if (!mimeMatch) return base64Data;

    const contentType = mimeMatch[1];
    const base64String = mimeMatch[2];
    const buffer = Buffer.from(base64String, "base64");
    
    return await uploadFileToS3(buffer, contentType, options);
  } catch (error) {
    console.error("Drive base64 upload proxy Error:", error);
    throw error;
  }
}

/**
 * Resolves virtual S3 URL/Key to direct Google Drive view link
 */
export async function getSignedDownloadUrl(s3UrlOrKey: string) {
  if (!s3UrlOrKey) return null;
  if (s3UrlOrKey.startsWith("data:")) return s3UrlOrKey;

  // Extract key
  let key = s3UrlOrKey;
  if (s3UrlOrKey.includes("amazonaws.com/")) {
    key = decodeURIComponent(s3UrlOrKey.split("amazonaws.com/")[1]);
  }

  // Check cache
  if (driveUrlCache.has(key)) {
    return driveUrlCache.get(key)!;
  }

  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_HOMEWORK_FOLDER_ID;
    if (!rootFolderId) return s3UrlOrKey;

    const drive = await getDriveClient();
    const parts = key.split('/');
    const fileName = parts.pop()!;

    let currentParentId = rootFolderId;
    let found = true;

    for (const folderName of parts) {
      const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${currentParentId}' in parents and trashed=false`;
      const res = await drive.files.list({
        q: query,
        fields: "files(id)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      if (res.data.files && res.data.files.length > 0) {
        currentParentId = res.data.files[0].id!;
      } else {
        found = false;
        break;
      }
    }

    if (found) {
      const fileQuery = `name='${fileName.replace(/'/g, "\\'")}' and '${currentParentId}' in parents and trashed=false`;
      const fileRes = await drive.files.list({
        q: fileQuery,
        fields: "files(id)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      if (fileRes.data.files && fileRes.data.files.length > 0) {
        const driveUrl = `https://drive.google.com/uc?export=view&id=${fileRes.data.files[0].id}`;
        driveUrlCache.set(key, driveUrl);
        return driveUrl;
      }
    }
    
    return s3UrlOrKey;
  } catch (error) {
    console.error("Error resolving Google Drive file URL:", error);
    return s3UrlOrKey;
  }
}

/**
 * Returns a server upload proxy endpoint URL
 */
export async function getPresignedUploadUrl(key: string, contentType: string) {
  return `/api/upload/proxy?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;
}

/**
 * Deletes file from Google Drive
 */
export async function deleteFromS3(s3UrlOrKey: string) {
  if (!s3UrlOrKey) return;
  
  let key = s3UrlOrKey;
  if (s3UrlOrKey.includes("amazonaws.com/")) {
    key = decodeURIComponent(s3UrlOrKey.split("amazonaws.com/")[1]);
  }

  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_HOMEWORK_FOLDER_ID;
    if (!rootFolderId) return;

    const drive = await getDriveClient();
    const parts = key.split('/');
    const fileName = parts.pop()!;

    let currentParentId = rootFolderId;
    let found = true;

    for (const folderName of parts) {
      const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${currentParentId}' in parents and trashed=false`;
      const res = await drive.files.list({
        q: query,
        fields: "files(id)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      if (res.data.files && res.data.files.length > 0) {
        currentParentId = res.data.files[0].id!;
      } else {
        found = false;
        break;
      }
    }

    if (found) {
      const fileQuery = `name='${fileName.replace(/'/g, "\\'")}' and '${currentParentId}' in parents and trashed=false`;
      const fileRes = await drive.files.list({
        q: fileQuery,
        fields: "files(id)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      if (fileRes.data.files && fileRes.data.files.length > 0) {
        const fileId = fileRes.data.files[0].id!;
        await drive.files.delete({
          fileId,
          supportsAllDrives: true
        });
        driveUrlCache.delete(key);
      }
    }
  } catch (error) {
    console.error("Error deleting from Google Drive:", error);
  }
}
