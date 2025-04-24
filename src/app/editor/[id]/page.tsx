"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useEditor } from "@/hooks/useEditor";
import { useSession } from "next-auth/react";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import Editor from "@/components/editor/editor";
import { useRouter } from "next/navigation";
import { BingoCell } from "@/types/types";

import { Skeleton } from "@/components/ui/skeleton";

const LoadingComponent = () => (
  <div className="fixed inset-0 w-screen h-screen bg-background/40 backdrop-blur-sm overflow-hidden z-40">
    <div className="h-full flex flex-col text-foreground/50">
      {/* Header area */}
      <div className="p-4 border-b flex items-center justify-center bg-background/40 backdrop-blur-sm">
        <div className="flex items-center gap-4 w-full">
          <Skeleton className="h-9 w-24" />
          <div className="ml-auto flex gap-4">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex overflow-hidden relative flex-1">
        {/* Settings panel */}
        <div className="h-full border-r backdrop-blur-sm overflow-y-auto min-w-96">
          <div className="p-4">
            <Skeleton className="h-8 w-full mb-4" />
            <div className="space-y-6">
              {Array(4)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="w-full overflow-auto bg-background/50 flex-1 relative">
          <div className="inset-0 custom-scrollbar">
            <div className="min-h-full py-12">
              <div className="flex lg:justify-center">
                <div className="mx-12 pr-12 lg:pr-0">
                  <div className="flex flex-col items-center overflow-visible justify-center h-full w-full">
                    <div className="h-fit flex flex-col p-8 rounded-lg relative custom-scrollbar">
                      {/* Title */}
                      <Skeleton className="h-10 w-64 mx-auto mb-8" />

                      {/* Bingo grid */}
                      <div className="grid grid-cols-5 gap-2 mx-auto">
                        {Array(25)
                          .fill(null)
                          .map((_, i) => (
                            <Skeleton key={i} className="w-24 h-24 rounded-md" />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
