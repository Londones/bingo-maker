"use server";

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { APIError, APIErrorCode } from "@/lib/errors";
import { handleAPIError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new APIError("Unauthorized", APIErrorCode.UNAUTHORIZED, 401);
    }

    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      throw new APIError("Missing fileName or contentType", APIErrorCode.INVALID_REQUEST, 400);
    }

    const s3Client = new S3Client({
      region: process.env.NEXT_PUBLIC_AWS_S3_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

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

    const uploadURL = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    const publicUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${uniqueKey}`;

    return NextResponse.json({
      uploadURL,
      key: uniqueKey,
      publicUrl,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return handleAPIError(error);
  }
}
