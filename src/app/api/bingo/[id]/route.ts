import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { Bingo } from "@/types/types";

type ParamsType = Promise<{ bingoId: string }>;

export async function GET(req: Request, { params }: { params: ParamsType }) {
    const { bingoId: id } = await params;

    if (!id) {
        throw new APIError("Missing ID or shareToken", APIErrorCode.MISSING_ID_OR_SHARE_TOKEN, 445);
    }

    try {
        const bingo = await prisma.bingo.findUnique({
            where: { id: id },
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

export async function PATCH(req: Request, { params }: { params: ParamsType }) {
    const session = await auth();
    const data = (await req.json()) as Partial<Bingo>;
    const { bingoId: id } = await params;

    try {
        const bingo = await prisma.bingo.findUnique({
            where: { id: id },
            include: { cells: true, background: true, stamp: true, style: true },
        });

        if (!bingo) {
            throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
        }

        if (bingo.userId !== session?.user?.id || bingo.authorToken !== data.authorToken) {
            throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
        }

        const updated = await prisma.bingo.update({
            where: { id: id },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.style && {
                    style: {
                        update: {
                            ...(data.style.fontSize && { fontSize: data.style.fontSize }),
                            ...(data.style.fontFamily && { fontFamily: data.style.fontFamily }),
                            ...(data.style.color && { color: data.style.color }),
                            ...(data.style.cellSize && { cellSize: data.style.cellSize }),
                            ...(data.style.gap && { gap: data.style.gap }),
                        },
                    },
                }),
                ...(data.background && {
                    background: {
                        update: {
                            ...(data.background.type && { type: data.background.type }),
                            ...(data.background.value && { value: data.background.value }),
                        },
                    },
                }),
                ...(data.stamp && {
                    stamp: {
                        update: {
                            ...(data.stamp.type && { type: data.stamp.type }),
                            ...(data.stamp.value && { value: data.stamp.value }),
                            ...(data.stamp.size && { size: data.stamp.size }),
                            ...(data.stamp.opacity && { opacity: data.stamp.opacity }),
                        },
                    },
                }),
                ...(data.cells && {
                    cells: {
                        update: data.cells.map((cell) => ({
                            where: { id: cell.id },
                            data: {
                                ...(cell.content && { content: cell.content }),
                                ...(cell.position && { position: cell.position }),
                                ...(cell.validated !== undefined && { validated: cell.validated }),
                            },
                        })),
                    },
                }),
                ...(data.status && { status: data.status }),
            },
            include: {
                cells: true,
                background: true,
                stamp: true,
                style: true,
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

export async function DELETE(req: Request, { params }: { params: ParamsType }) {
    const session = await auth();
    const { bingoId: id } = await params;

    try {
        const bingo = await prisma.bingo.findUnique({
            where: { id: id },
        });

        if (!bingo) {
            throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
        }

        if (bingo.userId !== session?.user?.id) {
            throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
        }

        await prisma.bingo.delete({
            where: { id: id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleAPIError(error);
    }
}
