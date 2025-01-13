"use client";
import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bold, Italic, Type, Square, Palette, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { HexColorPicker } from "react-colorful";
import { PopoverType } from "@/types/types";
import { FONT_SIZES, FONT_FAMILIES } from "@/utils/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";
import { ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from "@/components/ui/context-menu";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

type CellContextMenuProps = {
    index: number;
};

const CellContextMenu = ({ index }: CellContextMenuProps) => {
    const { state, actions } = useEditor();
    const [activePopover, setActivePopover] = React.useState<PopoverType>(null);
    const cellStyle = state.cells[index]?.cellStyle ?? undefined;

    const errorToast = (message: string) => {
        toast.error(message, {
            duration: 3000,
        });
    };

    const handleRemoveStyling = () => {
        handleRemoveImage();
        actions.updateCell(index, {
            cellStyle: undefined,
        });
    };

    const handleRemoveImage = () => {
        if (cellStyle?.cellBackgroundImage) {
            void (async () => {
                try {
                    const fileKey = cellStyle?.cellBackgroundImage?.split("/").pop();
                    if (fileKey) {
                        const response = await fetch("/api/uploadthing/delete", {
                            method: "DELETE",
                            body: JSON.stringify({ fileKey }),
                            headers: {
                                "Content-Type": "application/json",
                            },
                        });

                        if (!response.ok) {
                            throw new Error("Failed to delete image");
                        }

                        actions.updateCell(index, {
                            cellStyle: {
                                ...cellStyle,
                                cellBackgroundImage: undefined,
                                cellBackgroundImageOpacity: undefined,
                            },
                        });
                    }
                } catch (err: unknown) {
                    if (err instanceof Error) {
                        errorToast(err.message);
                    } else {
                        errorToast("An unknown error occurred");
                    }
                }
            })();
        }
    };

    return (
        <div>
            <Tabs defaultValue='style' className='p-2'>
                <TabsList className='flex h-12'>
                    <TabsTrigger value='style'>Style</TabsTrigger>
                    <TabsTrigger value='image'>Image</TabsTrigger>
                </TabsList>
                <TabsContent value='style'>
                    <div className='flex flex-col items-center gap-2 p-2 text-xs text-foreground/50'>
                        <div className='flex items-center justify-between w-full'>
                            <span>Font Family</span>
                            <Select
                                value={cellStyle?.fontFamily ?? state.style.fontFamily}
                                onValueChange={(value) =>
                                    actions.updateCell(index, {
                                        cellStyle: {
                                            ...cellStyle,
                                            fontFamily: value,
                                        },
                                    })
                                }
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
                                value={cellStyle?.fontSize?.toString() ?? state.style.fontSize.toString()}
                                onValueChange={(value) =>
                                    actions.updateCell(index, {
                                        cellStyle: {
                                            ...cellStyle,
                                            fontSize: parseInt(value, 10),
                                        },
                                    })
                                }
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
                                className={cn(
                                    (cellStyle?.fontWeight === "bold" && "bg-accent") ??
                                        (state.style.fontWeight === "bold" && "bg-accent")
                                )}
                                onClick={() =>
                                    actions.updateCell(index, {
                                        cellStyle: {
                                            ...cellStyle,
                                            fontWeight: cellStyle?.fontWeight === "bold" ? "normal" : "bold",
                                        },
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
                                className={cn(
                                    (cellStyle?.fontStyle === "italic" && "bg-accent") ??
                                        (state.style.fontStyle === "italic" && "bg-accent")
                                )}
                                onClick={() =>
                                    actions.updateCell(index, {
                                        cellStyle: {
                                            ...cellStyle,
                                            fontStyle: cellStyle?.fontStyle === "italic" ? "normal" : "italic",
                                        },
                                    })
                                }
                            >
                                <Italic className='h-4 w-4' />
                            </Button>
                        </div>
                        <div className='flex items-center justify-between w-full'>
                            <span>Text Color</span>
                            <ContextMenuSub
                                open={activePopover === "textColor"}
                                onOpenChange={(isOpen) => setActivePopover(isOpen ? "textColor" : null)}
                            >
                                <ContextMenuSubTrigger>
                                    <Button variant='ghost' size='icon'>
                                        <Type className='h-4 w-4' />
                                    </Button>
                                </ContextMenuSubTrigger>
                                <ContextMenuSubContent className='p-0 z-10'>
                                    <HexColorPicker
                                        color={cellStyle?.color ?? state.style.color}
                                        onChange={(color) => {
                                            actions.updateCell(index, {
                                                cellStyle: {
                                                    ...cellStyle,
                                                    color: color,
                                                },
                                            });
                                        }}
                                    />
                                </ContextMenuSubContent>
                            </ContextMenuSub>
                        </div>

                        <div className='flex items-center justify-between w-full'>
                            <span>Cell Background Opacity</span>
                            <div className='flex items-center ml-2 gap-2'>
                                <Input
                                    type='number'
                                    value={
                                        (cellStyle?.cellBackgroundOpacity ?? state.style.cellBackgroundOpacity) * 100
                                    }
                                    onChange={(e) =>
                                        actions.updateCell(index, {
                                            cellStyle: {
                                                ...cellStyle,
                                                cellBackgroundOpacity: parseInt(e.target.value) / 100,
                                            },
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
                            <span>Cell Background Color</span>
                            <ContextMenuSub
                                open={activePopover === "cellBackgroundColor"}
                                onOpenChange={(isOpen) => setActivePopover(isOpen ? "cellBackgroundColor" : null)}
                            >
                                <ContextMenuSubTrigger>
                                    <Button variant='ghost' size='icon'>
                                        <Palette className='h-4 w-4' />
                                    </Button>
                                </ContextMenuSubTrigger>
                                <ContextMenuSubContent className='p-0 w-auto'>
                                    <HexColorPicker
                                        color={cellStyle?.cellBackgroundColor ?? state.style.cellBackgroundColor}
                                        onChange={(color) => {
                                            actions.updateCell(index, {
                                                cellStyle: {
                                                    ...cellStyle,
                                                    cellBackgroundColor: color,
                                                },
                                            });
                                        }}
                                    />
                                </ContextMenuSubContent>
                            </ContextMenuSub>
                        </div>

                        <div className='flex items-center justify-between w-full'>
                            <span>Border Color</span>
                            <ContextMenuSub
                                open={activePopover === "borderColor"}
                                onOpenChange={(isOpen) => setActivePopover(isOpen ? "borderColor" : null)}
                            >
                                <ContextMenuSubTrigger>
                                    <Button variant='ghost' size='icon'>
                                        <Square className='h-4 w-4' />
                                    </Button>
                                </ContextMenuSubTrigger>
                                <ContextMenuSubContent className='p-0'>
                                    <HexColorPicker
                                        color={cellStyle?.cellBorderColor ?? state.style.cellBorderColor}
                                        onChange={(color) => {
                                            actions.updateCell(index, {
                                                cellStyle: {
                                                    ...cellStyle,
                                                    cellBorderColor: color,
                                                },
                                            });
                                        }}
                                    />
                                </ContextMenuSubContent>
                            </ContextMenuSub>
                        </div>

                        <div className='flex items-center justify-between gap-1 w-full'>
                            <span>Border Width</span>
                            <div className='flex items-center gap-2'>
                                <Input
                                    type='number'
                                    value={cellStyle?.cellBorderWidth ?? state.style.cellBorderWidth}
                                    onChange={(e) =>
                                        actions.updateCell(index, {
                                            cellStyle: {
                                                ...cellStyle,
                                                cellBorderWidth: parseInt(e.target.value),
                                            },
                                        })
                                    }
                                    min={0}
                                    step={1}
                                    className='w-20'
                                />
                            </div>
                        </div>

                        <div className='flex items-center justify-between w-full'>
                            <span>Reset Style</span>
                            <Button
                                variant='destructive'
                                size='icon'
                                onClick={handleRemoveStyling}
                                disabled={!cellStyle}
                            >
                                <RotateCcw className='h-4 w-4' />
                            </Button>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value='image'>
                    <div>
                        {cellStyle?.cellBackgroundImage ? (
                            <div className='flex flex-col gap-2 items-center justify-between w-full'>
                                <Image
                                    src={cellStyle?.cellBackgroundImage}
                                    alt='Cell Background'
                                    width={96}
                                    height={96}
                                    className='object-cover rounded-md'
                                />
                                <Label htmlFor='opacity'>Image Opacity</Label>
                                <Slider
                                    defaultValue={[(cellStyle?.cellBackgroundImageOpacity ?? 1) * 100]}
                                    onValueChange={(value: number[]) => {
                                        actions.updateCell(index, {
                                            cellStyle: {
                                                ...cellStyle,
                                                cellBackgroundImageOpacity: value[0]! / 100,
                                            },
                                        });
                                    }}
                                    step={1}
                                    min={0}
                                    max={100}
                                    id='opacity'
                                />
                                <Button
                                    variant='destructive'
                                    onClick={() => {
                                        handleRemoveImage();
                                    }}
                                >
                                    Remove Image
                                </Button>
                            </div>
                        ) : (
                            <UploadButton
                                className='pt-2 ut-button:bg-black ut-button:text-white ut-button:ut-readying:bg-black/50 ut-button:ut-readying:text-white'
                                endpoint='cellBackgroundUploader'
                                onClientUploadComplete={(res) => {
                                    actions.updateCell(index, {
                                        cellStyle: {
                                            ...cellStyle,
                                            cellBackgroundImage: res[0]?.url,
                                            cellBackgroundImageOpacity: 1,
                                        },
                                    });
                                }}
                                onUploadError={(err) => {
                                    errorToast(err.message);
                                }}
                            />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CellContextMenu;
