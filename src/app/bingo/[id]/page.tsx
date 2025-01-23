"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useEditor } from "@/hooks/useEditor";
import { useSession } from "next-auth/react";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import Editor from "@/components/editor/editor";
import BingoPreview from "@/components/bingo-preview";
import { BingoCell } from "@/types/types";
import { prisma } from "@/lib/prisma";

const BingoPage = () => {
    const { id } = useParams();
    const { state, actions } = useEditor();
    const { data: session } = useSession();
    const { useGetBingo } = useBingoStorage();
    const [authorToken, setAuthorToken] = useState<string | null>(null);
    const [author, setAuthor] = useState<string>("You");
    const { data: bingo, isLoading, error } = useGetBingo(id as string);

    useEffect(() => {
        setAuthorToken(localStorage.getItem("bingoAuthorToken"));
    }, []);

    const isAuthor = session?.user?.id === bingo?.userId || authorToken === bingo?.authorToken;

    useEffect(() => {
        const getBingoAuthor = async () => {
            if (bingo?.userId) {
                const user = await prisma.user.findUnique({
                    where: { id: bingo.userId },
                });
                if (user) {
                    return user.name ?? "Anonymous";
                }
            } else {
                if (isAuthor) {
                    return "You";
                }
            }
            return "Anonymous";
        };

        if (bingo && isAuthor && state.id !== bingo.id) {
            actions.setBingo(bingo);
        }
        if (bingo) {
            const orderedCells: BingoCell[] = Array(bingo.gridSize ** 2).fill(null);
            bingo.cells.forEach((cell) => {
                orderedCells[cell.position] = cell;
            });
            bingo.cells = orderedCells;

            getBingoAuthor()
                .then((author) => setAuthor(author))
                .catch((error) => console.error(error));
        }
    }, [bingo, isAuthor, state.id, actions]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error || !bingo) {
        return <div>Bingo not found</div>;
    }

    return (
        <div className='w-full'>
            <div className='text-foreground/50 mb-4'>
                <h1 className='text-5xl font-bold'>{isAuthor ? state.title : bingo.title}</h1>
                <p className='text-xs'>By: {author}</p>
            </div>
            {isAuthor ? <Editor /> : <BingoPreview bingo={bingo} />}
        </div>
    );
};

export default BingoPage;
