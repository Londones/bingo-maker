import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";

export async function POST(req: Request) {
    const data = await req.json();
    const session = await getServerSession(authOptions);

    try {
        const bingo = await prisma.bingo.create({
            data: {
                title: data.title,
                gridSize: data.gridSize,
                style: data.style,
                background: {
                    create: {
                        type: data.background.type,
                        value: data.background.value,
                    },
                },
                stamp: {
                    create: {
                        type: data.stamp.type,
                        value: data.stamp.value,
                        size: data.stamp.size,
                        opacity: data.stamp.opacity,
                    },
                },
                userId: session?.user?.id || null,
                authorToken: data.authorToken, // Store anonymous author token
                cells: {
                    create: data.cells.map((cell: any, index: number) => ({
                        content: cell.content,
                        position: index,
                        validated: cell.validated || false,
                    })),
                },
            },
            include: {
                cells: true,
                stamp: true,
                background: true,
            },
        });

        if (!bingo) {
            throw new APIError("Failed to create bingo", APIErrorCode.FAILED_TO_CREATE_BINGO, 557);
        }

        return NextResponse.json(bingo);
    } catch (error) {
        return handleAPIError(error);
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get("cursor");
        const limit = Number(searchParams.get("limit")) || 10;

        const totalCount = await prisma.bingo.count();

        if (cursor) {
            const cursorExists = await prisma.bingo.findUnique({
                where: { id: cursor },
            });

            if (!cursorExists) {
                throw new APIError("Invalid cursor position", APIErrorCode.INVALID_REQUEST, 400);
            }
        }

        const bingos = await prisma.bingo.findMany({
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { createdAt: "desc" },
            include: { cells: true },
        });

        // Handle empty results with existing records
        if (!bingos?.length && totalCount > 0) {
            throw new APIError("Failed to retrieve bingos", APIErrorCode.FAILED_TO_GET_BINGOS, 500);
        }

        const hasMore = bingos.length > limit;
        const items = hasMore ? bingos.slice(0, limit) : bingos;
        const nextCursor = hasMore ? items[items.length - 1].id : undefined;

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
