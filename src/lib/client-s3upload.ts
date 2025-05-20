"use client";

import { uploadFileToS3 } from "@/app/actions/client-upload";
import { UploadedImageInfo } from "@/types/types";
import { toast } from "sonner";
import { trackImage } from "./image-tracker";
import { UploadError } from "./errors";

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
    const filesToUpload = new Map<string, { file: File; type: "cell" | "background" | "stamp"; position?: number }>();
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
      }

      let publicUrl: string;

      // For files larger than 3MB, use pre-signed URL approach
      if (file.size > 3 * 1024 * 1024) {
        // Step 1: Get a pre-signed URL from our API endpoint
        const response = await fetch("/api/s3-presigned-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName,
            contentType: file.type,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to get upload URL: ${errorData.error || response.statusText}`);
        }

        const { uploadURL, publicUrl: signedPublicUrl } = await response.json();

        // Step 2: Upload directly to S3 using the pre-signed URL
        const uploadResponse = await fetch(uploadURL as string, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload file to S3: ${uploadResponse.statusText}`);
        }

        publicUrl = signedPublicUrl;
      } else {
        // For smaller files, continue using the server action approach
        const fileBuffer = await file.arrayBuffer();
        const pUrl = await uploadFileToS3(fileBuffer, fileName, file.type);
        if (pUrl) {
          publicUrl = pUrl;
        } else {
          throw new Error("Failed to upload file to S3");
        }
      }

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
    // Check for error code property instead of using instanceof since server errors lose their prototype chain
    const errorMessage =
      error && typeof error === "object" && "code" in error && "message" in error
        ? String(error.message)
        : error instanceof UploadError
        ? error.message
        : "Unknown error";

    toast.error(`Upload failed: ${errorMessage}`);
    throw error;
  }
};
