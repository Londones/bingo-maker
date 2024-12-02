import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { authOptions } from "@/lib/auth";
import { handleAPIError } from "@/lib/api-utils";
import { MigrateRequest } from "@/types/types";

export async function POST(req: Request): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED);
    }

    const { bingoIds, authorToken, userId } = (await req.json()) as MigrateRequest;

    try {
        const updated = await prisma.bingo.updateMany({
            where: {
                id: { in: bingoIds },
                authorToken: authorToken,
                userId: null,
            },
            data: {
                userId: userId,
                authorToken: null,
            },
        });

        if (updated.count === 0) {
            throw new APIError("No bingos found to migrate", APIErrorCode.BINGO_NOT_FOUND, 444);
        }

        return NextResponse.json({
            success: true,
            migratedCount: updated.count,
        });
    } catch (error) {
        return handleAPIError(error);
    }
}
