import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";
import type { BingoUpdateEvent, GradientConfig } from "@/types/types";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const generateAuthorToken = (): string => {
    return randomBytes(32).toString("hex");
};

export function serializeGradientConfig(config: GradientConfig): string {
    return JSON.stringify(config);
}

export function deserializeGradientConfig(serialized: string): GradientConfig {
    return JSON.parse(serialized) as GradientConfig;
}

// Store active connections for broadcasting
export const connections = new Map<string, { writer: WritableStreamDefaultWriter; bingoId: string }>();

export async function broadcastBingoUpdate(bingoId: string, event: BingoUpdateEvent) {
    console.log(`Broadcasting update for bingo ${bingoId}. Total connections: ${connections.size}`);

    const connectionsToNotify = Array.from(connections.entries()).filter(
        ([_, connection]) => connection.bingoId === bingoId
    );

    console.log(`Found ${connectionsToNotify.length} connections for bingo ${bingoId}`);

    if (connectionsToNotify.length === 0) {
        console.log("No connections to notify for bingo:", bingoId);
        return;
    }

    const promises = connectionsToNotify.map(async ([connectionId, connection]) => {
        try {
            await connection.writer.write(`data: ${JSON.stringify(event)}\n\n`);
            console.log(`Successfully sent update to connection ${connectionId}`);
        } catch (error) {
            console.error(`Failed to send update to connection ${connectionId}:`, error);
            // Remove failed connection
            connections.delete(connectionId);
        }
    });

    await Promise.allSettled(promises);
    console.log(`Finished broadcasting update for bingo ${bingoId}`);
}
