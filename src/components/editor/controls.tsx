import React, { useState, useEffect } from "react";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Undo, Redo, Save, Loader } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import { toast } from "sonner";
import { APIError } from "@/lib/errors";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { uploadPendingImages } from "@/app/actions/uploadthing";
import { useQueryClient } from "@tanstack/react-query";
import { Bingo, BingoPatch } from "@/types/types";

const Controls = () => {
  const router = useRouter();
  const { actions, canRedo, canUndo, canSave, state } = useEditor();
  const { useSaveBingo, useUpdateBingo } = useBingoStorage();
  const queryClient = useQueryClient();
  const { status: saveStatus } = useSaveBingo;
  const currentUrl = usePathname();
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
                ...cell.cellStyle,
                cellBackgroundImage: uploadedImage.url,
              },
            };
          }
          return cell;
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
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
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

      if (currentUrl === "/") {
        router.push(`/bingo/${savedBingo.id}`);
      }
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
      toast.info("No images to update");
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

        if (
          preparedState.cells.some(
            (cell, i) => cell.cellStyle?.cellBackgroundImage !== state.cells[i]?.cellStyle?.cellBackgroundImage
          )
        ) {
          updateData.cells = preparedState.cells
            .filter((cell, i) => cell.cellStyle?.cellBackgroundImage !== state.cells[i]?.cellStyle?.cellBackgroundImage)
            .map((cell) => ({
              ...cell,
            }));
        }
      }

      // Only perform update if we have actual changes
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

  return (
    <TooltipProvider>
      <div className="flex w-full justify-between mb-4">
        <div className="flex gap-4">
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
      </div>
    </TooltipProvider>
  );
};

export default Controls;
