import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { noteId, title, contentBlob, contentIv, order } = await req.json();

  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chapter = await prisma.chapter.create({
    data: { noteId, title, contentBlob, contentIv, order: order ?? 0 },
  });

  return NextResponse.json(chapter, { status: 201 });
}
