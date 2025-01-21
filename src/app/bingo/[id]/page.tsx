"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useEditor } from "@/hooks/useEditor";
import { useSession } from "next-auth/react";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import Editor from "@/components/editor/editor";
//import BingoPreview from "@/components/bingo-preview";

const BingoPage = () => {
    const { id } = useParams();
    const { state, actions } = useEditor();
    const { data: session } = useSession();
    const { useGetBingo } = useBingoStorage();
    const authorToken = localStorage.getItem("bingoAuthorToken");

    const { data: bingo, isLoading, error } = useGetBingo(id as string);

    const isAuthor = session?.user?.id === bingo?.userId || authorToken === bingo?.authorToken;

    useEffect(() => {
        if (bingo && isAuthor && state.id !== bingo.id) {
            actions.setBingo(bingo);
        }
    }, [bingo, isAuthor, state.id, actions]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error || !bingo) {
        return <div>Bingo not found</div>;
    }

    return <div className='w-full'>{isAuthor ? <Editor /> : <div>hello</div>}</div>;
};

export default BingoPage;
