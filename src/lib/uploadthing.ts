import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { UploadError, UploadErrorCode } from "./errors";

const f = createUploadthing();

export const uploadRouter = {
    backgroundUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async () => {
            const session = await getServerSession(authOptions);

            if (!session?.user) {
                throw new UploadError("You must be logged in to upload custom images", UploadErrorCode.UNAUTHORIZED);
            }

            return { userId: session.user.id };
        })
        // eslint-disable-next-line @typescript-eslint/require-await
        .onUploadComplete(async ({ file }) => {
            return { url: file.url };
        }),

    stampUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async () => {
            const session = await getServerSession(authOptions);

            if (!session?.user) {
                throw new UploadError("You must be logged in to upload custom stamps", UploadErrorCode.UNAUTHORIZED);
            }

            return { userId: session.user.id };
        })
        // eslint-disable-next-line @typescript-eslint/require-await
        .onUploadComplete(async ({ file }) => {
            return { url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
