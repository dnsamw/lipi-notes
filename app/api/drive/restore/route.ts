import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDriveClient, ensureLipiNotesDriveFolder, listDriveBackups, readDriveFile } from "@/lib/drive";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.driveEnabled || !user.driveTokens) {
    return NextResponse.json({ error: "Drive not connected" }, { status: 400 });
  }

  const tokens = JSON.parse(user.driveTokens);
  const drive = getDriveClient(tokens.access_token, tokens.refresh_token);
  const folderId = await ensureLipiNotesDriveFolder(drive);
  const backups = await listDriveBackups(drive, folderId);

  return NextResponse.json(backups);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.driveEnabled || !user.driveTokens) {
    return NextResponse.json({ error: "Drive not connected" }, { status: 400 });
  }

  const { fileId } = await req.json();
  const tokens = JSON.parse(user.driveTokens);
  const drive = getDriveClient(tokens.access_token, tokens.refresh_token);
  const content = await readDriveFile(drive, fileId);

  return NextResponse.json({ content });
}
