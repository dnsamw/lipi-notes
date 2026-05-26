import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Returns encrypted blobs — client decrypts then renders PDF client-side
// For server-side PDF rendering, implement with puppeteer if needed
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id },
    include: { chapters: { orderBy: { order: "asc" } } },
  });

  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: note.id,
    isNovel: note.isNovel,
    titleBlob: note.titleBlob,
    titleIv: note.titleIv,
    contentBlob: note.contentBlob,
    contentIv: note.contentIv,
    chapters: note.chapters.map((c) => ({
      id: c.id,
      title: c.title,
      contentBlob: c.contentBlob,
      contentIv: c.contentIv,
      order: c.order,
    })),
  });
}
