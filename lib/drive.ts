// Google Drive backup helpers
// Only active when user has connected Drive (User.driveEnabled = true)

import { google } from "googleapis";

const DRIVE_FOLDER_NAME = "LipiNotes";

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.NEXTAUTH_URL + "/api/drive/connect"
  );
}

export function getDriveClient(accessToken: string, refreshToken?: string) {
  const auth = createOAuth2Client();
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return google.drive({ version: "v3", auth });
}

export async function ensureLipiNotesDriveFolder(
  drive: ReturnType<typeof google.drive>
): Promise<string> {
  const res = await drive.files.list({
    q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  const files = res.data.files ?? [];
  if (files.length > 0 && files[0].id) {
    return files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  return folder.data.id!;
}

export async function upsertDriveFile(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
  fileName: string,
  content: string,
  existingFileId?: string | null
): Promise<string> {
  const media = {
    mimeType: "application/json",
    body: content,
  };

  if (existingFileId) {
    await drive.files.update({
      fileId: existingFileId,
      media,
    });
    return existingFileId;
  }

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media,
    fields: "id",
  });

  return file.data.id!;
}

export async function listDriveBackups(
  drive: ReturnType<typeof google.drive>,
  folderId: string
): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, modifiedTime)",
    orderBy: "modifiedTime desc",
  });
  return (res.data.files ?? []) as Array<{
    id: string;
    name: string;
    modifiedTime: string;
  }>;
}

export async function readDriveFile(
  drive: ReturnType<typeof google.drive>,
  fileId: string
): Promise<string> {
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" }
  );
  return res.data as string;
}
