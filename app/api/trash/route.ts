import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id, isTrashed: true },
    orderBy: { trashedAt: "desc" },
    select: {
      id: true,
      titleBlob: true,
      titleIv: true,
      folderId: true,
      wordCount: true,
      trashedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, noteIds } = await req.json();

  if (!Array.isArray(noteIds) || noteIds.length === 0) {
    return NextResponse.json({ error: "noteIds required" }, { status: 400 });
  }

  const notes = await prisma.note.findMany({
    where: { id: { in: noteIds }, userId: session.user.id },
  });

  const ownedIds = notes.map((n) => n.id);

  if (action === "restore") {
    await prisma.note.updateMany({
      where: { id: { in: ownedIds } },
      data: { isTrashed: false, trashedAt: null },
    });
  } else if (action === "delete") {
    await prisma.note.deleteMany({ where: { id: { in: ownedIds } } });
  }

  return NextResponse.json({ ok: true, count: ownedIds.length });
}
