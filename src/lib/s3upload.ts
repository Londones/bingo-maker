import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_REGION!,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
    },
});

export const uploadFile = async (file: File, key: string) => {
    try {
        const sendRes = await s3Client.send(
            new PutObjectCommand({
                Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
                Key: key,
                Body: file,
                ACL: "public-read",
            })
        );
        const meta = sendRes.$metadata;
        if (meta.httpStatusCode !== 200) {
            throw new Error(`Error uploading file, with status: ${meta.httpStatusCode}`);
        }

        return `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
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
