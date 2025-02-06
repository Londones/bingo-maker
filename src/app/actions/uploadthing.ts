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

    for (const image of cellImages) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const file = new File([blob], image.fileInfo.name, { type: image.fileInfo.type });
        const url = await uploadFile(file, image.fileInfo.name);

        if (url) {
            if (!result.cellImages) {
                result.cellImages = [];
            }
            result.cellImages.push({ position: image.position, url });
            URL.revokeObjectURL(image.url);
        } else {
            throw new Error("Failed to upload cell image");
        }
    }

    if (backgroundImage) {
        const response = await fetch(backgroundImage.url);
        const blob = await response.blob();
        const file = new File([blob], backgroundImage.fileInfo.name, { type: backgroundImage.fileInfo.type });
        const url = await uploadFile(file, backgroundImage.fileInfo.name);

        if (url) {
            result.backgroundImage = url;
            URL.revokeObjectURL(backgroundImage.url);
        } else {
            throw new Error("Failed to upload background image");
        }
    }

    if (stampImage) {
        const response = await fetch(stampImage.url);
        const blob = await response.blob();
        const file = new File([blob], stampImage.fileInfo.name, { type: stampImage.fileInfo.type });
        const url = await uploadFile(file, stampImage.fileInfo.name);

        if (url) {
            result.stampImage = url;
            URL.revokeObjectURL(stampImage.url);
        } else {
            throw new Error("Failed to upload stamp image");
        }
    }

    return result;
}
