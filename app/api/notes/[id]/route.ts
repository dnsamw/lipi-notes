import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      chapters: { orderBy: { order: "asc" } },
    },
  });

  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(note);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  const updated = await prisma.note.update({
    where: { id },
    data: {
      ...(body.titleBlob !== undefined && { titleBlob: body.titleBlob }),
      ...(body.titleIv !== undefined && { titleIv: body.titleIv }),
      ...(body.contentBlob !== undefined && { contentBlob: body.contentBlob }),
      ...(body.contentIv !== undefined && { contentIv: body.contentIv }),
      ...(body.wordCount !== undefined && { wordCount: body.wordCount }),
      ...(body.language !== undefined && { language: body.language }),
      ...(body.folderId !== undefined && { folderId: body.folderId }),
      ...(body.hasPassword !== undefined && { hasPassword: body.hasPassword }),
      ...(body.passwordHash !== undefined && { passwordHash: body.passwordHash }),
      ...(body.isTrashed !== undefined && { isTrashed: body.isTrashed }),
      ...(body.trashedAt !== undefined && { trashedAt: body.trashedAt ? new Date(body.trashedAt) : null }),
      ...(body.isNovel !== undefined && { isNovel: body.isNovel }),
      ...(body.driveFileId !== undefined && { driveFileId: body.driveFileId }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
