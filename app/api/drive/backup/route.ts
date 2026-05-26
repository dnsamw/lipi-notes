import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDriveClient, ensureLipiNotesDriveFolder, upsertDriveFile } from "@/lib/drive";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.driveEnabled || !user.driveTokens) {
    return NextResponse.json({ error: "Drive not connected" }, { status: 400 });
  }

  const tokens = JSON.parse(user.driveTokens);
  const drive = getDriveClient(tokens.access_token, tokens.refresh_token);
  const folderId = await ensureLipiNotesDriveFolder(drive);

  const body = await req.json();
  const { noteId, titleBlob, contentBlob, existingFileId } = body;

  const fileName = `note-${noteId}.json`;
  const content = JSON.stringify({ noteId, titleBlob, contentBlob, backedUpAt: new Date().toISOString() });

  const fileId = await upsertDriveFile(drive, folderId, fileName, content, existingFileId);

  // Update driveFileId on note
  await prisma.note.update({
    where: { id: noteId, userId: session.user.id },
    data: { driveFileId: fileId },
  });

  return NextResponse.json({ fileId });
}
