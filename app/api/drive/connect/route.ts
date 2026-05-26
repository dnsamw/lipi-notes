import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOAuth2Client } from "@/lib/drive";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    // Initiate OAuth flow
    const oauth2Client = createOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/drive.file"],
    });
    return NextResponse.redirect(url);
  }

  // Handle callback
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    const tokensJson = JSON.stringify(tokens);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { driveEnabled: true, driveTokens: tokensJson },
    });

    return NextResponse.redirect(new URL("/settings?drive=connected", req.url));
  } catch {
    return NextResponse.redirect(new URL("/settings?drive=error", req.url));
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { driveEnabled: false, driveTokens: null },
  });

  return NextResponse.json({ ok: true });
}
