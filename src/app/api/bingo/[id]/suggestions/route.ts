import { authOptions } from "@/lib/auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { SuggestionPatchRequest } from "@/types/types";
import { Suggestion } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<Response> {
    try {
        const headers = new Headers({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });

        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Initial suggestions fetch
        try {
            const suggestions = await prisma.suggestion.findMany({
                where: { bingoId: params.id },
                orderBy: { createdAt: "desc" },
            });

            await writer.write(`data: ${JSON.stringify(suggestions)}\n\n`);
        } catch (error) {
            throw new APIError("Failed to fetch initial suggestions", APIErrorCode.SUGGESTION_FETCH_ERROR, 500);
        }

        // Poll for new suggestions
        const interval = setInterval(() => {
            void (async (): Promise<void> => {
                try {
                    const newSuggestions = await prisma.suggestion.findMany({
                        where: {
                            bingoId: params.id,
                            createdAt: { gt: new Date(Date.now() - 5000) },
                        },
                    });

                    if (newSuggestions.length > 0) {
                        await writer.write(`data: ${JSON.stringify(newSuggestions)}\n\n`);
                    }
                } catch (error) {
                    console.error("Polling error:", error);
                    // Don't throw here - keep connection alive
                }
            })();
        }, 5000);

        // Cleanup on disconnect
        req.signal.addEventListener("abort", () => {
            clearInterval(interval);
            writer.close().catch((error) => {
                console.error("Stream close error:", error);
            });
        });

        return new Response(stream.readable, {
            headers,
            status: 200,
        });
    } catch (error) {
        return handleAPIError(error);
    }
}

export async function POST(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const { content } = (await req.json()) as Partial<Suggestion>;

        if (!content) {
            throw new APIError("Add text to your suggestion", APIErrorCode.CONTENT_REQUIRED, 402);
        }

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

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        const { suggestionId, status, position } = (await req.json()) as SuggestionPatchRequest;

        const bingo = await prisma.bingo.findUnique({
            where: { id: params.id },
        });

        if (!bingo) {
            throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
        }

        if (bingo.userId !== session?.user?.id || !session?.user) {
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
