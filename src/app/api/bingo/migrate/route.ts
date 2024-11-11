import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bingoIds, authorToken, userId } = await req.json();

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

        return NextResponse.json({
            success: true,
            migratedCount: updated.count,
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: "Failed to migrate bingos" }, { status: 500 });
    }
}
