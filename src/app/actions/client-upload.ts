"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { UploadError, UploadErrorCode } from "@/lib/errors";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function generatePresignedUrl(fileName: string, contentType: string) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    throw new UploadError("Unauthorized - You must be logged in to upload files", UploadErrorCode.UNAUTHORIZED);
  }
  try {
    const sanitizedKey = fileName
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9\-_.]/g, "");

    const uniqueKey = `${Date.now()}-${sanitizedKey}`;

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
      Key: uniqueKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    const publicUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${uniqueKey}`;

    return {
      uploadUrl,
      key: uniqueKey,
      publicUrl,
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    if (error instanceof UploadError) {
      throw error;
    } else if (error instanceof Error) {
      throw new Error("An unexpected error occurred during file upload");
    }
  }
}

// Legacy direct upload function - keep for small files or fallback
export async function uploadFileToS3(fileBuffer: ArrayBuffer, fileName: string, contentType: string) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    throw new UploadError("Unauthorized - You must be logged in to upload files", UploadErrorCode.UNAUTHORIZED);
  }
  try {
    const buffer = Buffer.from(fileBuffer);

    if (buffer.length > 4 * 1024 * 1024) {
      throw new UploadError("File size exceeds the limit of 4MB", UploadErrorCode.INVALID_FILE_SIZE);
    }

    const sanitizedKey = fileName
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9\-_.]/g, "");

    const uniqueKey = `${Date.now()}-${sanitizedKey}`;

    const sendRes = await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
        Key: uniqueKey,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const meta = sendRes.$metadata;

    if (meta.httpStatusCode !== 200) {
      throw new Error(`Error uploading file, with status: ${meta.httpStatusCode}`);
    }

    const url = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${uniqueKey}`;
    return url;
  } catch (error) {
    console.error("Error uploading file from server action:", error);
    if (error instanceof UploadError) {
      throw error;
    } else if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unexpected error occurred during file upload");
    }
  }
}
