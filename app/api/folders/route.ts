import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  const all = searchParams.get("all") === "true";

  const folders = await prisma.folder.findMany({
    where: {
      userId: session.user.id,
      ...(all ? {} : { parentId: parentId ?? null }),
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      parentId: true,
      hasPassword: true,
      order: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { notes: true, children: true } },
    },
  });

  return NextResponse.json(folders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, icon, color, parentId } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const maxOrder = await prisma.folder.aggregate({
    where: { userId: session.user.id, parentId: parentId ?? null },
    _max: { order: true },
  });

  const folder = await prisma.folder.create({
    data: {
      name: name.trim(),
      icon: icon ?? "folder",
      color: color ?? "default",
      parentId: parentId ?? null,
      userId: session.user.id,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(folder, { status: 201 });
}
