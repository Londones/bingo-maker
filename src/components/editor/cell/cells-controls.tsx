import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bold, Italic, Type, Square, Maximize2, Grid, Palette, Blend } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";

const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32];
const fontFamilies = [
    { value: "Arial", label: "Arial" },
    { value: "Inter", label: "Inter" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Georgia", label: "Georgia" },
    { value: "Courier New", label: "Courier New" },
    { value: "Verdana", label: "Verdana" },
    { value: "Trebuchet MS", label: "Trebuchet MS" },
    { value: "Comic Sans MS", label: "Comic Sans MS" },
    { value: "Impact", label: "Impact" },
    { value: "Lucida Console", label: "Lucida Console" },
    { value: "Lucida Sans Unicode", label: "Lucida Sans Unicode" },
    { value: "Palatino Linotype", label: "Palatino Linotype" },
    { value: "Arial Black", label: "Arial Black" },
    { value: "Franklin Gothic Medium", label: "Franklin Gothic Medium" },
    { value: "Symbol", label: "Symbol" },
    { value: "Webdings", label: "Webdings" },
    { value: "Wingdings", label: "Wingdings" },
    { value: "MS Sans Serif", label: "MS Sans Serif" },
];

type PopoverType = "textColor" | "borderColor" | "cellBackgroundColor" | null;

const CellsToolbar = () => {
    const { state, actions } = useEditor();
    const [activePopover, setActivePopover] = React.useState<PopoverType>(null);

    return (
        <TooltipProvider>
            <div className='flex flex-wrap items-center gap-1 p-2'>
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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Popover
                            open={activePopover === "textColor"}
                            onOpenChange={(isOpen) => setActivePopover(isOpen ? "textColor" : null)}
                        >
                            <PopoverTrigger asChild>
                                <Button variant='ghost' size='icon'>
                                    <Type className='h-4 w-4' />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className='p-0'>
                                <HexColorPicker
                                    color={state.style.color}
                                    onChange={(color) => {
                                        actions.updateStyle({
                                            color: color,
                                        });
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </TooltipTrigger>
                    <TooltipContent>Text Color</TooltipContent>
                </Tooltip>

                <Separator orientation='vertical' className='h-8 mx-1' />
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

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className='flex items-center ml-2 gap-2'>
                            <Blend className='h-4 w-4' />
                            <Input
                                type='number'
                                value={state.style.cellBackgroundOpacity * 100}
                                onChange={(e) =>
                                    actions.updateStyle({
                                        cellBackgroundOpacity: parseInt(e.target.value) / 100,
                                    })
                                }
                                min={0}
                                max={100}
                                step={1}
                                className='w-16'
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Cell Background Opacity</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className='flex items-center ml-2 gap-2'>
                            <Maximize2 className='h-4 w-4' />
                            <Input
                                type='number'
                                value={state.style.cellSize}
                                onChange={(e) =>
                                    actions.updateStyle({
                                        cellSize: parseInt(e.target.value),
                                    })
                                }
                                min={100}
                                step={1}
                                className='w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Cell Size</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className='flex items-center gap-2'>
                            <Grid className='h-4 w-4' />
                            <Input
                                type='number'
                                value={state.style.gap}
                                onChange={(e) =>
                                    actions.updateStyle({
                                        gap: parseInt(e.target.value),
                                    })
                                }
                                min={0}
                                step={1}
                                className='w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Cell Gap</TooltipContent>
                </Tooltip>
                <Separator orientation='vertical' className='h-8 mx-1' />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Popover
                            open={activePopover === "borderColor"}
                            onOpenChange={(isOpen) => setActivePopover(isOpen ? "borderColor" : null)}
                        >
                            <PopoverTrigger asChild>
                                <Button variant='ghost' size='icon'>
                                    <Square className='h-4 w-4' />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className='p-0'>
                                <HexColorPicker
                                    color={state.style.cellBorderColor}
                                    onChange={(color) => {
                                        actions.updateStyle({
                                            cellBorderColor: color,
                                        });
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </TooltipTrigger>
                    <TooltipContent>Border Color</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Popover
                            open={activePopover === "cellBackgroundColor"}
                            onOpenChange={(isOpen) => setActivePopover(isOpen ? "cellBackgroundColor" : null)}
                        >
                            <PopoverTrigger asChild>
                                <Button variant='ghost' size='icon'>
                                    <Palette className='h-4 w-4' />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className='p-0 w-auto'>
                                <HexColorPicker
                                    color={state.style.cellBackgroundColor}
                                    onChange={(color) => {
                                        actions.updateStyle({
                                            cellBackgroundColor: color,
                                        });
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </TooltipTrigger>
                    <TooltipContent>Cell Background Color</TooltipContent>
                </Tooltip>

                <Separator orientation='vertical' className='h-8 mx-1' />
            </div>
        </TooltipProvider>
    );
};

export default CellsToolbar;
