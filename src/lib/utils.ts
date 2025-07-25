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
    const connectionsToNotify = Array.from(connections.entries()).filter(
        ([_, connection]) => connection.bingoId === bingoId
    );

    if (connectionsToNotify.length === 0) {
        return;
    }

    const promises = connectionsToNotify.map(async ([connectionId, connection]) => {
        try {
            await connection.writer.write(`data: ${JSON.stringify(event)}\n\n`);
        } catch (error) {
            // Remove failed connection
            connections.delete(connectionId);
        }
    });

    await Promise.allSettled(promises);
}
