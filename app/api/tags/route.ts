import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { notes: true } } },
  });

  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const tag = await prisma.tag.create({
    data: { name: name.trim(), color: color ?? "amber", userId: session.user.id },
  });

  return NextResponse.json(tag, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { noteId, tagId, action } = await req.json();

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag || tag.userId !== session.user.id) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (action === "add") {
    await prisma.noteTag.upsert({
      where: { noteId_tagId: { noteId, tagId } },
      create: { noteId, tagId },
      update: {},
    });
  } else if (action === "remove") {
    await prisma.noteTag.deleteMany({ where: { noteId, tagId } });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag || tag.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.tag.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
