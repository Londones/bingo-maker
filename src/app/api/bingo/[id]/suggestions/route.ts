import { authOptions } from "@/lib/auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const headers = new Headers({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
    });

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const suggestions = await prisma.suggestion.findMany({
        where: { bingoId: params.id },
        orderBy: { createdAt: "desc" },
    });

    writer.write(`data: ${JSON.stringify(suggestions)}\n\n`);

    const interval = setInterval(async () => {
        const newSuggestions = await prisma.suggestion.findMany({
            where: {
                bingoId: params.id,
                createdAt: { gt: new Date(Date.now() - 5000) },
            },
        });
        if (newSuggestions.length > 0) {
            writer.write(`data: ${JSON.stringify(newSuggestions)}\n\n`);
        }
    }, 5000);

    req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        writer.close();
    });

    return new Response(stream.readable, { headers });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const { content } = await req.json();
        const suggestion = await prisma.suggestion.create({
            data: {
                content,
                bingoId: params.id,
            },
        });

        if (!suggestion) {
            throw new APIError("Failed to create suggestion", APIErrorCode.FAILED_TO_CREATE_SUGGESTION, 559);
        }

        return NextResponse.json(suggestion);
    } catch (error) {
        return handleAPIError(error);
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        const { suggestionId, status, position } = await req.json();

        const bingo = await prisma.bingo.findUnique({
            where: { id: params.id },
        });

        if (!bingo || bingo.userId !== session?.user?.id) {
            throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
        }

        const suggestion = await prisma.suggestion.update({
            where: { id: suggestionId },
            data: { status },
        });

        if (!suggestion) {
            throw new APIError("Failed to update suggestion", APIErrorCode.FAILED_TO_UPDATE_SUGGESTION, 560);
        }

        if (status === "added") {
            await prisma.bingoCell.create({
                data: {
                    content: suggestion.content,
                    position: position,
                    bingoId: bingo.id,
                },
            });
        }

        return NextResponse.json(suggestion);
    } catch (error) {
        return handleAPIError(error);
    }
}
