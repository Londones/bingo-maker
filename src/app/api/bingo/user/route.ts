import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { BingoPreview, BingoPreviewResponse } from "@/types/types";
import { ITEMS_PER_PAGE } from "@/utils/constants";

export async function GET(req: Request): Promise<NextResponse> {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;
  const userId = searchParams.get("userId") || session?.user?.id;
  const statusParam = searchParams.get("status");
  const status = statusParam === "published" || statusParam === "draft" ? statusParam : undefined;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  if (!userId) {
    throw new APIError("User ID is required", APIErrorCode.INVALID_REQUEST, 400);
  }

  // check if userId is valid
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new APIError("User not found", APIErrorCode.INVALID_REQUEST, 404);
  }

  try {
    const whereClause = {
      userId: userId,
      ...(status ? { status } : {}),
    };

    const [bingos, totalCount] = await Promise.all([
      prisma.bingo.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          status: true,
          gridSize: true,
          style: true,
          stamp: true,
          background: true,
          cells: {
            select: {
              position: true,
              content: true,
              validated: true,
            },
            orderBy: { position: "asc" },
          },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: ITEMS_PER_PAGE,
      }),
      prisma.bingo.count({
        where: whereClause,
      }),
    ]);

    const responseData: BingoPreviewResponse = {
      bingos: bingos as unknown as BingoPreview[],
      totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
      hasMore: skip + bingos.length < totalCount,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    return handleAPIError(error);
  }
}
