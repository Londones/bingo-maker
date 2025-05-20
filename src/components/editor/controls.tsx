import React, { useState, useEffect } from "react";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Undo, Redo, Save, Loader, ChevronLeft, ChevronRight, ExternalLink, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import { toast } from "sonner";
import { APIError } from "@/lib/errors";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Bingo, BingoPatch } from "@/types/types";
import { useEditorRoutePersistence } from "@/hooks/useEditorRoutePersistence";
import { useRouter } from "next/navigation";
import { cleanupOrphanedImages } from "@/lib/image-tracker";

interface ControlsProps {
    isPanelOpen?: boolean;
    setIsPanelOpen?: (open: boolean) => void;
    setSaving?: (isSaving: boolean) => void;
}

export default function Controls({ isPanelOpen, setIsPanelOpen, setSaving }: ControlsProps) {
    const { actions, canRedo, canUndo, canSave, state } = useEditor();
    const { useSaveBingo, useUpdateBingo } = useBingoStorage();
    const queryClient = useQueryClient();
    const { status: saveStatus } = useSaveBingo;
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const { clearEditorState } = useEditorRoutePersistence();
    const router = useRouter();

    // Reset justSaved when editor state changes (through undo/redo)
    useEffect(() => {
        if (canSave && justSaved) {
            setJustSaved(false);
        }
    }, [canSave, justSaved]);
    const handleSaveNew = async () => {
        if (isSaving) return;

        // Prevent saving if there are no changes
        if (!canSave) {
            toast.info("No changes to save");
            return;
        }

        setIsSaving(true);
        setSaving?.(true);

        try {
            actions.clearFutureHistory();

            const savedBingo = await useSaveBingo.mutateAsync(state);
            actions.setBingo(savedBingo);
            toast.success("Bingo saved successfully");
            setJustSaved(true);

            // Clean up any orphaned images after successful save
            try {
                await cleanupOrphanedImages(savedBingo);
            } catch (cleanupError) {
                console.error("Error cleaning up orphaned images:", cleanupError);
                // Don't show this error to user since the save was successful
            }

            clearEditorState();
            if (savedBingo.id) {
                window.history.replaceState({}, "", `/editor/${savedBingo.id}`);
                return;
            }
        } catch (error) {
            if (error instanceof APIError) {
                toast.error(error.message);
            } else {
                toast.error(`${error as string}`);
            }
            setSaving?.(false);
        } finally {
            setIsSaving(false);
        }
    };
    const handleUpdate = async () => {
        if (isSaving) return;

        // Prevent updating if there are no changes
        if (!canSave) {
            return;
        }

        setIsSaving(true);

        try {
            actions.clearFutureHistory();

            const changes = actions.extractChanges();
            const updateData: BingoPatch = {
                ...changes,
            };

            if (Object.keys(updateData).length === 0) {
                toast.info("No changes to update");
                setIsSaving(false);
                return;
            }

            const previousData = queryClient.getQueryData<Bingo>(["bingo", state.id!]);
            if (previousData) {
                // Optimistically update the cache
                queryClient.setQueryData<Bingo>(["bingo", state.id!], (old) => {
                    if (!old) return previousData;

                    const updated = { ...old };

                    if (updateData.title) updated.title = updateData.title;
                    if (updateData.status) updated.status = updateData.status;
                    if (updateData.style) updated.style = { ...updated.style, ...updateData.style };
                    if (updateData.background) updated.background = { ...updated.background, ...updateData.background };
                    if (updateData.stamp) updated.stamp = { ...updated.stamp, ...updateData.stamp };

                    if (updateData.cells) {
                        updated.cells = updated.cells.map((cell) => {
                            const updatedCell = updateData.cells?.find((c) => c.position === cell.position);
                            if (updatedCell) {
                                return { ...cell, ...updatedCell };
                            }
                            return cell;
                        });
                    }

                    return updated;
                });
            }

            const updatedBingo = await useUpdateBingo.mutateAsync({
                bingoId: state.id!,
                updates: updateData,
            });
            setJustSaved(true);

            if (!state.id) {
                clearEditorState();
            }
            actions.setBingo(updatedBingo);
            toast.success("Bingo updated successfully");

            // Clean up any orphaned images after successful update
            try {
                await cleanupOrphanedImages(updatedBingo);
            } catch (cleanupError) {
                console.error("Error cleaning up orphaned images:", cleanupError);
                // Don't show this error to user since the update was successful
            }
        } catch (error) {
            if (error instanceof APIError) {
                toast.error(error.message);
            } else {
                toast.error(`${error as string}`);
            }
            await queryClient.invalidateQueries({ queryKey: ["bingo", state.id!] });
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        if (canSave) {
            if (state.id) {
                await handleUpdate();
            } else {
                await handleSaveNew();
            }
        }
        const shareLink = `${window.location.origin}/bingo/${state.id}`;
        await navigator.clipboard.writeText(shareLink).then(() => {
            toast.success("Share link copied to clipboard");
        });
        // Open the share link in a new tab
        const newTab = window.open(shareLink, "_blank");
        if (newTab) {
            newTab.focus();
        } else {
            toast.error("Failed to open share link in a new tab");
        }
    };
    return (
        <TooltipProvider>
            <div id='editor-controls' className='flex w-full justify-center gap-6'>
                {setIsPanelOpen && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                id='panel-toggle-btn'
                                onClick={() => setIsPanelOpen(!isPanelOpen)}
                                variant='outline'
                                className='ml-2'
                            >
                                {isPanelOpen ? (
                                    <ChevronLeft className='h-4 w-4' />
                                ) : (
                                    <ChevronRight className='h-4 w-4' />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isPanelOpen ? "Hide panel" : "Show panel"}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant='outline' onClick={() => actions.resetEditor()}>
                            <RotateCcw className='h-4 w-4' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Reset</p>
                    </TooltipContent>
                </Tooltip>
                <div className='flex gap-4 items-center'>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Switch
                                id='publish-switch'
                                checked={state.status === "published"}
                                onCheckedChange={(checked) => actions.switchStatus(checked ? "published" : "draft")}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{state.status === "published" ? "Published" : "Draft"}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button id='undo-btn' variant='outline' onClick={actions.undo} disabled={!canUndo}>
                                <Undo className='h-4 w-4' />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Undo</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button id='redo-btn' variant='outline' onClick={actions.redo} disabled={!canRedo}>
                                <Redo className='h-4 w-4' />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Redo</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            id='save-btn'
                            onClick={() => {
                                void (state.id ? handleUpdate() : handleSaveNew());
                            }}
                            title='Save'
                            disabled={saveStatus === "pending" || isSaving || !canSave || justSaved}
                            variant='outline'
                        >
                            {saveStatus === "pending" || isSaving ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, loop: Infinity, ease: "linear" }}
                                >
                                    <Loader className='h-4 w-4' />
                                </motion.div>
                            ) : (
                                <Save className='h-4 w-4' />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Save</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant='outline'
                            onClick={() => {
                                void handleShare();
                            }}
                            disabled={!state.id || isSaving}
                            id='share-btn'
                        >
                            <ExternalLink className='h-4 w-4' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Open in new tab</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
