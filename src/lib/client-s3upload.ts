"use client";

import { uploadFileToS3 } from "@/app/actions/client-upload";
import { UploadedImageInfo } from "@/app/actions/s3upload";
import { toast } from "sonner";
import { trackImage } from "./image-tracker";

// Cache to store uploaded files, persisted across the session
interface CachedUpload {
    url: string;
    type: "cell" | "background" | "stamp";
    position?: number;
    uploadTime: number;
}

// Initialize cache from sessionStorage to persist between component renders
const initializeCache = (): Map<string, CachedUpload> => {
    if (typeof window === "undefined") return new Map();

    try {
        const cached = sessionStorage.getItem("uploadedFilesCache");
        if (cached) {
            const parsedCache = JSON.parse(cached) as [string, CachedUpload][];
            return new Map<string, CachedUpload>(parsedCache);
        }
    } catch (error) {
        console.error("Failed to load upload cache from sessionStorage:", error);
    }

    return new Map<string, CachedUpload>();
};

// Cache for uploaded files - key format: "type-position-filename-lastModified"
const uploadedFilesCache = initializeCache();

// Save cache to sessionStorage
const saveCache = () => {
    if (typeof window === "undefined") return;

    try {
        // Clean expired items before saving (older than 4 hours)
        const now = Date.now();
        for (const [key, value] of uploadedFilesCache.entries()) {
            if (now - value.uploadTime > 4 * 60 * 60 * 1000) {
                uploadedFilesCache.delete(key);
            }
        }

        sessionStorage.setItem("uploadedFilesCache", JSON.stringify(Array.from(uploadedFilesCache.entries())));
    } catch (error) {
        console.error("Failed to save upload cache to sessionStorage:", error);
    }
};

// Compute a cache key for a file
const computeCacheKey = (file: File, type: "cell" | "background" | "stamp", position?: number): string => {
    return `${type}-${position ?? "na"}-${file.name}-${file.lastModified}`;
};

// Main function to handle the complete upload flow
export const uploadImagesToBingo = async (
    files: Map<string, { file: File; type: "cell" | "background" | "stamp"; position?: number }>
): Promise<UploadedImageInfo[]> => {
    try {
        // Track which files need upload vs which are already cached
        const filesToUpload = new Map<
            string,
            { file: File; type: "cell" | "background" | "stamp"; position?: number }
        >();
        const cachedResults: UploadedImageInfo[] = [];

        // Check cache for each file
        for (const [key, fileData] of files.entries()) {
            const { file, type, position } = fileData;
            const cacheKey = computeCacheKey(file, type, position);

            const cachedUpload = uploadedFilesCache.get(cacheKey);
            const now = Date.now();

            if (cachedUpload && now - cachedUpload.uploadTime < 4 * 60 * 60 * 1000) {
                cachedResults.push({
                    url: cachedUpload.url,
                    type: cachedUpload.type,
                    position: cachedUpload.position,
                });
            } else {
                filesToUpload.set(key, fileData);
            }
        }

        // If all files are cached, return the cached URLs
        if (filesToUpload.size === 0) {
            return cachedResults;
        }

        // Upload files directly to S3
        const uploadPromises = Array.from(filesToUpload.entries()).map(async ([fileKey, fileData]) => {
            const { file, type, position } = fileData;

            // Generate a file key based on type
            let fileName = file.name;
            if (type === "background") {
                fileName = `bg-${fileName}`;
            } else if (type === "stamp") {
                fileName = `stamp-${fileName}`;
            } // Convert File to ArrayBuffer
            const fileBuffer = await file.arrayBuffer();

            // Check if file is under the size limit for server actions (4MB to be safe)
            if (file.size > 4 * 1024 * 1024) {
                // For larger files, show a warning and suggest compression
                throw new Error("Image file is too large (over 4MB). Please compress the image before uploading.");
            }

            // Upload through server action for smaller files
            const publicUrl = await uploadFileToS3(fileBuffer, fileName, file.type);

            // Cache the successful upload
            const cacheKey = computeCacheKey(file, type, position);
            uploadedFilesCache.set(cacheKey, {
                url: publicUrl,
                type,
                position,
                uploadTime: Date.now(),
            });
            saveCache();

            // Track the uploaded image for orphaned cleanup
            trackImage({
                url: publicUrl,
                type,
                position,
            });

            // Return the uploaded image info with the public URL
            return {
                url: publicUrl,
                type,
                position,
            };
        });

        // Wait for all uploads to complete
        const newlyUploadedImages = await Promise.all(uploadPromises);

        // Combine new uploads with cached results
        return [...newlyUploadedImages, ...cachedResults];
    } catch (error) {
        console.error("Error in upload process:", error);
        toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error;
    }
};
