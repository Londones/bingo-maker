import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";
import type { CellLocalImage, GradientConfig, LocalImage } from "@/types/types";

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

export function handleLocalImage(file: File, type: string, position?: number) {
    const localUrl = URL.createObjectURL(file);
    return {
        type,
        url: localUrl,
        position,
        fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
        },
    } as LocalImage;
}

export const isCellLocalImage = (image: LocalImage): image is CellLocalImage => {
    return image.type === "cell";
};

export const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
