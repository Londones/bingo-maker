"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import BingoView from "@/components/bingo/bingo-view";
import { Bingo, BingoCell } from "@/types/types";
import { useRealtimeBingo } from "@/hooks/useRealtimeBingo";
import { toast } from "sonner";

const LoadingComponent = () => (
    <div className='w-full h-screen flex items-center justify-center'>
        <div className='animate-pulse text-foreground/50'>Loading bingo...</div>
    </div>
);

type BingoWithAuthor = Bingo & { isAuthor?: boolean };

const BingoContent = ({ id }: { id: string }) => {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const { useGetBingo, useCheckOwnership, useUpdateBingo } = useBingoStorage();
    const [isClientSide, setIsClientSide] = useState(false);

    useRealtimeBingo(id);

    const { data: bingoData, isLoading: isBingoLoading, error } = useGetBingo(id);
    const typedBingoData = bingoData as BingoWithAuthor | undefined;

    const isOwnerOfBingo = useMemo(
        () =>
            !!typedBingoData?.isAuthor ||
            (!!session?.user?.id && session.user.id === typedBingoData?.userId),
        [session?.user?.id, typedBingoData?.userId, typedBingoData?.isAuthor]
    );

    // Only check anonymous authorToken ownership if not already confirmed as owner
    const { data: ownershipData } = useCheckOwnership(id, {
        enabled: isClientSide && !!typedBingoData && !isOwnerOfBingo,
    });

    const isAuthor = useMemo(
        () => isOwnerOfBingo || !!ownershipData?.isOwner,
        [isOwnerOfBingo, ownershipData?.isOwner]
    );

    const bingo = useMemo(() => {
        if (!typedBingoData) return null;

        const result = { ...typedBingoData };
        const orderedCells: BingoCell[] = Array(typedBingoData.gridSize ** 2).fill(null);

        typedBingoData.cells.forEach((cell) => {
            if (cell && typeof cell.position === "number") {
                orderedCells[cell.position] = cell;
            }
        });

        result.cells = orderedCells;
        return result;
    }, [typedBingoData]);

    const handleToggleCell = useCallback(
        (cell: BingoCell) => {
            if (!isAuthor || !cell.id || !id) return;

            const nextValidated = !cell.validated;
            const previousBingo = queryClient.getQueryData<BingoWithAuthor>(["bingo", id]);

            // Optimistically update React Query cache for instant stamp feedback
            queryClient.setQueryData<BingoWithAuthor>(["bingo", id], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    cells: old.cells.map((c) => (c.id === cell.id ? { ...c, validated: nextValidated } : c)),
                };
            });

            useUpdateBingo.mutate(
                {
                    bingoId: id,
                    updates: {
                        cells: [{ id: cell.id, validated: nextValidated }],
                    },
                },
                {
                    onError: () => {
                        if (previousBingo) {
                            queryClient.setQueryData(["bingo", id], previousBingo);
                        }
                        toast.error("Failed to update square");
                    },
                }
            );
        },
        [isAuthor, id, queryClient, useUpdateBingo]
    );

    useEffect(() => {
        setIsClientSide(true);
    }, []);

    if (!isClientSide || (isBingoLoading && !bingo)) {
        return <LoadingComponent />;
    }

    if (error || !bingo) {
        return <div className='w-full text-center mt-10'>Bingo not found</div>;
    }

    return <BingoView bingo={bingo} isAuthor={isAuthor} onToggleCell={handleToggleCell} />;
};

const BingoPage = () => {
    const { id } = useParams<{ id: string }>();

    return <BingoContent id={id} />;
};

export default BingoPage;
