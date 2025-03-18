import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APIError, APIErrorCode } from "@/lib/errors";
import { auth } from "@/lib/auth";
import { handleAPIError } from "@/lib/api-utils";
import { MigrateRequest } from "@/types/types";

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
  }

  const { bingoIds, authorToken, userId } = (await req.json()) as MigrateRequest;

  try {
    // First check if there are any bingos matching these criteria
    const bingoCount = await prisma.bingo.count({
      where: {
        id: { in: bingoIds },
        authorToken: authorToken,
        userId: null,
      },
    });

    if (bingoCount === 0) {
      throw new APIError("No bingos found to migrate", APIErrorCode.BINGO_NOT_FOUND, 444);
    }

    const updated = await prisma.bingo.updateMany({
      where: {
        id: { in: bingoIds },
        authorToken: authorToken,
        userId: null,
      },
      data: {
        userId: userId,
        authorToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      migratedCount: updated.count,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
