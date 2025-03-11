"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useEditor } from "@/hooks/useEditor";
import { useSession } from "next-auth/react";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import Editor from "@/components/editor/editor";
import BingoPreview from "@/components/bingo-preview";
import { BingoCell } from "@/types/types";

const BingoPage = () => {
  const { id } = useParams<{ id: string }>();
  const { state, actions } = useEditor();
  const { data: session } = useSession();
  const { useGetBingo, useCheckOwnership, isClient } = useBingoStorage();
  const [author, setAuthor] = useState<string>("Anonymous");

  const { data: bingo, isLoading: isBingoLoading, error } = useGetBingo(id);

  const { data: ownershipData, isLoading: isOwnershipLoading } =
    useCheckOwnership(id);

  const isAuthor =
    (!!session?.user?.id && bingo?.userId === session.user.id) ||
    !!ownershipData?.isOwner;

  const isLoading = isBingoLoading || (isClient && isOwnershipLoading);

  useEffect(() => {
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
      }

      if (bingo.userId && !isAuthor) {
        fetch(`/api/user/${bingo.userId}`)
          .then((res) => res.json())
          .then((userData) => {
            setAuthor((userData.name as string) || "Anonymous");
          })
          .catch(() => setAuthor("Anonymous"));
      }
    }
  }, [bingo, session, isAuthor, actions, state.id]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-pulse text-foreground/50">Loading bingo...</div>
      </div>
    );
  }

  if (error || !bingo) {
    return <div className="w-full text-center mt-10">Bingo not found</div>;
  }

  return (
    <div className="w-full">
      <div className="text-foreground/50 mb-4">
        <h1 className="text-5xl font-bold">
          {isAuthor ? state.title : bingo.title}
        </h1>
        <p className="text-xs">By: {author}</p>
      </div>
      {isAuthor ? <Editor /> : <BingoPreview bingo={bingo} />}
    </div>
  );
};

export default BingoPage;
