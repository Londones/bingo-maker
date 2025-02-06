"use client";
import React, { ChangeEvent, useEffect } from "react";
import { useEditor } from "@/hooks/useEditor";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bold, Italic, Type, Square, Palette, RotateCcw } from "lucide-react";
import { cn, handleLocalImage } from "@/lib/utils";
import { HexColorPicker } from "react-colorful";
import { PopoverType } from "@/types/types";
import { FONT_SIZES, FONT_FAMILIES } from "@/utils/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
//import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";
import { ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from "@/components/ui/context-menu";
import Image from "next/image";
// import { Slider } from "@/components/ui/slider";
// import { Label } from "@/components/ui/label";

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
        actions.removeCellLocalImage(index);
        actions.updateCell(index, {
            cellStyle: undefined,
        });
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            errorToast("Please select an image file");
            return;
        }

        // Validate file size (4MB)
        if (file.size > 4 * 1024 * 1024) {
            errorToast("Image must be less than 4MB");
            return;
        }

        const localImage = handleLocalImage(file, index);

        actions.setLocalImage(localImage);
    };

    useEffect(() => {
        return () => {
            if (cellStyle?.cellBackgroundImage) {
                URL.revokeObjectURL(cellStyle.cellBackgroundImage);
            }
        };
    }, [cellStyle]);

    // const handleRemoveImage = async (): Promise<boolean> => {
    //     if (!cellStyle?.cellBackgroundImage) return true;
    //     try {
    //         const fileKey = cellStyle.cellBackgroundImage.split("/").pop();
    //         if (!fileKey) return true;

    //         const response = await fetch("/api/uploadthing/delete", {
    //             method: "DELETE",
    //             body: JSON.stringify({ fileKey }),
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //         });

    //         if (!response.ok) {
    //             throw new Error("Failed to delete image");
    //         }

    //         actions.updateCell(index, {
    //             cellStyle: {
    //                 ...cellStyle,
    //                 cellBackgroundImage: undefined,
    //                 cellBackgroundImageOpacity: undefined,
    //             },
    //         });
    //         return true;
    //     } catch (err: unknown) {
    //         if (err instanceof Error) {
    //             errorToast(err.message);
    //         } else {
    //             errorToast("An error occurred while removing the image");
    //         }
    //         return false;
    //     }
    // };

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
                                onClick={() => void handleRemoveStyling()}
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
                                {/* <Label htmlFor='opacity' className='text-foreground/50'>
                                    Image Opacity
                                </Label>
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
                                /> */}
                                <Button variant='destructive' onClick={() => actions.removeCellLocalImage(index)}>
                                    Remove Image
                                </Button>
                            </div>
                        ) : (
                            <Input type='file' onChange={(e) => handleFileSelect(e)} />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CellContextMenu;
