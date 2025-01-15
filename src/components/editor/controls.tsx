import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Undo, Redo } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

const Controls = () => {
    const { actions, canRedo, canUndo } = useEditor();

    return (
        <TooltipProvider>
            <div className='flex w-full gap-4 mb-4'>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant='outline' onClick={actions.undo} disabled={!canUndo}>
                            <Undo className='h-4 w-4' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Undo</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant='outline' onClick={actions.redo} disabled={!canRedo}>
                            <Redo className='h-4 w-4' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Redo</p>
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
