"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEditor } from "@/hooks/useEditor";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import { BingoCell } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";

const Editor = dynamic(() => import("@/components/editor/editor"), { ssr: false });

const EditorCanvasSkeleton = () => (
  <div className="fixed inset-0 w-screen h-screen bg-background/35 backdrop-blur-[2px] overflow-hidden z-40">
    {/* Floating Top Controls Skeleton */}
    <div className="fixed top-3 md:top-4 left-1/2 -translate-x-1/2 z-[48] rounded-xl border border-border/80 bg-background/85 backdrop-blur-xl px-3 py-2 shadow-lg flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-md" />
      <Skeleton className="h-5 w-10 rounded-full" />
      <Skeleton className="h-9 w-9 rounded-md" />
      <Skeleton className="h-9 w-9 rounded-md" />
      <Skeleton className="h-9 w-9 rounded-md" />
      <Skeleton className="h-9 w-9 rounded-md" />
    </div>

    {/* Centered Board Canvas Skeleton */}
    <div className="h-full w-full flex items-center justify-center px-4">
      <div className="rounded-lg border border-border/60 bg-card/50 p-8 space-y-6">
        <Skeleton className="h-10 w-56 mx-auto rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-24 sm:h-28 sm:w-28 rounded-md" />
          ))}
        </div>
      </div>
    </div>

    {/* Floating Bottom Tool Dock Skeleton */}
    <div className="fixed bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-[49]">
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-border/80 bg-background/90 backdrop-blur-xl shadow-xl">
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
    </div>
  </div>
);

interface EditorByIdClientProps {
  id: string;
  serverAuthorized: boolean;
}

export default function EditorByIdClient({ id, serverAuthorized }: EditorByIdClientProps) {
  const { state, actions } = useEditor();
  const router = useRouter();
  const { useGetBingo, useCheckOwnership } = useBingoStorage();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(serverAuthorized ? true : null);

  // Only check client authorToken for unclaimed guest boards (serverAuthorized === false)
  const { data: ownershipData, isLoading: isOwnershipLoading } = useCheckOwnership(id, {
    enabled: !serverAuthorized,
  });

  // Only fetch the full board payload once authorized
  const { data: bingo, isLoading: isBingoLoading, error } = useGetBingo(isAuthorized ? id : "");

  useEffect(() => {
    if (serverAuthorized) {
      setIsAuthorized(true);
      return;
    }

    if (isOwnershipLoading || ownershipData === undefined) return;

    const hasPermission = Boolean(ownershipData?.isOwner);
    setIsAuthorized(hasPermission);

    if (!hasPermission) {
      router.replace(`/bingo/${id}`);
    }
  }, [serverAuthorized, isOwnershipLoading, ownershipData, id, router]);

  useEffect(() => {
    if (!isAuthorized || !bingo) return;

    if (state.id !== bingo.id) {
      const orderedCells: BingoCell[] = Array(bingo.gridSize ** 2).fill(null);
      bingo.cells.forEach((cell) => {
        orderedCells[cell.position] = cell;
      });

      actions.resetEditor();
      actions.setBingo({
        ...bingo,
        cells: orderedCells,
      });
    }
  }, [bingo, actions, isAuthorized, state.id]);

  // While verifying guest ownership (or redirecting), show a minimal neutral state — never the editor UI
  if (isAuthorized !== true) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">Checking access...</div>
      </div>
    );
  }

  if (isBingoLoading) {
    return <EditorCanvasSkeleton />;
  }

  if (error || !bingo) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Bingo not found</div>
      </div>
    );
  }

  return <Editor />;
}
