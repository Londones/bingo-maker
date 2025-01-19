import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bold, Italic, Type, Square, Maximize2, Grid, Palette, Blend } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { PopoverType } from "@/types/types";
import { FONT_SIZES, FONT_FAMILIES } from "@/utils/constants";

const CellsToolbar = () => {
    const { state, actions } = useEditor();
    const [activePopover, setActivePopover] = React.useState<PopoverType>(null);

    React.useEffect(() => {
        if (state.style.cellSize > (state.gridSize === 3 ? 350 : 200)) {
            actions.updateStyle({
                cellSize: state.gridSize === 3 ? 350 : 200,
            });
            actions.updateStamp({
                ...state.stamp,
                size: state.gridSize === 3 ? 330 : 180,
            });
        }
    });

    return (
        <div className='flex flex-col items-center gap-1 p-2'>
            <div className='flex items-center justify-between w-full'>
                <span>Font Family</span>
                <Select
                    value={state.style.fontFamily}
                    onValueChange={(value) => actions.updateStyle({ fontFamily: value })}
                >
                    <SelectTrigger className='w-auto'>
                        <Type className='h-4 w-4 mr-2' />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                                {font.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Font Size</span>
                <Select
                    value={state.style.fontSize.toString()}
                    onValueChange={(value) => actions.updateStyle({ fontSize: parseInt(value, 10) })}
                >
                    <SelectTrigger className='w-[80px]'>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FONT_SIZES.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                                {size}px
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Bold</span>
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
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Italic</span>
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
            </div>
            <div className='flex items-center justify-between w-full'>
                <span>Text Color</span>
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
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Cell Background Opacity</span>
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
                        className='w-20'
                    />
                </div>
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Cell Size</span>
                <div className='flex items-center ml-2 gap-2'>
                    <Maximize2 className='h-4 w-4' />
                    <Input
                        type='number'
                        value={state.style.cellSize}
                        onChange={(e) => {
                            actions.updateStyle({
                                cellSize: parseInt(e.target.value),
                            });
                            actions.updateStamp({
                                ...state.stamp,
                                size: parseInt(e.target.value) - 20,
                            });
                        }}
                        min={100}
                        max={state.gridSize === 3 ? 350 : 200}
                        step={1}
                        className='w-20'
                    />
                </div>
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Cell Gap</span>
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
                        className='w-20'
                    />
                </div>
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Cell Background Color</span>
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
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Border Color</span>
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
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Border Width</span>
                <div className='flex items-center gap-2'>
                    <Square className='h-4 w-4' />
                    <Input
                        type='number'
                        value={state.style.cellBorderWidth}
                        onChange={(e) =>
                            actions.updateStyle({
                                cellBorderWidth: parseInt(e.target.value),
                            })
                        }
                        min={0}
                        step={1}
                        className='w-20'
                    />
                </div>
            </div>
        </div>
    );
};

export default CellsToolbar;
