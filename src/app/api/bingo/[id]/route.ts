import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const bingo = await prisma.bingo.findUnique({
            where: { id: params.id },
            include: { cells: true },
        });

        if (!bingo) {
            return NextResponse.json({ error: "Bingo not found" }, { status: 404 });
        }

        return NextResponse.json(bingo);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch bingo" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    const data = await req.json();

    try {
        const bingo = await prisma.bingo.findUnique({
            where: { id: params.id },
        });

        if (!bingo) {
            return NextResponse.json({ error: "Bingo not found" }, { status: 404 });
        }

        // Check if user has permission to update
        if (bingo.userId !== session?.user?.id && bingo.authorToken !== data.authorToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updated = await prisma.bingo.update({
            where: { id: params.id },
            data: {
                title: data.title,
                style: data.style,
                background: data.background,
                stamp: data.stamp,
                cells: {
                    upsert: data.cells.map((cell: any) => ({
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
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update bingo error:", error);
        return NextResponse.json({ error: "Failed to update bingo" }, { status: 500 });
    }
}
