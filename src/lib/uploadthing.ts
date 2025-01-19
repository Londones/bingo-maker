import { createUploadthing, type FileRouter } from "uploadthing/next";
import { useSession } from "next-auth/react";
import { UploadThingError, UTApi } from "uploadthing/server";

const f = createUploadthing();
export const utapi = new UTApi();

export const uploadRouter = {
    backgroundUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(() => {
            const { data: session, status } = useSession();

            if (status !== "authenticated") {
                throw new UploadThingError("You must be logged in to upload custom backgrounds");
            }

            return { userId: session.user.id };
        })
        // eslint-disable-next-line @typescript-eslint/require-await
        .onUploadComplete(async ({ file }) => {
            return { url: file.url };
        }),

    stampUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(() => {
            const { data: session, status } = useSession();

            if (status !== "authenticated") {
                throw new UploadThingError("You must be logged in to upload custom stamps");
            }

            return { userId: session.user.id };
        })
        // eslint-disable-next-line @typescript-eslint/require-await
        .onUploadComplete(async ({ file }) => {
            return { url: file.url };
        }),

    cellBackgroundUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(() => {
            const { data: session, status } = useSession();

            if (status !== "authenticated") {
                throw new UploadThingError("You must be logged in to upload custom cell backgrounds");
            }

            return { userId: session.user.id };
        })
        // eslint-disable-next-line @typescript-eslint/require-await
        .onUploadComplete(async ({ file }) => {
            return { url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
