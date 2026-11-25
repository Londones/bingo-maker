import React, { useCallback, useEffect, useRef } from "react";
import { useEditorActions, useEditorGridSize, useEditorStamp, useEditorStyle } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bold, Italic, Type, Square, Maximize2, Grid, Palette, Blend } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { PopoverType } from "@/types/types";
import { FONT_SIZES, FONT_FAMILIES } from "@/utils/constants";

const CellsToolbar = React.memo(() => {
    const style = useEditorStyle();
    const gridSize = useEditorGridSize();
    const stamp = useEditorStamp();
    const actions = useEditorActions();
    const [activePopover, setActivePopover] = React.useState<PopoverType>(null);
    const colorDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
        };
    }, []);

    const debouncedStyleUpdate = useCallback(
        (patch: Parameters<typeof actions.updateStyle>[0]) => {
            if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
            colorDebounceRef.current = setTimeout(() => {
                actions.updateStyle(patch);
            }, 120);
        },
        [actions]
    );

    React.useEffect(() => {
        if (style.cellSize > (gridSize === 3 ? 350 : 200)) {
            actions.updateStyle({
                cellSize: gridSize === 3 ? 350 : 200,
            });
            actions.updateStamp({
                ...stamp,
                size: gridSize === 3 ? 330 : 180,
            });
        }
    }, [style.cellSize, gridSize, actions, stamp]);

    const handleFontFamilyChange = useCallback(
        (value: string) => {
            actions.updateStyle({ fontFamily: value });
        },
        [actions]
    );

    const handleFontSizeChange = useCallback(
        (value: string) => {
            actions.updateStyle({ fontSize: parseInt(value, 10) });
        },
        [actions]
    );

    const handleToggleBold = useCallback(() => {
        actions.updateStyle({
            fontWeight: style.fontWeight === "bold" ? "normal" : "bold",
        });
    }, [actions, style.fontWeight]);

    const handleToggleItalic = useCallback(() => {
        actions.updateStyle({
            fontStyle: style.fontStyle === "italic" ? "normal" : "italic",
        });
    }, [actions, style.fontStyle]);

    const handleTextColorChange = useCallback(
        (color: string) => {
            debouncedStyleUpdate({ color });
        },
        [debouncedStyleUpdate]
    );

    const handleBackgroundOpacityChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            actions.updateStyle({
                cellBackgroundOpacity: parseInt(e.target.value),
            });
        },
        [actions]
    );

    const handleCellSizeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newSize = parseInt(e.target.value);
            actions.updateStyle({
                cellSize: newSize,
            });
            actions.updateStamp({
                ...stamp,
                size: newSize - 20,
            });
        },
        [actions, stamp]
    );

    const handleGapChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            actions.updateStyle({
                gap: parseInt(e.target.value),
            });
        },
        [actions]
    );

    const handleCellBackgroundColorChange = useCallback(
        (color: string) => {
            debouncedStyleUpdate({ cellBackgroundColor: color });
        },
        [debouncedStyleUpdate]
    );

    const handleBorderColorChange = useCallback(
        (color: string) => {
            debouncedStyleUpdate({ cellBorderColor: color });
        },
        [debouncedStyleUpdate]
    );

    const handleBorderWidthChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            actions.updateStyle({
                cellBorderWidth: parseInt(e.target.value),
            });
        },
        [actions]
    );

    return (
        <div className='flex flex-col items-center gap-1 p-2'>
            <div className='flex items-center justify-between w-full'>
                <span>Font Family</span>
                <Select value={style.fontFamily} onValueChange={handleFontFamilyChange}>
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
                <Select value={style.fontSize.toString()} onValueChange={handleFontSizeChange}>
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
                    className={cn(style.fontWeight === "bold" && "bg-accent")}
                    onClick={handleToggleBold}
                >
                    <Bold className='h-4 w-4' />
                </Button>
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Italic</span>
                <Button
                    variant='ghost'
                    size='icon'
                    className={cn(style.fontStyle === "italic" && "bg-accent")}
                    onClick={handleToggleItalic}
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
                        {activePopover === "textColor" && (
                            <HexColorPicker color={style.color} onChange={handleTextColorChange} />
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Cell Background Opacity</span>
                <div className='flex items-center ml-2 gap-2'>
                    <Blend className='h-4 w-4' />
                    <Input
                        type='number'
                        value={style.cellBackgroundOpacity}
                        onChange={handleBackgroundOpacityChange}
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
                        value={style.cellSize}
                        onChange={handleCellSizeChange}
                        min={100}
                        max={gridSize === 3 ? 350 : 200}
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
                        value={style.gap}
                        onChange={handleGapChange}
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
                        {activePopover === "cellBackgroundColor" && (
                            <HexColorPicker
                                color={style.cellBackgroundColor}
                                onChange={handleCellBackgroundColorChange}
                            />
                        )}
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
                        {activePopover === "borderColor" && (
                            <HexColorPicker color={style.cellBorderColor} onChange={handleBorderColorChange} />
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            <div className='flex items-center justify-between w-full'>
                <span>Border Width</span>
                <div className='flex items-center gap-2'>
                    <Square className='h-4 w-4' />
                    <Input
                        type='number'
                        value={style.cellBorderWidth}
                        onChange={handleBorderWidthChange}
                        min={0}
                        step={1}
                        className='w-20'
                    />
                </div>
            </div>
        </div>
    );
});

CellsToolbar.displayName = "CellsToolbar";

export default CellsToolbar;
