import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "./core";
import { utapi } from "@/lib/uploadthing";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const { GET, POST } = createRouteHandler({
    router: uploadRouter,
});

export async function DELETE(req: Request) {
    try {
        const { fileKey } = await req.json();
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "You must be logged in to delete files" }, { status: 401 });
        }

        await utapi.deleteFiles([fileKey]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete file" },
            { status: 500 }
        );
    }
}
