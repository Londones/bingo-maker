import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bold, Italic, Type, Square, Maximize2, Grid, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32];
const fontFamilies = [
    { value: "Inter", label: "Inter" },
    { value: "Arial", label: "Arial" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Georgia", label: "Georgia" },
];

const CellsToolbar = () => {
    const { state, actions } = useEditor();
    return (
        <TooltipProvider>
            <div className='flex flex-wrap items-center gap-1 p-2 bg-background border rounded-md'>
                <Select
                    value={state.style.fontFamily}
                    onValueChange={(value) => actions.updateStyle({ fontFamily: value })}
                >
                    <SelectTrigger className='w-[140px]'>
                        <Type className='h-4 w-4 mr-2' />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {fontFamilies.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                                {font.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={state.style.fontSize.toString()}
                    onValueChange={(value) => actions.updateStyle({ fontSize: parseInt(value, 10) })}
                >
                    <SelectTrigger className='w-[80px]'>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {fontSizes.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                                {size}px
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Separator orientation='vertical' className='h-8 mx-1' />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant='ghost'
                            size='icon'
                            className={cn(state.style.fontWeight === "bold" && "bg-accent")}
                            onClick={() =>
                                actions.updateStyle({
                                    fontWeight: state.style.fontWeight === "bold" ? "normal" : "bold",
                                })
                            }
                        >
                            <Bold className='h-4 w-4' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bold</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant='ghost'
                            size='icon'
                            className={cn(state.style.fontStyle === "italic" && "bg-accent")}
                            onClick={() =>
                                actions.updateStyle({
                                    fontStyle: state.style.fontStyle === "italic" ? "normal" : "italic",
                                })
                            }
                        >
                            <Italic className='h-4 w-4' />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Italic</TooltipContent>
                </Tooltip>

                <Separator orientation='vertical' className='h-8 mx-1' />
            </div>
        </TooltipProvider>
    );
};

export default CellsToolbar;
