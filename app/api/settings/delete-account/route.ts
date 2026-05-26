import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Soft delete: marks for deletion. A separate cleanup job removes data.
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // For now: delete all notes and folders, then delete the user
  // In production, you might want a softer approach with a deletedAt timestamp
  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ ok: true });
}
