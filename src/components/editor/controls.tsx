import React, { useState, useEffect } from "react";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Undo, Redo, Save, Loader, ChevronLeft, ChevronRight, Share } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import { toast } from "sonner";
import { APIError } from "@/lib/errors";
import { motion } from "framer-motion";
import { uploadPendingImages } from "@/app/actions/uploadthing";
import { useQueryClient } from "@tanstack/react-query";
import { Bingo, BingoPatch } from "@/types/types";

const Controls = ({
  isPanelOpen,
  setIsPanelOpen,
}: {
  isPanelOpen?: boolean;
  setIsPanelOpen?: (open: boolean) => void;
}) => {
  const { actions, canRedo, canUndo, canSave, state } = useEditor();
  const { useSaveBingo, useUpdateBingo } = useBingoStorage();
  const queryClient = useQueryClient();
  const { status: saveStatus } = useSaveBingo;
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Reset justSaved when editor state changes (through undo/redo)
  useEffect(() => {
    if (canSave && justSaved) {
      setJustSaved(false);
    }
  }, [canSave, justSaved]);

  const prepareStateForSave = async (currentState: Bingo): Promise<Bingo> => {
    if (!currentState.localImages?.length) {
      return currentState;
    }

    try {
      const uploadResult = await uploadPendingImages(currentState);

      actions.setImageUrls(uploadResult);

      const updatedState = {
        ...currentState,
        background: {
          ...currentState.background,
          backgroundImage: uploadResult.backgroundImage || currentState.background.backgroundImage,
        },
        cells: currentState.cells.map((cell) => {
          const uploadedImage = uploadResult.cellImages?.find((img) => img.position === cell.position);
          if (uploadedImage) {
            return {
              ...cell,
              cellStyle: {
                ...(cell.cellStyle || {}),
                cellBackgroundImage: uploadedImage.url,
              },
            };
          }
          return {
            ...cell,
            cellStyle: cell.cellStyle ? { ...cell.cellStyle } : undefined,
          };
        }),
        stamp: uploadResult.stampImage
          ? {
              ...currentState.stamp,
              value: uploadResult.stampImage,
            }
          : currentState.stamp,
        localImages: undefined,
      };

      return updatedState;
    } catch (error) {
      throw error;
    }
  };

  const handleSaveNew = async () => {
    if (isSaving) return;

    // Prevent saving if there are no changes
    if (!canSave && !state.localImages?.length) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);

    try {
      const preparedState = await prepareStateForSave(state);

      // Clear future history when saving
      actions.clearFutureHistory();

      const savedBingo = await useSaveBingo.mutateAsync(preparedState);

      actions.setBingo(savedBingo);
      toast.success("Bingo saved successfully");

      setJustSaved(true);
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message);
      } else {
        toast.error(`${error as string}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (isSaving) return;

    // Prevent updating if there are no changes
    if (!canSave && !state.localImages?.length) {
      return;
    }

    setIsSaving(true);

    try {
      const preparedState = await prepareStateForSave(state);

      actions.clearFutureHistory();

      const changes = actions.extractChanges();

      const updateData: BingoPatch = {
        ...changes,
      };
      if (state.localImages?.length) {
        if (preparedState.background.backgroundImage !== state.background.backgroundImage) {
          updateData.background = {
            ...updateData.background,
            backgroundImage: preparedState.background.backgroundImage,
            backgroundImageOpacity: preparedState.background.backgroundImageOpacity,
          };
        }

        if (preparedState.stamp.value !== state.stamp.value) {
          updateData.stamp = {
            ...updateData.stamp,
            value: preparedState.stamp.value,
          };
        }

        const cellsWithImageChanges = preparedState.cells
          .filter((cell, i) => cell.cellStyle?.cellBackgroundImage !== state.cells[i]?.cellStyle?.cellBackgroundImage)
          .map((cell) => ({
            ...cell,
          }));

        if (cellsWithImageChanges.length > 0) {
          if (updateData.cells) {
            const existingCellUpdates = new Map(updateData.cells.map((cell) => [cell.position, cell]));

            cellsWithImageChanges.forEach((cell) => {
              existingCellUpdates.set(cell.position, {
                ...existingCellUpdates.get(cell.position),
                ...cell,
              });
            });

            updateData.cells = Array.from(existingCellUpdates.values());
          } else {
            updateData.cells = cellsWithImageChanges;
          }
        }
      }

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

      actions.setBingo(updatedBingo);
      toast.success("Bingo updated successfully");
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
  };

  return (
    <TooltipProvider>
      <div className="flex w-full justify-center gap-6">
        {setIsPanelOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => setIsPanelOpen(!isPanelOpen)} variant="outline" className="ml-2">
                {isPanelOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isPanelOpen ? "Hide panel" : "Show panel"}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={() => actions.resetEditor()}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset</p>
          </TooltipContent>
        </Tooltip> */}
        <div className="flex gap-4 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Switch
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
              <Button variant="outline" onClick={actions.undo} disabled={!canUndo}>
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={actions.redo} disabled={!canRedo}>
                <Redo className="h-4 w-4" />
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
              onClick={() => {
                void (state.id ? handleUpdate() : handleSaveNew());
              }}
              disabled={saveStatus === "pending" || isSaving || (!canSave && !state.localImages?.length) || justSaved}
              variant="outline"
            >
              {saveStatus === "pending" || isSaving ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, loop: Infinity, ease: "linear" }}>
                  <Loader className="h-4 w-4" />
                </motion.div>
              ) : (
                <Save className="h-4 w-4" />
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
              variant="outline"
              onClick={() => {
                void handleShare();
              }}
            >
              <Share className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default Controls;
