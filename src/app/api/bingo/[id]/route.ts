import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { Bingo, BingoCell } from "@/types/types";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const shareToken = searchParams.get("shareToken");

    if (!id || !shareToken) {
        throw new APIError("Missing ID or shareToken", APIErrorCode.MISSING_ID_OR_SHARE_TOKEN, 445);
    }

    try {
        const bingo = await prisma.bingo.findUnique({
            where: { id: params.id },
            include: { cells: true, background: true, stamp: true },
        });

        if (!bingo) {
            throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
        }

        return NextResponse.json(bingo);
    } catch (error) {
        return handleAPIError(error);
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    const data = (await req.json()) as Partial<Bingo>;

    try {
        const bingo = await prisma.bingo.findUnique({
            where: { id: params.id },
        });

        if (!bingo) {
            throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
        }

        if (bingo.userId !== session?.user?.id || bingo.authorToken !== data.authorToken) {
            throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
        }

        const updated = await prisma.bingo.update({
            where: { id: params.id },
            data: {
                title: data.title,
                style: data.style || bingo.style,
                status: data.status || bingo.status,
                background: {
                    upsert: {
                        where: { bingoId: bingo.id },
                        create: {
                            type: data.background?.type,
                            value: data.background?.value,
                        },
                        update: {
                            type: data.background?.type,
                            value: data.background?.value,
                        },
                    },
                },
                stamp: {
                    upsert: {
                        where: { bingoId: bingo.id },
                        create: {
                            type: data.stamp?.type,
                            value: data.stamp?.value,
                            size: data.stamp?.size,
                            opacity: data.stamp?.opacity,
                        },
                        update: {
                            type: data.stamp?.type,
                            value: data.stamp?.value,
                            size: data.stamp?.size,
                            opacity: data.stamp?.opacity,
                        },
                    },
                },
                cells: {
                    upsert: data.cells?.map((cell: Partial<BingoCell>) => ({
                        where: { id: cell.id },
                        create: {
                            content: cell.content,
                            position: cell.position,
                            validated: cell.validated,
                        },
                        update: {
                            content: cell.content,
                            validated: cell.validated,
                        },
                    })),
                },
            },
            include: {
                cells: true,
                background: true,
                stamp: true,
            },
        });

        if (!updated) {
            throw new APIError("Failed to update bingo", APIErrorCode.DATABASE_ERROR, 500);
        }

        return NextResponse.json(updated);
    } catch (error) {
        return handleAPIError(error);
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const session = await getServerSession(authOptions);

    try {
        const bingo = await prisma.bingo.findUnique({
            where: { id: params.id },
        });

        if (!bingo) {
            throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
        }

        if (bingo.userId !== session?.user?.id) {
            throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
        }

        await prisma.bingo.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleAPIError(error);
    }
}
