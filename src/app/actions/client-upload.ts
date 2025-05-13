"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_S3_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// export async function generatePresignedUrl(fileName: string, contentType: string) {
//     try {
//         const sanitizedKey = fileName
//             .replace(/[^a-zA-Z0-9-_]/g, "-")
//             .toLowerCase()
//             .replace(/[^a-z0-9\-_.]/g, "");

//         const uniqueKey = `${Date.now()}-${sanitizedKey}`;

//         // Create a presigned URL that allows uploading for 5 minutes
//         const url = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${uniqueKey}`;

//         return {
//             uploadUrl: url,
//             key: uniqueKey,
//             publicUrl: url
//         };
//     } catch (error) {
//         console.error("Error generating presigned URL:", error);
//         throw new Error("Failed to generate upload URL");
//     }
// }

export async function uploadFileToS3(fileBuffer: ArrayBuffer, fileName: string, contentType: string) {
    try {
        const buffer = Buffer.from(fileBuffer);

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
        throw new Error("Failed to upload file");
    }
}
