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
                background: data.background,
                stamp: data.stamp,
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
            },
        });

        return NextResponse.json(bingo);
    } catch (error) {
        console.error("Create bingo error:", error);
        throw new APIError("Failed to create bingo", APIErrorCode.FAILED_TO_CREATE_BINGO, 557);
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const shareToken = searchParams.get("shareToken");

    if (!id && !shareToken) {
        throw new APIError("Missing ID or shareToken", APIErrorCode.MISSING_ID_OR_SHARE_TOKEN, 445);
    }

    try {
        const bingo = await prisma.bingo.findUnique({
            where: shareToken ? { shareToken } : { id },
            include: {
                cells: true,
            },
        });

        if (!bingo) {
            throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
        }

        return NextResponse.json(bingo);
    } catch (error) {
        return handleAPIError(error);
    }
}
