import { google } from "googleapis";
import { Readable } from "stream";

// Environment variables needed:
// GOOGLE_SERVICE_ACCOUNT_EMAIL
// GOOGLE_PRIVATE_KEY
// GOOGLE_DRIVE_HOMEWORK_FOLDER_ID

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

async function getOrCreateFolder(drive: any, folderName: string, parentId: string): Promise<string> {
  // Check if folder exists
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
  const response = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id; // Return existing folder ID
  }

  // Create folder if it doesn't exist
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

  return folder.data.id;
}

export async function uploadFileToDrive(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  className: string,
  rollNumber: string
): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_HOMEWORK_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error("Missing GOOGLE_DRIVE_HOMEWORK_FOLDER_ID in environment variables.");
  }

  const drive = await getDriveClient();

  try {
    // Navigate or create the hierarchy: dps -> className -> rollnumber -> homework
    const dpsFolderId = await getOrCreateFolder(drive, "dps", rootFolderId);
    const classFolderId = await getOrCreateFolder(drive, className || "Unknown_Class", dpsFolderId);
    const rollFolderId = await getOrCreateFolder(drive, rollNumber || "Unknown_Roll", classFolderId);
    const targetFolderId = await getOrCreateFolder(drive, "homework", rollFolderId);

    const fileMetadata = {
      name: fileName,
      parents: [targetFolderId],
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(buffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
      supportsAllDrives: true,
    });

    // Make the file publicly accessible so it can be viewed on the platform
    if (file.data.id) {
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
        supportsAllDrives: true,
      });
    }

    return file.data.webViewLink || "";
  } catch (error: any) {
    console.error("Google Drive Upload Error:", error);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
}
