"use server";

import { Bingo, CellLocalImage, OtherLocalImage } from "@/types/types";
import { utapi } from "@/lib/uploadthing";
import { auth } from "@/lib/auth";

type UploadResult = {
    cellImages?: { position: number; url: string }[];
    backgroundImage?: string;
    stampImage?: string;
};

export async function uploadPendingImages(state: Bingo): Promise<UploadResult> {
    const session = await auth();

    if (!session?.user) {
        throw new Error("You must be logged in to upload images");
    }

    if (!state.localImages?.length) return {};

    const result: UploadResult = {};

    const cellImages = state.localImages.filter((img): img is CellLocalImage => img.type === "cell");
    const backgroundImage = state.localImages.find((img): img is OtherLocalImage => img.type === "background");
    const stampImage = state.localImages.find((img): img is OtherLocalImage => img.type === "stamp");

    for (const image of cellImages) {
        const response = await utapi.uploadFiles(image.file);
        if (response.data) {
            result.cellImages?.push({
                position: image.position,
                url: response.data.url,
            });
            URL.revokeObjectURL(image.url);
        } else {
            throw new Error("Failed to upload cell image");
        }
    }

    if (backgroundImage) {
        const response = await utapi.uploadFiles(backgroundImage.file);
        if (response.data) {
            result.backgroundImage = response.data.url;
            URL.revokeObjectURL(backgroundImage.url);
        } else {
            throw new Error("Failed to upload background image");
        }
    }

    if (stampImage) {
        const response = await utapi.uploadFiles(stampImage.file);
        if (response.data) {
            result.stampImage = response.data.url;
            URL.revokeObjectURL(stampImage.url);
        } else {
            throw new Error("Failed to upload stamp image");
        }
    }

    return result;
}
