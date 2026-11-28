"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    useEditorActions,
    useEditorCell,
    useEditorGridSize,
    useEditorSelectedCell,
    useEditorStamp,
    useEditorStyle,
} from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Bold,
    Italic,
    Type,
    Square,
    Maximize2,
    Grid,
    Palette,
    Blend,
    RotateCcw,
    ImagePlus,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { CellStyle, PopoverType, Style } from "@/types/types";
import { FONT_SIZES, FONT_FAMILIES } from "@/utils/constants";
import { uploadImagesToBingo } from "@/lib/client-s3upload";
import { deleteImageViaApi } from "@/lib/image-tracker";
import { useIsAuth } from "@/hooks/useIsAuth";
import { toast } from "sonner";

const CellsToolbar = React.memo(() => {
    const style = useEditorStyle();
    const gridSize = useEditorGridSize();
    const stamp = useEditorStamp();
    const selectedCellIndex = useEditorSelectedCell();
    const selectedCell = useEditorCell(selectedCellIndex ?? -1);
    const actions = useEditorActions();
    const isAuth = useIsAuth();

    const [scope, setScope] = useState<"all" | "cell">("all");
    const [activePopover, setActivePopover] = useState<PopoverType>(null);
    const [isUploading, setIsUploading] = useState(false);
    const colorDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Automatically switch to cell scope when a cell is clicked, and back to "all" when deselected
    useEffect(() => {
        if (selectedCellIndex !== null) {
            setScope("cell");
        } else {
            setScope("all");
        }
    }, [selectedCellIndex]);

    useEffect(() => {
        return () => {
            if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
        };
    }, []);

    const isCellScope = scope === "cell" && selectedCellIndex !== null && !!selectedCell;
    const cellStyle = isCellScope ? selectedCell?.cellStyle : undefined;

    const effectiveFontFamily = cellStyle?.fontFamily ?? style.fontFamily;
    const effectiveFontSize = cellStyle?.fontSize ?? style.fontSize;
    const effectiveFontWeight = cellStyle?.fontWeight ?? style.fontWeight;
    const effectiveFontStyle = cellStyle?.fontStyle ?? style.fontStyle;
    const effectiveColor = cellStyle?.color ?? style.color;
    const effectiveBgOpacity = cellStyle?.cellBackgroundOpacity ?? style.cellBackgroundOpacity;
    const effectiveBgColor = cellStyle?.cellBackgroundColor ?? style.cellBackgroundColor;
    const effectiveBorderColor = cellStyle?.cellBorderColor ?? style.cellBorderColor;
    const effectiveBorderWidth = cellStyle?.cellBorderWidth ?? style.cellBorderWidth;

    const applyPatch = useCallback(
        (patch: Partial<Style & CellStyle>) => {
            if (isCellScope && selectedCellIndex !== null) {
                actions.updateCell(selectedCellIndex, {
                    cellStyle: {
                        ...cellStyle,
                        ...patch,
                    },
                });
            } else {
                actions.updateStyle(patch);
            }
        },
        [isCellScope, selectedCellIndex, cellStyle, actions]
    );

    const debouncedApplyPatch = useCallback(
        (patch: Partial<Style & CellStyle>) => {
            if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
            colorDebounceRef.current = setTimeout(() => {
                applyPatch(patch);
            }, 120);
        },
        [applyPatch]
    );

    useEffect(() => {
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
        (value: string) => applyPatch({ fontFamily: value }),
        [applyPatch]
    );

    const handleFontSizeChange = useCallback(
        (value: string) => applyPatch({ fontSize: parseInt(value, 10) }),
        [applyPatch]
    );

    const handleToggleBold = useCallback(() => {
        applyPatch({ fontWeight: effectiveFontWeight === "bold" ? "normal" : "bold" });
    }, [applyPatch, effectiveFontWeight]);

    const handleToggleItalic = useCallback(() => {
        applyPatch({ fontStyle: effectiveFontStyle === "italic" ? "normal" : "italic" });
    }, [applyPatch, effectiveFontStyle]);

    const handleTextColorChange = useCallback(
        (color: string) => debouncedApplyPatch({ color }),
        [debouncedApplyPatch]
    );

    const handleBackgroundOpacityChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const parsed = parseInt(e.target.value, 10);
            if (Number.isNaN(parsed)) return;
            applyPatch({ cellBackgroundOpacity: Math.max(0, Math.min(100, parsed)) });
        },
        [applyPatch]
    );

    const handleCellSizeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const parsed = parseInt(e.target.value, 10);
            if (Number.isNaN(parsed)) return;
            const maxSize = gridSize === 3 ? 350 : 200;
            const clamped = Math.max(100, Math.min(maxSize, parsed));
            actions.updateStyle({ cellSize: clamped });
            actions.updateStamp({ ...stamp, size: Math.max(20, clamped - 20) });
        },
        [actions, stamp, gridSize]
    );

    const handleGapChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const parsed = parseInt(e.target.value, 10);
            if (Number.isNaN(parsed)) return;
            actions.updateStyle({ gap: Math.max(0, Math.min(80, parsed)) });
        },
        [actions]
    );

    const handleCellBackgroundColorChange = useCallback(
        (color: string) => debouncedApplyPatch({ cellBackgroundColor: color }),
        [debouncedApplyPatch]
    );

    const handleBorderColorChange = useCallback(
        (color: string) => debouncedApplyPatch({ cellBorderColor: color }),
        [debouncedApplyPatch]
    );

    const handleBorderWidthChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const parsed = parseInt(e.target.value, 10);
            if (Number.isNaN(parsed)) return;
            applyPatch({ cellBorderWidth: Math.max(0, Math.min(20, parsed)) });
        },
        [applyPatch]
    );

    const handleResetCellStyle = useCallback(() => {
        if (selectedCellIndex === null) return;
        actions.updateCell(selectedCellIndex, { cellStyle: null });
    }, [actions, selectedCellIndex]);

    const handleCellImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || selectedCellIndex === null) return;
        if (!isAuth) {
            toast.error("Please log in to upload images");
            return;
        }
        setIsUploading(true);
        try {
            const filesMap = new Map<string, { file: File; type: "cell" | "background" | "stamp"; position?: number }>([
                [`cell-${selectedCellIndex}`, { file, type: "cell", position: selectedCellIndex }],
            ]);
            const uploaded = await uploadImagesToBingo(filesMap);
            const url = uploaded[0]?.url;
            if (url) {
                actions.updateCell(selectedCellIndex, {
                    cellStyle: {
                        ...cellStyle,
                        cellBackgroundImage: url,
                        cellBackgroundImageOpacity: cellStyle?.cellBackgroundImageOpacity ?? 100,
                        cellBackgroundImagePosition: cellStyle?.cellBackgroundImagePosition ?? "50% 50%",
                        cellBackgroundImageSize: cellStyle?.cellBackgroundImageSize ?? 100,
                    },
                });
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to upload image");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemoveCellImage = async () => {
        if (selectedCellIndex === null || !cellStyle?.cellBackgroundImage) return;
        const url = cellStyle.cellBackgroundImage;
        actions.updateCell(selectedCellIndex, {
            cellStyle: {
                ...cellStyle,
                cellBackgroundImage: null,
            },
        });
        try {
            await deleteImageViaApi({ url });
        } catch {
            // Non-blocking cleanup
        }
    };

    return (
        <div className='flex flex-col items-center gap-1.5 p-1'>
            {/* Contextual Scope Bar when a cell is selected */}
            {selectedCellIndex !== null && (
                <div className='w-full mb-2 pb-2.5 border-b border-border/60 flex items-center justify-between gap-2'>
                    <div className='grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-muted/70 border border-border/60 flex-1'>
                        <button
                            type='button'
                            onClick={() => setScope("all")}
                            className={`py-1 px-2 rounded-md text-xs font-medium transition-colors ${
                                !isCellScope
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            All cells
                        </button>
                        <button
                            type='button'
                            onClick={() => setScope("cell")}
                            className={`py-1 px-2 rounded-md text-xs font-medium transition-colors ${
                                isCellScope
                                    ? "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Cell #{selectedCellIndex + 1}
                        </button>
                    </div>

                    {isCellScope && (
                        <button
                            type='button'
                            onClick={handleResetCellStyle}
                            title='Reset this cell to default style'
                            aria-label='Reset cell style'
                            className='h-7 w-7 rounded-md border border-border bg-card/70 hover:bg-muted inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0'
                        >
                            <RotateCcw className='h-3.5 w-3.5' />
                        </button>
                    )}
                </div>
            )}

            <div className='flex items-center justify-between gap-2 w-full'>
                <span className='text-sm whitespace-nowrap'>Font Family</span>
                <Select value={effectiveFontFamily} onValueChange={handleFontFamilyChange}>
                    <SelectTrigger className='w-[152px] shrink-0'>
                        <Type className='h-4 w-4 mr-1.5 shrink-0' />
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

            <div className='flex items-center justify-between gap-2 w-full'>
                <span className='text-sm whitespace-nowrap'>Font Size</span>
                <Select value={effectiveFontSize.toString()} onValueChange={handleFontSizeChange}>
                    <SelectTrigger className='w-[88px] shrink-0'>
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

            <div className='flex items-center justify-between gap-2 w-full'>
                <span className='text-sm whitespace-nowrap'>Bold</span>
                <Button
                    variant='ghost'
                    size='icon'
                    className={cn(effectiveFontWeight === "bold" && "bg-accent")}
                    onClick={handleToggleBold}
                >
                    <Bold className='h-4 w-4' />
                </Button>
            </div>

            <div className='flex items-center justify-between gap-2 w-full'>
                <span className='text-sm whitespace-nowrap'>Italic</span>
                <Button
                    variant='ghost'
                    size='icon'
                    className={cn(effectiveFontStyle === "italic" && "bg-accent")}
                    onClick={handleToggleItalic}
                >
                    <Italic className='h-4 w-4' />
                </Button>
            </div>

            <div className='flex items-center justify-between gap-2 w-full'>
                <span className='text-sm whitespace-nowrap'>Text Color</span>
                <Popover
                    open={activePopover === "textColor"}
                    onOpenChange={(isOpen) => setActivePopover(isOpen ? "textColor" : null)}
                >
                    <PopoverTrigger asChild>
                        <Button variant='outline' size='sm' className='h-8 px-2 gap-1.5 shrink-0'>
                            <span
                                className='h-4 w-4 rounded-[4px] border border-border shrink-0'
                                style={{ backgroundColor: effectiveColor }}
                            />
                            <Type className='h-3.5 w-3.5 text-muted-foreground' />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className='p-2 w-auto' side='bottom' align='end'>
                        {activePopover === "textColor" && (
                            <HexColorPicker color={effectiveColor} onChange={handleTextColorChange} />
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            <div className='flex items-center justify-between gap-2 w-full'>
                <span className='text-sm whitespace-nowrap'>Cell Opacity</span>
                <div className='flex items-center gap-2 shrink-0'>
                    <Blend className='h-4 w-4 text-muted-foreground' />
                    <Input
                        type='number'
                        value={effectiveBgOpacity}
                        onChange={handleBackgroundOpacityChange}
                        min={0}
                        max={100}
                        step={1}
                        className='w-20 h-8'
                    />
                </div>
            </div>

            {!isCellScope && (
                <>
                    <div className='flex items-center justify-between gap-2 w-full'>
                        <span className='text-sm whitespace-nowrap'>Cell Size</span>
                        <div className='flex items-center gap-2 shrink-0'>
                            <Maximize2 className='h-4 w-4 text-muted-foreground' />
                            <Input
                                type='number'
                                value={style.cellSize}
                                onChange={handleCellSizeChange}
                                min={100}
                                max={gridSize === 3 ? 350 : 200}
                                step={1}
                                className='w-20 h-8'
                            />
                        </div>
                    </div>

                    <div className='flex items-center justify-between gap-2 w-full'>
                        <span className='text-sm whitespace-nowrap'>Cell Gap</span>
                        <div className='flex items-center gap-2 shrink-0'>
                            <Grid className='h-4 w-4 text-muted-foreground' />
                            <Input
                                type='number'
                                value={style.gap}
                                onChange={handleGapChange}
                                min={0}
                                max={80}
                                step={1}
                                className='w-20 h-8'
                            />
                        </div>
                    </div>
                </>
            )}

            <div className='flex items-center justify-between gap-2 w-full'>
                <span className='text-sm whitespace-nowrap'>Cell Bg Color</span>
                <Popover
                    open={activePopover === "cellBackgroundColor"}
                    onOpenChange={(isOpen) => setActivePopover(isOpen ? "cellBackgroundColor" : null)}
                >
                    <PopoverTrigger asChild>
                        <Button variant='outline' size='sm' className='h-8 px-2 gap-1.5 shrink-0'>
                            <span
                                className='h-4 w-4 rounded-[4px] border border-border shrink-0'
                                style={{ backgroundColor: effectiveBgColor }}
                            />
                            <Palette className='h-3.5 w-3.5 text-muted-foreground' />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className='p-2 w-auto' side='bottom' align='end'>
                        {activePopover === "cellBackgroundColor" && (
                            <HexColorPicker color={effectiveBgColor} onChange={handleCellBackgroundColorChange} />
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            <div className='flex items-center justify-between gap-2 w-full'>
                <span className='text-sm whitespace-nowrap'>Border Color</span>
                <Popover
                    open={activePopover === "borderColor"}
                    onOpenChange={(isOpen) => setActivePopover(isOpen ? "borderColor" : null)}
                >
                    <PopoverTrigger asChild>
                        <Button variant='outline' size='sm' className='h-8 px-2 gap-1.5 shrink-0'>
                            <span
                                className='h-4 w-4 rounded-[4px] border border-border shrink-0'
                                style={{ backgroundColor: effectiveBorderColor }}
                            />
                            <Square className='h-3.5 w-3.5 text-muted-foreground' />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className='p-2 w-auto' side='bottom' align='end'>
                        {activePopover === "borderColor" && (
                            <HexColorPicker color={effectiveBorderColor} onChange={handleBorderColorChange} />
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            <div className='flex items-center justify-between gap-2 w-full'>
                <span className='text-sm whitespace-nowrap'>Border Width</span>
                <div className='flex items-center gap-2 shrink-0'>
                    <Square className='h-4 w-4 text-muted-foreground' />
                    <Input
                        type='number'
                        value={effectiveBorderWidth}
                        onChange={handleBorderWidthChange}
                        min={0}
                        max={20}
                        step={1}
                        className='w-20 h-8'
                    />
                </div>
            </div>

            {/* Per-Cell Background Image (only when editing an individual cell) */}
            {isCellScope && (
                <div className='w-full mt-2 pt-2.5 border-t border-border/60 space-y-2'>
                    <div className='flex items-center justify-between'>
                        <span className='text-sm'>Cell Image</span>
                        <div className='flex items-center gap-1.5'>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/*'
                                className='hidden'
                                onChange={(e) => void handleCellImageUpload(e)}
                            />
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                                className='h-8 px-2.5 text-xs'
                            >
                                <ImagePlus className='h-3.5 w-3.5 mr-1.5' />
                                {isUploading ? "Uploading..." : cellStyle?.cellBackgroundImage ? "Replace" : "Upload"}
                            </Button>
                            {cellStyle?.cellBackgroundImage && (
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    onClick={() => void handleRemoveCellImage()}
                                    aria-label='Remove cell image'
                                    className='h-8 w-8 text-muted-foreground hover:text-destructive'
                                >
                                    <Trash2 className='h-3.5 w-3.5' />
                                </Button>
                            )}
                        </div>
                    </div>

                    {cellStyle?.cellBackgroundImage && (
                        <div className='flex items-center justify-between'>
                            <span className='text-xs text-muted-foreground'>Image Opacity</span>
                            <Input
                                type='number'
                                value={cellStyle.cellBackgroundImageOpacity ?? 100}
                                onChange={(e) =>
                                    applyPatch({ cellBackgroundImageOpacity: parseInt(e.target.value, 10) })
                                }
                                min={0}
                                max={100}
                                step={5}
                                className='w-20 h-8 text-xs'
                            />
                        </div>
                    )}
                </div>
            )}

            {selectedCellIndex === null && (
                <p className='w-full text-[11px] text-muted-foreground/80 pt-2 mt-1 border-t border-border/50'>
                    Tip: Click any square on the board to style it individually.
                </p>
            )}
        </div>
    );
});

CellsToolbar.displayName = "CellsToolbar";

export default CellsToolbar;
