import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Call this via Vercel cron: { "crons": [{ "path": "/api/cron/purge-trash", "schedule": "0 3 * * *" }] }
// Or call manually with Authorization header matching CRON_SECRET env var
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.note.deleteMany({
    where: {
      isTrashed: true,
      trashedAt: { lt: thirtyDaysAgo },
    },
  });

  return NextResponse.json({ purged: count });
}
