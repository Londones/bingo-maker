import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteFile } from "@/lib/s3upload";
import { prisma } from "@/lib/prisma";

function extractKeyFromS3Url(url: string): string {
  const urlObj = new URL(url);
  return urlObj.pathname.substring(1);
}

async function verifyImageOwnership(url: string, userId: string): Promise<boolean> {
  const [bingoMatch, cellMatch] = await Promise.all([
    prisma.bingo.findFirst({
      where: {
        userId,
        OR: [
          { background: { path: ["backgroundImage"], equals: url } },
          { stamp: { path: ["value"], equals: url } },
        ],
      },
      select: { id: true },
    }),
    prisma.bingoCell.findFirst({
      where: {
        bingo: { userId },
        cellStyle: { path: ["cellBackgroundImage"], equals: url },
      },
      select: { id: true },
    }),
  ]);

  return Boolean(bingoMatch || cellMatch);
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const [session, body] = await Promise.all([auth(), req.json()]);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - You must be logged in to delete images" },
        { status: 401 }
      );
    }

    const { url, force = false } = body as { url?: string; force?: boolean };
    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, message: "Missing image URL" }, { status: 400 });
    }

    let key: string;
    try {
      key = extractKeyFromS3Url(url);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid S3 URL format" }, { status: 400 });
    }

    if (!force) {
      const isAuthorized = await verifyImageOwnership(url, session.user.id);
      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, message: "Unauthorized - You don't own this image" },
          { status: 403 }
        );
      }
    }

    await deleteFile(key);

    return NextResponse.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    return NextResponse.json({ success: false, message: "Failed to delete image" }, { status: 500 });
  }
}
