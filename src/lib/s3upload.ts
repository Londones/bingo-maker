import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Helper function to convert File to Buffer
const fileToBuffer = async (file: File): Promise<Buffer> => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const uploadFile = async (file: File, key: string) => {
  try {
    console.log(`Starting upload of file ${file.name} as ${key} (${file.size} bytes)`);

    // Check if the file is a valid file
    if (file.size === 0) {
      throw new Error("File is empty");
    }

    // Convert File to Buffer before sending to S3
    const fileBuffer = await fileToBuffer(file);

    // Log buffer size for debugging
    console.log(`Buffer prepared for upload: ${fileBuffer.length} bytes`);

    const sendRes = await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type,
      })
    );

    const meta = sendRes.$metadata;
    console.log(`Upload response: HTTP ${meta.httpStatusCode}`);

    if (meta.httpStatusCode !== 200) {
      throw new Error(`Error uploading file, with status: ${meta.httpStatusCode}`);
    }

    const url = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${key}`;
    console.log(`Successfully uploaded file. URL: ${url}`);
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
