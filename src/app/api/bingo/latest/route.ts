import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { BingoPreview } from "@/types/types";

interface LatestBingosOptions {
  status?: "draft" | "published";
  limit?: number;
  cursor?: string;
}

export interface LatestBingosResponse {
  items: BingoPreview[];
  nextCursor: string | undefined;
  hasMore: boolean;
  total: number;
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Number(searchParams.get("limit")) || 10;
    const status = searchParams.get("status") as "draft" | "published" | null;

    // Construct the filter object
    const filter: LatestBingosOptions = {};
    if (status) {
      filter.status = status;
    }

    // Count total matching bingos
    const totalCount = await prisma.bingo.count({
      where: {
        ...(status && { status }),
      },
    });

    // If a cursor is provided, validate that it exists
    if (cursor) {
      const cursorExists = await prisma.bingo.findUnique({
        where: { id: cursor },
      });

      if (!cursorExists) {
        throw new APIError("Invalid cursor position", APIErrorCode.INVALID_REQUEST, 400);
      }
    }

    // Fetch bingos with pagination and filtering
    const bingos = await prisma.bingo.findMany({
      take: limit + 1, // Take one extra to determine if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor item
      }),
      where: {
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
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
    });

    if (!bingos?.length && totalCount > 0) {
      throw new APIError("Failed to retrieve bingos", APIErrorCode.FAILED_TO_GET_BINGOS, 500);
    }

    // Determine if there are more items
    const hasMore = bingos.length > limit;
    const items = hasMore ? bingos.slice(0, limit) : bingos;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    // Format response
    const response: LatestBingosResponse = {
      items,
      nextCursor,
      hasMore,
      total: totalCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleAPIError(error);
  }
}
