"use server";

import { Bingo, CellLocalImage, OtherLocalImage, ImageUploadResponse } from "@/types/types";
import { uploadFile } from "@/lib/s3upload";
import { auth } from "@/lib/auth";

export async function uploadPendingImages(state: Bingo): Promise<ImageUploadResponse> {
    if (!state.localImages?.length) return {};

    const session = await auth();

    if (!session?.user) {
        throw new Error("You must be logged in to upload images");
    }

    const result: ImageUploadResponse = {};

    const cellImages = state.localImages.filter((img): img is CellLocalImage => img.type === "cell");
    const backgroundImage = state.localImages.find((img): img is OtherLocalImage => img.type === "background");
    const stampImage = state.localImages.find((img): img is OtherLocalImage => img.type === "stamp");

    // Process cell images
    if (cellImages.length > 0) {
        result.cellImages = [];
        for (const image of cellImages) {
            try {
                // For base64 data URLs
                const response = await fetch(image.url);
                const blob = await response.blob();
                const file = new File([blob], image.fileInfo.name, { type: image.fileInfo.type });

                // Upload to S3
                const url = await uploadFile(file, image.fileInfo.name);

                if (url) {
                    result.cellImages.push({ position: image.position, url });
                }
            } catch (error) {
                console.error(`Failed to upload cell image at position ${image.position}:`, error);
                throw new Error(
                    `Failed to upload cell image: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }
    }

    // Process background image
    if (backgroundImage) {
        try {
            const response = await fetch(backgroundImage.url);
            const blob = await response.blob();
            const file = new File([blob], backgroundImage.fileInfo.name, { type: backgroundImage.fileInfo.type });

            // Upload to S3
            const url = await uploadFile(file, `bg-${Date.now()}-${backgroundImage.fileInfo.name}`);

            if (url) {
                result.backgroundImage = url;

                // Clean up local object URL
                if (backgroundImage.url.startsWith("blob:")) {
                    URL.revokeObjectURL(backgroundImage.url);
                }
            }
        } catch (error) {
            console.error("Failed to upload background image:", error);
            throw new Error(
                `Failed to upload background image: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // Process stamp image
    if (stampImage) {
        try {
            const response = await fetch(stampImage.url);
            const blob = await response.blob();
            const file = new File([blob], stampImage.fileInfo.name, { type: stampImage.fileInfo.type });

            // Upload to S3
            const url = await uploadFile(file, `stamp-${Date.now()}-${stampImage.fileInfo.name}`);

            if (url) {
                result.stampImage = url;

                // Clean up local object URL
                if (stampImage.url.startsWith("blob:")) {
                    URL.revokeObjectURL(stampImage.url);
                }
            }
        } catch (error) {
            console.error("Failed to upload stamp image:", error);
            throw new Error(`Failed to upload stamp image: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    return result;
}
