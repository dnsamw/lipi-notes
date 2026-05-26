import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const trashed = searchParams.get("trashed") === "true";
  const tagId = searchParams.get("tagId");

  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      isTrashed: trashed,
      ...(folderId ? { folderId } : folderId === "" ? { folderId: null } : {}),
      ...(tagId && { tags: { some: { tagId } } }),
    },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      titleBlob: true,
      titleIv: true,
      folderId: true,
      isNovel: true,
      hasPassword: true,
      language: true,
      wordCount: true,
      order: true,
      isTrashed: true,
      createdAt: true,
      updatedAt: true,
      tags: {
        select: {
          tag: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { titleBlob, titleIv, contentBlob, contentIv, folderId, language, isNovel } = body;

  if (!titleBlob || !titleIv || !contentBlob || !contentIv) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (folderId) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== session.user.id) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
  }

  const maxOrder = await prisma.note.aggregate({
    where: { userId: session.user.id, folderId: folderId ?? null },
    _max: { order: true },
  });

  const note = await prisma.note.create({
    data: {
      titleBlob,
      titleIv,
      contentBlob,
      contentIv,
      folderId: folderId ?? null,
      userId: session.user.id,
      language: language ?? "en",
      isNovel: isNovel ?? false,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
