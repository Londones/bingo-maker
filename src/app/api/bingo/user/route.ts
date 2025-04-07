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
  const skip = (page - 1) * ITEMS_PER_PAGE;

  if (!userId) {
    throw new APIError("User ID is required", APIErrorCode.INVALID_REQUEST, 400);
  }

  try {
    const bingos: BingoPreview[] = await prisma.bingo.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        title: true,
        background: {
          select: {
            value: true,
            backgroundImage: true,
            backgroundImageOpacity: true,
            backgroundImagePosition: true,
            backgroundImageSize: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    });

    const totalCount = await prisma.bingo.count({
      where: {
        userId: userId,
      },
    });

    const responseData: BingoPreviewResponse = {
      bingos,
      totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
      hasMore: skip + bingos.length < totalCount,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    return handleAPIError(error);
  }
}
