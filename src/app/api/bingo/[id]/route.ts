import { buildBackground, buildStamp, buildCellUpdate, buildStyle } from "@/lib/builders";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { BingoPatch } from "@/types/types";
import { bingoPatchSchema } from "@/schemas";
import { ZodError } from "zod";

type ParamsType = Promise<{ id: string }>;

export async function GET(req: Request, { params }: { params: ParamsType }) {
    const { id } = await params;
    const session = await auth();

    if (!id) {
        throw new APIError("Missing ID", APIErrorCode.MISSING_ID_OR_SHARE_TOKEN, 445);
    }

    try {
        const bingo = await prisma.bingo.findUnique({
            where: { id },
            include: {
                cells: { include: { cellStyle: true } },
                background: true,
                stamp: true,
                style: true,
            },
        });

        if (!bingo) {
            throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
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
        // Get session and raw data
        const session = await auth();
        const rawData = await req.json();

        try {
            // First get the existing bingo to get current gridSize
            const existingBingo = await prisma.bingo.findUnique({
                where: { id },
                select: {
                    id: true,
                    userId: true,
                    authorToken: true,
                    gridSize: true, // Include gridSize for validation context
                },
            });

            if (!existingBingo) {
                throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
            }

            // Add gridSize to validation context if not provided in update
            if (!rawData.gridSize && existingBingo.gridSize) {
                rawData.gridSize = existingBingo.gridSize;
            }

            // Validate the patch data against our schema
            const data: BingoPatch = bingoPatchSchema.parse(rawData);
            const clientToken = data.authorToken;

            // Authorization check
            const isOwner =
                (session?.user?.id && existingBingo.userId === session.user.id) ||
                (clientToken && existingBingo.authorToken === clientToken);

            if (!isOwner) {
                throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
            }

            delete data.authorToken;
            const updateData = {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.titleWidth !== undefined && { titleWidth: data.titleWidth }),
                ...(data.style !== undefined && { style: { update: buildStyle(data.style) } }),
                ...(data.background !== undefined && {
                    background: { update: buildBackground(data.background) },
                }),
                ...(data.stamp !== undefined && { stamp: { update: buildStamp(data.stamp) } }),
                ...(data.cells !== undefined && { cells: { update: buildCellUpdate(data.cells) } }),
                ...(data.status !== undefined && { status: data.status }),
                ...(data.gridSize !== undefined && { gridSize: data.gridSize }),
            };

            const updated = await prisma.bingo.update({
                where: { id },
                data: updateData,
                include: {
                    cells: {
                        include: { cellStyle: true },
                    },
                    background: true,
                    stamp: true,
                    style: true,
                },
            });

            return NextResponse.json(updated);
        } catch (error) {
            // Handle validation errors specifically
            if (error instanceof ZodError) {
                return NextResponse.json(
                    {
                        error: "Validation error",
                        details: error.errors,
                    },
                    { status: 400 }
                );
            }
            throw error; // Let the outer catch handle other errors
        }
    } catch (error) {
        return handleAPIError(error);
    }
}

export async function DELETE(req: Request, { params }: { params: ParamsType }) {
    const session = await auth();
    const { id } = await params;

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
