import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";
import { connections } from "@/lib/utils";

type ParamsType = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: ParamsType }): Promise<Response> {
    const { id: bingoId } = await params;

    try {
        // Verify bingo exists
        const bingo = await prisma.bingo.findUnique({
            where: { id: bingoId },
            select: { id: true },
        });

        if (!bingo) {
            throw new APIError("Bingo not found", APIErrorCode.BINGO_NOT_FOUND, 444);
        }

        console.log("Creating SSE connection for bingo:", bingoId);

        const headers = new Headers({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        });

        const stream = new TransformStream();
        const writer = stream.writable.getWriter();
        const connectionId = `${bingoId}-${Date.now()}-${Math.random()}`;

        // Store connection for broadcasting
        connections.set(connectionId, { writer, bingoId });
        console.log(`Stored connection ${connectionId} for bingo ${bingoId}. Total connections: ${connections.size}`);

        // Cleanup on disconnect
        req.signal.addEventListener("abort", () => {
            console.log(`Connection ${connectionId} disconnected for bingo ${bingoId}`);
            connections.delete(connectionId);
            try {
                void writer.close();
            } catch (error) {
                console.error("Stream close error:", error);
            }
        });

        // Send initial connection message after returning the response
        setImmediate(() => {
            writer
                .write(`data: ${JSON.stringify({ type: "connected", bingoId, timestamp: Date.now() })}\n\n`)
                .then(() => {
                    console.log("Initial connection message sent for bingo:", bingoId);
                })
                .catch((error) => {
                    console.error("Failed to send initial connection message:", error);
                    connections.delete(connectionId);
                });
        });

        console.log("Returning SSE response for bingo:", bingoId);

        return new Response(stream.readable, {
            headers,
            status: 200,
        });
    } catch (error) {
        console.error("Error in SSE GET handler:", error);
        return handleAPIError(error);
    }
}
