"use client";
import React, { useEffect, useState, useMemo, use } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import BingoPreview from "@/components/bingo-preview";
import { BingoCell } from "@/types/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRealtimeBingo } from "@/hooks/useRealtimeBingo";

const LoadingComponent = () => (
    <div className='w-full h-screen flex items-center justify-center'>
        <div className='animate-pulse text-foreground/50'>Loading bingo...</div>
    </div>
);

const BingoContent = ({ id }: { id: string }) => {
    const { data: session } = useSession();
    const { useGetBingo, useCheckOwnership } = useBingoStorage();
    const [isClientSide, setIsClientSide] = useState(false);

    useRealtimeBingo(id);

    const { data: bingoData, isLoading: isBingoLoading, error } = useGetBingo(id);

    const isOwnerOfBingo = useMemo(
        () => session?.user?.id === bingoData?.userId,
        [session?.user?.id, bingoData?.userId]
    );

    const { data: ownershipData } = useCheckOwnership(id, {
        enabled: !isOwnerOfBingo,
    });

    const isAuthor = useMemo(
        () => (!!session?.user?.id && bingoData?.userId === session.user.id) || !!ownershipData?.isOwner,
        [session?.user?.id, bingoData?.userId, ownershipData?.isOwner]
    );

    const bingo = useMemo(() => {
        if (!bingoData) return null;

        const result = { ...bingoData };
        const orderedCells: BingoCell[] = Array(bingoData.gridSize ** 2).fill(null);

        bingoData.cells.forEach((cell) => {
            if (cell && typeof cell.position === "number") {
                orderedCells[cell.position] = cell;
            }
        });

        result.cells = orderedCells;
        return result;
    }, [bingoData]);

    useEffect(() => {
        setIsClientSide(true);
    }, []);

    if (!isClientSide || (isBingoLoading && !bingo)) {
        return <LoadingComponent />;
    }

    if (error || !bingo) {
        return <div className='w-full text-center mt-10'>Bingo not found</div>;
    }

    return (
        <div className='w-full'>
            <div>
                <div className='text-foreground/50 mb-4'>
                    <h1 className='text-5xl font-bold'>{bingo.title}</h1>
                </div>
            </div>
            <BingoPreview bingo={bingo} />
            {isAuthor ? (
                <Link href={`/editor/${bingo.id}`} className='flex items-center justify-center'>
                    <Button variant='outline' className='mt-4'>
                        Edit Bingo
                    </Button>
                </Link>
            ) : null}
        </div>
    );
};

const BingoPage = () => {
    const { id } = useParams<{ id: string }>();

    return <BingoContent id={id} />;
};

export default BingoPage;
