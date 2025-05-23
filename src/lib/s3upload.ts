import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Create the S3 client without direct credentials - these will be obtained from a server action
const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_S3_REGION!,
    // Remove hardcoded credentials as they're not accessible on the client
    // We'll use presigned URLs or server actions instead
});

// Helper function to convert File to Buffer
const fileToBuffer = async (file: File): Promise<Buffer> => {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
};

export const getPublicUrl = (key: string): string => {
    return `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${key}`;
};

export const uploadFile = async (file: File, key: string) => {
    try {
        // Check if the file is a valid file
        if (file.size === 0) {
            throw new Error("File is empty");
        }

        // Convert File to Buffer before sending to S3
        const fileBuffer = await fileToBuffer(file);

        const sanitizedKey = key
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .toLowerCase()
            .replace(/[^a-z0-9\-_.]/g, "");
        const uniqueKey = `${Date.now()}-${sanitizedKey}`;

        const sendRes = await s3Client.send(
            new PutObjectCommand({
                Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
                Key: uniqueKey,
                Body: fileBuffer,
                ContentType: file.type,
            })
        );

        const meta = sendRes.$metadata;

        if (meta.httpStatusCode !== 200) {
            throw new Error(`Error uploading file, with status: ${meta.httpStatusCode}`);
        }

        const url = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${uniqueKey}`;
        return url;
    } catch (error) {
        console.error("Error uploading file", error);
        throw error;
    }
};

export const deleteFile = async (key: string) => {
    try {
        const sendRes = await s3Client.send(
            new DeleteObjectCommand({
                Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
                Key: key,
            })
        );
        const meta = sendRes.$metadata;
        if (meta.httpStatusCode !== 204) {
            throw new Error(`Error deleting file, with status: ${meta.httpStatusCode}`);
        }
    } catch (error) {
        console.error("Error deleting file", error);
        throw error;
    }
};

export const validateFile = (blob: Blob): Promise<boolean> => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(blob.type)) {
        return Promise.resolve(false);
    }

    const validSize = blob.size <= 4 * 1024 * 1024;
    if (!validSize) {
        return Promise.resolve(false);
    }

    return Promise.resolve(true);
};
