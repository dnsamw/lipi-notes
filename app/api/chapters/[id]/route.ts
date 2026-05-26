import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getChapterWithAuth(id: string, userId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: { note: { select: { userId: true } } },
  });
  if (!chapter || chapter.note.userId !== userId) return null;
  return chapter;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const chapter = await getChapterWithAuth(id, session.user.id);
  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.chapter.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.contentBlob !== undefined && { contentBlob: body.contentBlob }),
      ...(body.contentIv !== undefined && { contentIv: body.contentIv }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.wordCount !== undefined && { wordCount: body.wordCount }),
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
  const chapter = await getChapterWithAuth(id, session.user.id);
  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.chapter.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
