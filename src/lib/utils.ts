import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";
import type { GradientConfig } from "@/types/types";

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
