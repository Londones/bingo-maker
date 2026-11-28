"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import BingoView from "@/components/bingo/bingo-view";
import { Bingo, BingoCell } from "@/types/types";
import { useRealtimeBingo } from "@/hooks/useRealtimeBingo";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const LoadingComponent = () => (
    <div className='max-w-5xl mx-auto px-4 pt-2 pb-16 space-y-6'>
        {/* Header Bar Skeleton */}
        <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
            <div className='space-y-2'>
                <Skeleton className='h-4 w-28 rounded-md' />
                <Skeleton className='h-10 w-64 sm:w-80 rounded-lg' />
            </div>
            <div className='flex items-center gap-2'>
                <Skeleton className='h-10 w-24 rounded-xl' />
                <Skeleton className='h-10 w-24 rounded-xl' />
            </div>
        </div>

        {/* Progress Strip Skeleton */}
        <div className='rounded-xl border border-border/80 bg-card/70 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div className='flex items-center gap-4'>
                <Skeleton className='h-4 w-24 rounded-md' />
                <Skeleton className='h-4 w-40 rounded-md' />
            </div>
            <Skeleton className='w-full sm:w-48 h-2 rounded-sm' />
        </div>

        {/* Board Skeleton */}
        <div className='flex justify-center py-2'>
            <div className='rounded-lg border border-border/60 bg-card/40 p-8 space-y-6'>
                <Skeleton className='h-9 w-52 mx-auto rounded-lg' />
                <div className='grid grid-cols-3 gap-3'>
                    {Array.from({ length: 9 }).map((_, idx) => (
                        <Skeleton key={idx} className='h-24 w-24 sm:h-28 sm:w-28 rounded-md' />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

type BingoWithAuthor = Bingo & { isAuthor?: boolean };

const BingoContent = ({ id }: { id: string }) => {
    const { data: session, status: sessionStatus } = useSession();
    const queryClient = useQueryClient();
    const { useGetBingo, useCheckOwnership, useUpdateBingo } = useBingoStorage();
    const [isClientSide, setIsClientSide] = useState(false);

    useRealtimeBingo(id);

    const { data: bingoData, isLoading: isBingoLoading, error } = useGetBingo(id);
    const typedBingoData = bingoData as BingoWithAuthor | undefined;

    // Account ownership is strictly determined by the live session (never stale cached `isAuthor`)
    const isAccountOwner = useMemo(() => {
        if (sessionStatus !== "authenticated") return false;
        return Boolean(session?.user?.id && typedBingoData?.userId && session.user.id === typedBingoData.userId);
    }, [sessionStatus, session?.user?.id, typedBingoData?.userId]);

    // Only check anonymous authorToken if the board has no account owner (userId is null)
    const { data: ownershipData } = useCheckOwnership(id, {
        enabled: isClientSide && sessionStatus !== "loading" && !!typedBingoData && !typedBingoData.userId,
    });

    const isAuthor = useMemo(() => {
        if (!typedBingoData || sessionStatus === "loading") return false;
        if (typedBingoData.userId) return isAccountOwner;
        return Boolean(ownershipData?.isOwner);
    }, [typedBingoData, sessionStatus, isAccountOwner, ownershipData?.isOwner]);

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
