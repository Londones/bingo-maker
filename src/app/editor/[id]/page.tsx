"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useEditor } from "@/hooks/useEditor";
import { useSession } from "next-auth/react";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import Editor from "@/components/editor/editor";
import { useRouter } from "next/navigation";
import { BingoCell } from "@/types/types";

const LoadingComponent = () => (
  <div className="w-full h-screen flex items-center justify-center">
    <div className="animate-pulse text-foreground/50">Loading bingo...</div>
  </div>
);

export default function EditorWithIdPage() {
  const { id } = useParams<{ id: string }>();
  const { state, actions } = useEditor();
  const { data: session } = useSession();
  const router = useRouter();
  const { useGetBingo, useCheckOwnership } = useBingoStorage();

  const { data: bingo, isLoading: isBingoLoading, error } = useGetBingo(id);

  const { data: ownershipData, isLoading: isOwnershipLoading } = useCheckOwnership(id, {
    enabled: !!bingo && !!session?.user?.id && bingo.userId !== session.user.id,
  });

  useEffect(() => {
    if (bingo && state.id !== bingo.id) {
      // Check if user is authorized to edit
      const isAuthor = !!session?.user?.id && bingo.userId === session?.user?.id;
      const isOwner = !!ownershipData?.isOwner;

      if (!isAuthor && !isOwner && !isOwnershipLoading) {
        // Redirect to view-only page if not authorized
        router.push(`/bingo/${id}`);
        return;
      }

      // Load the bingo data into the editor
      const orderedCells: BingoCell[] = Array(bingo.gridSize ** 2).fill(null);
      bingo.cells.forEach((cell) => {
        orderedCells[cell.position] = cell;
      });
      bingo.cells = orderedCells;

      actions.setBingo(bingo);
    }
  }, [bingo, session, ownershipData, actions, state.id, id, isOwnershipLoading, router]);

  if (isBingoLoading) {
    return <LoadingComponent />;
  }

  if (error || !bingo) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-foreground/50">Bingo not found</div>
      </div>
    );
  }

  return <Editor />;
}
