import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EditorByIdClient from "@/components/editor/editor-by-id-client";

export default async function EditorWithIdPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, auth()]);

  const bingo = await prisma.bingo.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!bingo) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Bingo not found</div>
      </div>
    );
  }

  // Account-owned boards: enforce ownership strictly on the server before any editor code loads
  if (bingo.userId) {
    if (session?.user?.id !== bingo.userId) {
      redirect(`/bingo/${id}`);
    }
    return <EditorByIdClient id={id} serverAuthorized={true} />;
  }

  // Unclaimed guest board (userId is null): verify browser authorToken on the client before loading Editor
  return <EditorByIdClient id={id} serverAuthorized={false} />;
}
