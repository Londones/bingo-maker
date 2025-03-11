import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Undo, Redo, Save, Loader } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import { toast } from "sonner";
import { APIError } from "@/lib/errors";
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
//     AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { uploadPendingImages } from "@/app/actions/uploadthing";

const Controls = () => {
  const router = useRouter();
  const { actions, canRedo, canUndo, state } = useEditor();
  const { useSaveBingo, useUpdateBingo } = useBingoStorage();
  const { status: saveStatus } = useSaveBingo;
  const currentUrl = usePathname();

  const handleSaveNew = async () => {
    try {
      if (state.localImages?.length && state.localImages?.length > 0) {
        const uploadRedult = await uploadPendingImages(state);
        actions.setImageUrls(uploadRedult);
      }
      const savedBingo = await useSaveBingo.mutateAsync(state);
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
    }
  };

  const handleUpdate = async () => {
    try {
      if (state.localImages?.length && state.localImages?.length > 0) {
        const uploadRedult = await uploadPendingImages(state);
        actions.setImageUrls(uploadRedult);
      }
      const updatedBingo = await useUpdateBingo.mutateAsync({
        bingoId: state.id!,
        updates: state,
      });
      actions.setBingo(updatedBingo);
      toast.success("Bingo updated successfully");
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message);
      } else {
        toast.error(`${error as string}`);
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="flex w-full justify-between mb-4">
        <div className="flex gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={actions.undo}
                disabled={!canUndo}
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={actions.redo}
                disabled={!canRedo}
              >
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
              disabled={saveStatus === "pending" || (!canUndo && !canRedo)}
              variant="outline"
            >
              {saveStatus === "pending" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, loop: Infinity, ease: "linear" }}
                >
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

        {/* 
                <AlertDialog>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                                <Button variant='destructive' disabled={!canUndo}>
                                    <RotateCcw className='h-4 w-4' />
                                </Button>
                            </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Reset Editor</p>
                        </TooltipContent>
                    </Tooltip>

                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will reset all changes made. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={actions.resetEditor}>Reset</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog> */}
      </div>
    </TooltipProvider>
  );
};

export default Controls;
