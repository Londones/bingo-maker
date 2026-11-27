import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { BingoCell } from "@/types/types";
import { bingoSchema } from "@/schemas/schemas";
import { buildBackground, buildCellCreate, buildStamp, buildStyle } from "@/lib/builders";
import { ZodError } from "zod";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const [rawData, session] = await Promise.all([req.json(), auth()]);

    try {
      const data = bingoSchema.parse(rawData);

      const bingo = await prisma.bingo.create({
        data: {
          title: data.title,
          titleWidth: data.titleWidth,
          gridSize: data.gridSize,
          style: buildStyle(data.style) as Prisma.InputJsonValue,
          status: data.status,
          background: buildBackground(data.background) as Prisma.InputJsonValue,
          stamp: buildStamp(data.stamp) as Prisma.InputJsonValue,
          userId: session?.user?.id,
          authorToken: data.authorToken,
          cells: {
            create: buildCellCreate(data.cells as BingoCell[]),
          },
        },
        include: {
          cells: true,
        },
      });

      if (!bingo) {
        throw new APIError("Failed to create bingo!", APIErrorCode.FAILED_TO_CREATE_BINGO, 557);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { authorToken, ...bingoWithoutToken } = bingo;

      return NextResponse.json(bingoWithoutToken, { status: 200 });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            details: error.errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Number(searchParams.get("limit")) || 10;

    if (cursor) {
      const cursorExists = await prisma.bingo.findUnique({
        where: { id: cursor },
        select: { id: true },
      });

      if (!cursorExists) {
        throw new APIError("Invalid cursor position", APIErrorCode.INVALID_REQUEST, 400);
      }
    }

    const [totalCount, bingos] = await Promise.all([
      prisma.bingo.count(),
      prisma.bingo.findMany({
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: { createdAt: "desc" },
        include: { cells: true },
      }),
    ]);

    if (!bingos?.length && totalCount > 0) {
      throw new APIError("Failed to retrieve bingos", APIErrorCode.FAILED_TO_GET_BINGOS, 500);
    }

    const bingosWithoutToken = bingos.map((bingo) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { authorToken, ...bingoWithoutToken } = bingo;
      return bingoWithoutToken;
    });

    const hasMore = bingos.length > limit;
    const items = hasMore ? bingosWithoutToken.slice(0, limit) : bingosWithoutToken;
    const nextCursor = hasMore ? items[items.length - 1]!.id : undefined;

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
      total: totalCount,
      currentPage: cursor ? Math.floor(totalCount / limit) : 1,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
