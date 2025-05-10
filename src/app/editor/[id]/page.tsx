"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditor } from "@/hooks/useEditor";
import { useSession } from "next-auth/react";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import { useEditorRoutePersistence } from "@/hooks/useEditorRoutePersistence";
import Editor from "@/components/editor/editor";
import { BingoCell } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingComponent = () => (
    <div className='fixed inset-0 w-screen h-screen bg-background/40 backdrop-blur-sm overflow-hidden z-40'>
        <div className='h-full flex flex-col text-foreground/50'>
            {/* Header area */}
            <div className='p-4 border-b flex items-center justify-center bg-background/40 backdrop-blur-sm'>
                <div className='flex items-center gap-4 w-full'>
                    <Skeleton className='h-9 w-24' />
                    <div className='ml-auto flex gap-4'>
                        <Skeleton className='h-9 w-9 rounded-md' />
                        <Skeleton className='h-9 w-9 rounded-md' />
                        <Skeleton className='h-9 w-9 rounded-md' />
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className='flex overflow-hidden relative flex-1'>
                {/* Settings panel */}
                <div className='h-full border-r backdrop-blur-sm overflow-y-auto min-w-96'>
                    <div className='p-4'>
                        <Skeleton className='h-8 w-full mb-4' />
                        <div className='space-y-6'>
                            {Array(4)
                                .fill(null)
                                .map((_, i) => (
                                    <div key={i} className='space-y-2'>
                                        <Skeleton className='h-6 w-32' />
                                        <Skeleton className='h-24 w-full' />
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Preview panel */}
                <div className='w-full overflow-auto bg-background/50 flex-1 relative'>
                    <div className='inset-0 custom-scrollbar'>
                        <div className='min-h-full py-12'>
                            <div className='flex lg:justify-center'>
                                <div className='mx-12 pr-12 lg:pr-0'>
                                    <div className='flex flex-col items-center overflow-visible justify-center h-full w-full'>
                                        <div className='h-fit flex flex-col p-8 rounded-lg relative custom-scrollbar'>
                                            {/* Title */}
                                            <Skeleton className='h-10 w-64 mx-auto mb-8' />

                                            {/* Bingo grid */}
                                            <div className='grid grid-cols-5 gap-2 mx-auto'>
                                                {Array(25)
                                                    .fill(null)
                                                    .map((_, i) => (
                                                        <Skeleton key={i} className='w-24 h-24 rounded-md' />
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
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const { useGetBingo, useCheckOwnership } = useBingoStorage();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const { clearEditorState } = useEditorRoutePersistence();

    const { data: bingo, isLoading: isBingoLoading, error } = useGetBingo(id);

    const { data: ownershipData, isLoading: isOwnershipLoading } = useCheckOwnership(id, {
        enabled: !!bingo && !!session?.user?.id && bingo.userId !== session.user.id,
    }); // Early permission check - runs before rendering editor
    useEffect(() => {
        // Wait for session and bingo data to load
        if (sessionStatus === "loading" || isBingoLoading || isOwnershipLoading) return;

        // If no bingo found, no need to check permissions
        if (!bingo) return;

        // Check if user is authorized to edit
        const isAuthor = !!session?.user?.id && bingo.userId === session?.user?.id;
        const isOwner = !!ownershipData?.isOwner;
        const hasPermission = isAuthor || isOwner;

        setIsAuthorized(hasPermission);

        // Redirect immediately if not authorized
        if (hasPermission === false) {
            router.push(`/bingo/${id}`);
        }
    }, [bingo, session, ownershipData, id, router, sessionStatus, isBingoLoading, isOwnershipLoading]);

    // Reset editor and load bingo data, combined into a single effect
    // to prevent infinite update loops
    useEffect(() => {
        // Only proceed if we're authorized and have bingo data
        if (!isAuthorized || !bingo) return;

        // Only reset state if we're changing to a different bingo
        // or if we don't have a bingo ID in the editor state yet
        if (state.id !== bingo.id) {
            // Handle bingo data loading
            const orderedCells: BingoCell[] = Array(bingo.gridSize ** 2).fill(null);
            bingo.cells.forEach((cell) => {
                orderedCells[cell.position] = cell;
            });
            const preparedBingo = {
                ...bingo,
                cells: orderedCells,
            };

            // First reset, then set bingo
            actions.resetEditor();
            actions.setBingo(preparedBingo);
        }
    }, [bingo, actions, id, isAuthorized, state.id]);

    // Show loading while checking permissions
    if (isBingoLoading || isOwnershipLoading || isAuthorized === null) {
        return <LoadingComponent />;
    }

    // Show error if bingo not found
    if (error || !bingo) {
        return (
            <div className='w-full h-screen flex items-center justify-center'>
                <div className='text-foreground/50'>Bingo not found</div>
            </div>
        );
    }

    // Only render editor if authorized
    if (isAuthorized) {
        return <Editor />;
    }

    // This will briefly show while redirecting
    return <LoadingComponent />;
}
