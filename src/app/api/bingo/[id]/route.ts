import { Prisma } from "@prisma/client";
import { buildBackground, buildStamp, buildCellUpdate, buildStyle } from "@/lib/builders";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { Background, Bingo, BingoPatch, CellStyle, Stamp, Style } from "@/types/types";
import { bingoPatchSchema } from "@/schemas/schemas";
import { ZodError } from "zod";
import { broadcastBingoUpdate } from "@/lib/utils";

type ParamsType = Promise<{ id: string }>;

export async function GET(req: Request, { params }: { params: ParamsType }) {
    const [{ id }, session] = await Promise.all([params, auth()]);

    if (!id) {
        throw new APIError("Missing ID", APIErrorCode.MISSING_ID_OR_SHARE_TOKEN, 445);
    }

    try {
        const bingo = await prisma.bingo.findUnique({
            where: { id },
            include: {
                cells: true,
            },
        });

        if (!bingo) {
            throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
        }

        const typedBackground = bingo.background as unknown as Background | null;

        bingo.cells.forEach((cell) => {
            const cellStyle = cell.cellStyle as unknown as CellStyle | null;
            if (cellStyle?.cellBackgroundImage && !/%[\dA-Fa-f]{2}/.test(cellStyle.cellBackgroundImage)) {
                cellStyle.cellBackgroundImage = encodeURI(cellStyle.cellBackgroundImage);
            }
        });

        if (typedBackground?.backgroundImage && !/%[\dA-Fa-f]{2}/.test(typedBackground.backgroundImage)) {
            typedBackground.backgroundImage = encodeURI(typedBackground.backgroundImage);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { authorToken, ...bingoWithoutToken } = bingo;

        const isAuthor = session?.user?.id === bingo.userId || false;

        return NextResponse.json({
            ...bingoWithoutToken,
            isAuthor,
        });
    } catch (error) {
        return handleAPIError(error);
    }
}

export async function PATCH(req: Request, { params }: { params: ParamsType }) {
    const { id } = await params;

    try {
        const [session, rawData] = await Promise.all([auth(), req.json()]);

        try {
            const existingBingo = await prisma.bingo.findUnique({
                where: { id },
                select: {
                    id: true,
                    userId: true,
                    authorToken: true,
                    gridSize: true,
                    style: true,
                    background: true,
                    stamp: true,
                    cells: {
                        select: {
                            id: true,
                            cellStyle: true,
                        },
                    },
                },
            });

            if (!existingBingo) {
                throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
            }

            if (!rawData.gridSize && existingBingo.gridSize) {
                rawData.gridSize = existingBingo.gridSize;
            }

            const data: BingoPatch = bingoPatchSchema.parse(rawData);
            const clientToken = data.authorToken;

            const isOwner =
                (session?.user?.id && existingBingo.userId === session.user.id) ||
                (clientToken && existingBingo.authorToken === clientToken);

            if (!isOwner) {
                throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
            }

            delete data.authorToken;

            const existingStyle = (existingBingo.style as unknown as Partial<Style>) ?? {};
            const existingBackground = (existingBingo.background as unknown as Partial<Background>) ?? {};
            const existingStamp = (existingBingo.stamp as unknown as Partial<Stamp>) ?? {};
            const existingCellsMap = new Map<string, CellStyle | null>(
                (existingBingo.cells ?? []).map((c) => [c.id, c.cellStyle as unknown as CellStyle | null])
            );

            const updateData: Prisma.BingoUpdateInput = {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.titleWidth !== undefined && { titleWidth: data.titleWidth }),
                ...(data.style !== undefined && {
                    style: { ...existingStyle, ...buildStyle(data.style) } as Prisma.InputJsonValue,
                }),
                ...(data.background !== undefined && {
                    background: { ...existingBackground, ...buildBackground(data.background) } as Prisma.InputJsonValue,
                }),
                ...(data.stamp !== undefined && {
                    stamp: { ...existingStamp, ...buildStamp(data.stamp) } as Prisma.InputJsonValue,
                }),
                ...(data.cells !== undefined && {
                    cells: { update: buildCellUpdate(data.cells, existingCellsMap) },
                }),
                ...(data.status !== undefined && { status: data.status }),
                ...(data.gridSize !== undefined && { gridSize: data.gridSize }),
            };

            const updated = await prisma.bingo.update({
                where: { id },
                data: updateData,
                include: {
                    cells: true,
                },
            });

            void broadcastBingoUpdate(id, {
                type: "update",
                bingoId: id,
                timestamp: Date.now(),
                data: updated as unknown as Bingo,
            });

            return NextResponse.json(updated);
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

export async function DELETE(req: Request, { params }: { params: ParamsType }) {
    const [session, { id }] = await Promise.all([auth(), params]);

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
