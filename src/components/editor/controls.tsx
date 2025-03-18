import React, { useState } from "react";
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
import { Bingo } from "@/types/types";

const Controls = () => {
  const router = useRouter();
  const { actions, canRedo, canUndo, state } = useEditor();
  const { useSaveBingo, useUpdateBingo } = useBingoStorage();
  const queryClient = useQueryClient();
  const { status: saveStatus } = useSaveBingo;
  const currentUrl = usePathname();
  const [isSaving, setIsSaving] = useState(false);

  const prepareStateForSave = async (currentState: Bingo): Promise<Bingo> => {
    if (!currentState.localImages?.length) {
      console.log("No local images to upload");
      return currentState;
    }

    try {
      console.log("Starting image upload process");
      // Upload all images to S3
      const uploadResult = await uploadPendingImages(currentState);
      console.log("Upload results:", uploadResult);

      // Process image URLs through the Redux reducer
      actions.setImageUrls(uploadResult);

      // Wait for state update using a promise
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get the updated state after changes
      const updatedState = { ...state };
      console.log("State after image uploads:", {
        hasLocalImages: !!updatedState.localImages?.length,
        backgroundImage: updatedState.background.backgroundImage,
        cellImages: updatedState.cells
          .map((cell) =>
            cell.cellStyle?.cellBackgroundImage
              ? { position: cell.position, url: cell.cellStyle.cellBackgroundImage }
              : null
          )
          .filter(Boolean),
      });

      return updatedState;
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
      throw error;
    }
  };

  const handleSaveNew = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const preparedState = await prepareStateForSave(state);
      console.log("State prepared for saving:", {
        hasLocalImages: !!preparedState.localImages,
        backgroundImage: preparedState.background.backgroundImage?.substring(0, 50) + "...",
      });

      const savedBingo = await useSaveBingo.mutateAsync(preparedState);

      actions.setBingo(savedBingo);
      toast.success("Bingo saved successfully");

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
    setIsSaving(true);

    try {
      console.log("Starting update process HELLO!!!!");
      // Prepare state with uploaded images
      const preparedState = await prepareStateForSave(state);
      console.log("State prepared for update:", {
        hasLocalImages: !!preparedState.localImages,
        backgroundImage: preparedState.background.backgroundImage?.substring(0, 50) + "...",
        cellImage: preparedState.cells.map((cell) =>
          cell.cellStyle?.cellBackgroundImage
            ? { position: cell.position, url: cell.cellStyle.cellBackgroundImage }
            : null
        ),
      });

      // Make sure to preserve null values that were explicitly set
      const cleanedState = {
        ...preparedState,
        background: { ...preparedState.background },
        cells: preparedState.cells.map((cell) => ({
          ...cell,
          cellStyle: cell.cellStyle === undefined ? null : { ...cell.cellStyle },
        })),
      };

      // Optimistic update for the query cache
      const previousData = queryClient.getQueryData<Bingo>(["bingo", state.id!]);
      if (previousData) {
        queryClient.setQueryData<Bingo>(["bingo", state.id!], {
          ...previousData,
          ...cleanedState,
        });
      }

      // Update in database
      const updatedBingo = await useUpdateBingo.mutateAsync({
        bingoId: state.id!,
        updates: cleanedState,
      });

      console.log("Bingo updated successfully:", updatedBingo);

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
              disabled={saveStatus === "pending" || isSaving || (!canUndo && !canRedo)}
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
