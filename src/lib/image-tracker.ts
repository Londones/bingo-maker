"use client";

import { deleteImageFromS3 } from "@/app/actions/delete-image";
import { Bingo, BingoCell } from "@/types/types";

// Interface for tracking uploaded images
interface TrackedImage {
    url: string;
    type: "cell" | "background" | "stamp";
    position?: number;
    uploadTime: number;
}

// Global store for tracking uploaded images during the session
const uploadedImages: TrackedImage[] = [];

/**
 * Adds an image to the tracking system
 */
export function trackImage(image: { url: string; type: "cell" | "background" | "stamp"; position?: number }): void {
    uploadedImages.push({
        ...image,
        uploadTime: Date.now(),
    });
}

/**
 * Track multiple images at once
 */
export function trackImages(
    images: Array<{
        url: string;
        type: "cell" | "background" | "stamp";
        position?: number;
    }>
): void {
    images.forEach((img) => trackImage(img));
}

/**
 * Get all tracked URLs
 */
export function getTrackedUrls(): string[] {
    return uploadedImages.map((img) => img.url);
}

/**
 * Check if a URL is being tracked
 */
export function isUrlTracked(url: string): boolean {
    return uploadedImages.some((img) => img.url === url);
}

/**
 * Collect all currently used image URLs in the bingo
 */
export function getActiveImageUrls(state: Bingo): string[] {
    const urls: string[] = [];

    // Background image
    if (state.background?.backgroundImage) {
        urls.push(state.background.backgroundImage);
    }

    // Stamp image
    if (state.stamp?.type === "image" && state.stamp?.value) {
        urls.push(state.stamp.value);
    }

    // Cell background images
    if (state.cells && Array.isArray(state.cells)) {
        state.cells.forEach((cell: BingoCell) => {
            if (cell?.cellStyle?.cellBackgroundImage) {
                urls.push(cell.cellStyle.cellBackgroundImage);
            }
        });
    }

    return urls;
}

/**
 * Clean up orphaned images that were uploaded but are no longer used
 */
export async function cleanupOrphanedImages(bingoState: Bingo): Promise<void> {
    // Only proceed if we have tracked images
    if (uploadedImages.length === 0) return;

    const activeUrls = getActiveImageUrls(bingoState);

    // Find orphaned images (tracked but not active)
    const orphanedImages = uploadedImages.filter((img) => !activeUrls.includes(img.url));

    if (orphanedImages.length === 0) return;

    console.log(`Cleaning up ${orphanedImages.length} orphaned images`);

    // Delete each orphaned image
    const deletePromises = orphanedImages.map(async (img) => {
        try {
            await deleteImageFromS3({
                url: img.url,
                force: true, // Force delete even if not found in DB
            });
            console.log(`Deleted orphaned image: ${img.url}`);
            return img.url;
        } catch (error) {
            console.error(`Failed to delete orphaned image ${img.url}:`, error);
            return null;
        }
    });

    // Wait for all deletions to complete
    const deletedUrls = await Promise.all(deletePromises);

    // Remove successfully deleted images from tracking
    const successfullyDeleted = deletedUrls.filter(Boolean) as string[];

    // Update the tracked images list
    successfullyDeleted.forEach((url) => {
        const index = uploadedImages.findIndex((img) => img.url === url);
        if (index !== -1) {
            uploadedImages.splice(index, 1);
        }
    });
}
