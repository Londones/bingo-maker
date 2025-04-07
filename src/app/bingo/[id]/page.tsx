"use client";
import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useParams } from "next/navigation";
import { useEditor } from "@/hooks/useEditor";
import { useSession } from "next-auth/react";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import Editor from "@/components/editor/editor";
import BingoPreview from "@/components/bingo-preview";
import { BingoCell } from "@/types/types";

const LoadingComponent = () => (
  <div className="w-full h-screen flex items-center justify-center">
    <div className="animate-pulse text-foreground/50">Loading bingo...</div>
  </div>
);

const BingoContent = ({ id }: { id: string }) => {
  const { state, actions } = useEditor();
  const { data: session } = useSession();
  const { useGetBingo, useCheckOwnership, isClient } = useBingoStorage();
  const [author, setAuthor] = useState<string>("Anonymous");
  const [mounted, setMounted] = useState(false);

  const { data: bingo, isLoading: isBingoLoading, error } = useGetBingo(id);

  const skipOwnershipCheck = useMemo(() => !!state.id && state.id === id, [state.id, id]);

  const { data: ownershipData, isLoading: isOwnershipLoading } = useCheckOwnership(id, {
    enabled: !skipOwnershipCheck,
  });

  const isAuthor = useMemo(
    () => (!!session?.user?.id && bingo?.userId === session.user.id) || !!ownershipData?.isOwner,
    [session?.user?.id, bingo?.userId, ownershipData?.isOwner]
  );

  const isLoading = useMemo(
    () => isBingoLoading || (!mounted && isClient) || (isClient && isOwnershipLoading),
    [isBingoLoading, mounted, isClient, isOwnershipLoading]
  );

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/bingo/user-check/${userId}`);
      const userData = await res.json();
      setAuthor(userData.name as string);
    } catch {
      setAuthor("Anonymous");
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setMounted(true);

      if (bingo && isAuthor && state.id !== bingo.id) {
        actions.setBingo(bingo);
      }

      if (bingo) {
        const orderedCells: BingoCell[] = Array(bingo.gridSize ** 2).fill(null);
        bingo.cells.forEach((cell) => {
          orderedCells[cell.position] = cell;
        });
        bingo.cells = orderedCells;

        if (isAuthor) {
          setAuthor("You");
        } else if (bingo.userId) {
          await fetchUserData(bingo.userId);
        }
      }
    };

    void fetchData();
  }, [bingo, session, isAuthor, actions, state.id, fetchUserData]);

  if (!mounted || isLoading) {
    return <LoadingComponent />;
  }

  if (error || !bingo) {
    return <div className="w-full text-center mt-10">Bingo not found</div>;
  }

  return (
    <div className="w-full">
      <div className="text-foreground/50 mb-4">
        <h1 className="text-5xl font-bold">{isAuthor ? state.title : bingo.title}</h1>
        <p className="text-xs">By: {author}</p>
      </div>
      {isAuthor ? <Editor /> : <BingoPreview bingo={bingo} />}
    </div>
  );
};

const BingoPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Suspense fallback={<LoadingComponent />}>
      <BingoContent id={id} />
    </Suspense>
  );
};

export default BingoPage;
