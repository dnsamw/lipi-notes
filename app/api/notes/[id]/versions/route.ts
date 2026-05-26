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
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versions = await prisma.noteVersion.findMany({
    where: { noteId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json(versions);
}

export async function POST(
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

  const { contentBlob, contentIv } = await req.json();

  const version = await prisma.noteVersion.create({
    data: { noteId: id, contentBlob, contentIv },
  });

  // Keep only last 10 versions
  const allVersions = await prisma.noteVersion.findMany({
    where: { noteId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (allVersions.length > 10) {
    const toDelete = allVersions.slice(10).map((v) => v.id);
    await prisma.noteVersion.deleteMany({ where: { id: { in: toDelete } } });
  }

  return NextResponse.json(version, { status: 201 });
}
