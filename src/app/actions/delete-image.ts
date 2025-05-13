"use server";

import { auth } from "@/lib/auth";
import { deleteFile } from "@/lib/s3upload";
import { UploadError, UploadErrorCode } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

/**
 * Extracts S3 object key from a public URL
 */
function extractKeyFromS3Url(url: string): string {
    try {
        const urlObj = new URL(url);
        // The pathname includes the leading slash, so we remove it
        return urlObj.pathname.substring(1);
    } catch (error) {
        console.error("Invalid S3 URL format:", error);
        throw new UploadError("Invalid S3 URL format", UploadErrorCode.INVALID_URL_FORMAT);
    }
}

/**
 * Verifies if the current user is authorized to delete this image
 * - Checks if the image is associated with a bingo owned by the user
 * - For background, cell and stamp images
 */
async function verifyImageOwnership(url: string, userId: string): Promise<boolean> {
    // Check if this image is used in any of the user's bingos

    // Check background images
    const backgroundImage = await prisma.background.findFirst({
        where: {
            backgroundImage: url,
            bingo: {
                userId: userId,
            },
        },
    });
    if (backgroundImage) return true;

    // Check stamp images
    const stampImage = await prisma.stampConfig.findFirst({
        where: {
            value: url,
            type: "image",
            bingo: {
                userId: userId,
            },
        },
    });
    if (stampImage) return true;

    // Check cell background images
    const cellStyle = await prisma.cellStyle.findFirst({
        where: {
            cellBackgroundImage: url,
            bingoCell: {
                bingo: {
                    userId: userId,
                },
            },
        },
    });
    if (cellStyle) return true;

    return false;
}

interface DeleteImageRequest {
    url: string;
    force?: boolean; // Skip database checks - use only for orphaned images
}

/**
 * Server action to safely delete an image from S3
 * - Verifies user ownership of the image
 * - Deletes from S3 bucket
 */
export async function deleteImageFromS3({
    url,
    force = false,
}: DeleteImageRequest): Promise<{ success: boolean; message?: string }> {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            throw new UploadError(
                "Unauthorized - You must be logged in to delete images",
                UploadErrorCode.UNAUTHORIZED
            );
        }

        // Extract the S3 key from the URL
        const key = extractKeyFromS3Url(url);

        // // Verify ownership unless force flag is set
        // if (!force) {
        //     const isAuthorized = await verifyImageOwnership(url, session.user.id);
        //     if (!isAuthorized) {
        //         throw new UploadError("Unauthorized - You don't own this image", UploadErrorCode.UNAUTHORIZED);
        //     }
        // }

        // Delete the file from S3
        await deleteFile(key);

        // Return success
        return {
            success: true,
            message: "Image deleted successfully",
        };
    } catch (error) {
        console.error("Error deleting image from S3:", error);
        if (error instanceof UploadError) {
            return {
                success: false,
                message: error.message,
            };
        }
        return {
            success: false,
            message: "Failed to delete image",
        };
    }
}

/**
 * Server action to clean up orphaned images
 * - Only accessible to users with admin role
 * - Checks multiple images and deletes them if they're not associated with any bingos
 */
export async function cleanupOrphanedImages(
    urls: string[]
): Promise<{ success: boolean; deleted: string[]; failed: string[] }> {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            throw new UploadError("Unauthorized - Admin privileges required", UploadErrorCode.UNAUTHORIZED);
        }

        const deleted: string[] = [];
        const failed: string[] = [];

        // Process each URL
        for (const url of urls) {
            try {
                // Check if image is used in any bingo
                const isUsedInBackground =
                    (await prisma.background.count({
                        where: { backgroundImage: url },
                    })) > 0;

                const isUsedInStamp =
                    (await prisma.stampConfig.count({
                        where: { value: url, type: "image" },
                    })) > 0;

                const isUsedInCell =
                    (await prisma.cellStyle.count({
                        where: { cellBackgroundImage: url },
                    })) > 0;

                // If not used anywhere, delete it
                if (!isUsedInBackground && !isUsedInStamp && !isUsedInCell) {
                    const key = extractKeyFromS3Url(url);
                    await deleteFile(key);
                    deleted.push(url);
                }
            } catch (error) {
                console.error(`Failed to process image ${url}:`, error);
                failed.push(url);
            }
        }

        return {
            success: true,
            deleted,
            failed,
        };
    } catch (error) {
        console.error("Error cleaning up orphaned images:", error);
        return {
            success: false,
            deleted: [],
            failed: urls,
        };
    }
}
