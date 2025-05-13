"use server";

import { ImageUploadResponse } from "@/types/types";
import { auth } from "@/lib/auth";
import { UploadError, UploadErrorCode } from "@/lib/errors";

export interface UploadedImageInfo {
    url: string;
    type: "cell" | "background" | "stamp";
    position?: number;
}

// This updated version of uploadPendingImages receives URLs that were directly uploaded to S3
// rather than processing and uploading base64/blob data
export async function uploadPendingImages(uploadedImages: UploadedImageInfo[]): Promise<ImageUploadResponse> {
    if (!uploadedImages?.length) return {};

    const session = await auth();

    if (!session?.user) {
        throw new UploadError("You must be logged in to process images", UploadErrorCode.UNAUTHORIZED);
    }

    const result: ImageUploadResponse = {};

    const cellImages = uploadedImages.filter((img) => img.type === "cell");
    const backgroundImage = uploadedImages.find((img) => img.type === "background");
    const stampImage = uploadedImages.find((img) => img.type === "stamp");

    // Process cell images
    if (cellImages.length > 0) {
        result.cellImages = [];
        for (const image of cellImages) {
            if (!image.position && image.position !== 0) {
                console.error(`Cell image missing position information`);
                continue;
            }
            result.cellImages.push({ position: image.position, url: image.url });
        }
    }

    // Process background image
    if (backgroundImage) {
        result.backgroundImage = backgroundImage.url;
    }

    // Process stamp image
    if (stampImage) {
        result.stampImage = stampImage.url;
    }

    return result;
}
