"use client";
import React, { ChangeEvent, useRef, useState, useEffect, useCallback, useMemo } from "react";
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
import { toast } from "sonner";
import { ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from "@/components/ui/context-menu";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { uploadImagesToBingo } from "@/lib/client-s3upload";
import { deleteImageFromS3 } from "@/app/actions/delete-image";
import { UploadError } from "@/lib/errors";
import { useIsAuth } from "@/hooks/useIsAuth";

type CellContextMenuProps = {
  index: number;
};

const CellContextMenu = React.memo(({ index }: CellContextMenuProps) => {
  const { state, actions } = useEditor();
  const isAuth = useIsAuth();
  const [activePopover, setActivePopover] = useState<PopoverType>(null);
  const cellStyle = useMemo(() => state.cells[index]?.cellStyle ?? undefined, [state.cells, index]);
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => {
    const posStr = cellStyle?.cellBackgroundImagePosition || "50% 50%";
    const [x, y] = posStr.split(" ").map((val) => parseInt(val));
    return {
      x: isNaN(x!) ? 50 : x,
      y: isNaN(y!) ? 50 : y,
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const initialPositionRef = useRef({ x: 0, y: 0 });
  const initialMouseRef = useRef({ x: 0, y: 0 });
  // Use a mutable ref to track current position during drag operations
  const currentPositionRef = useRef(position);
  // This ref will store the animation frame ID
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!cellStyle?.cellBackgroundImage) return;

    const posStr = cellStyle.cellBackgroundImage;
    const [x, y] = posStr.split(" ").map((val) => parseInt(val));
    const newPosition = {
      x: isNaN(x!) ? 50 : x,
      y: isNaN(y!) ? 50 : y,
    };

    setPosition(newPosition);
    currentPositionRef.current = newPosition;
  }, [cellStyle?.cellBackgroundImage]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      // Cancel any pending animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Schedule a new frame
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - initialMouseRef.current.x;
        const deltaY = e.clientY - initialMouseRef.current.y;

        const newX = Math.max(0, Math.min(100, initialPositionRef.current.x + (deltaX / rect.width) * 100));
        const newY = Math.max(0, Math.min(100, initialPositionRef.current.y + (deltaY / rect.height) * 100));

        // Update the mutable ref
        currentPositionRef.current = { x: newX, y: newY };

        // Update the state (this triggers a render)
        setPosition(currentPositionRef.current);

        animationFrameRef.current = null;
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);

        // Clean up any pending animation frame
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Use the current position from ref for the final update
        actions.updateCell(index, {
          cellStyle: {
            ...cellStyle,
            cellBackgroundImagePosition: `${currentPositionRef.current.x}% ${currentPositionRef.current.y}%`,
          },
        });
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      // Clean up any pending animation frame on unmount
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isDragging, actions, cellStyle, index]);

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      initialPositionRef.current = { x: position.x!, y: position.y! };
      initialMouseRef.current = { x: e.clientX, y: e.clientY };
    },
    [position.x, position.y]
  );
  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      setPosition({ x, y });
      actions.updateCell(index, {
        cellStyle: {
          ...cellStyle,
          cellBackgroundImagePosition: `${x}% ${y}%`,
        },
      });
    },
    [containerRef, actions, index, cellStyle]
  );

  const errorToast = useCallback((message: string) => {
    toast.error(message, {
      duration: 3000,
    });
  }, []);

  const handleRemoveStyling = useCallback(() => {
    // Set cellStyle to null explicitly to indicate deletion
    actions.updateCell(index, {
      cellStyle: null,
    });
  }, [actions, index]);
  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!isAuth) {
        errorToast("You must be logged in to upload images");
        return;
      }
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

      try {
        setIsUploading(true);

        // Setup for direct S3 upload without using local image preview
        const files = new Map<
          string,
          {
            file: File;
            type: "cell" | "background" | "stamp";
            position?: number;
          }
        >();
        files.set(`cell-${index}`, {
          file,
          type: "cell",
          position: index,
        });

        // Upload the image directly to S3
        const uploadedImages = await uploadImagesToBingo(files);

        // Update cell with the S3 URL
        if (uploadedImages && uploadedImages.length > 0) {
          const uploadedImage = uploadedImages.find((img) => img.position === index);
          if (uploadedImage) {
            actions.updateCell(index, {
              cellStyle: {
                ...cellStyle,
                cellBackgroundImage: uploadedImage.url,
                cellBackgroundImageOpacity: 100,
                cellBackgroundImagePosition: "50% 50%",
                cellBackgroundImageSize: 100,
              },
            });

            toast.success("Image uploaded successfully");
          }
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        // Check for error properties instead of instanceof since errors from server actions lose prototype chain
        const errorMessage =
          error && typeof error === "object" && "code" in error && "message" in error
            ? String(error.message)
            : error instanceof UploadError
            ? error.message
            : "Unknown error";

        errorToast(`Upload failed: ${errorMessage}`);
      } finally {
        setIsUploading(false);
      }
    },
    [actions, errorToast, index, cellStyle, isAuth]
  );
  const handleRemoveImage = useCallback(() => {
    if (cellStyle?.cellBackgroundImage) {
      const removeImage = async () => {
        try {
          // Delete the image from S3 first - ensure we have a valid URL
          if (typeof cellStyle.cellBackgroundImage === "string") {
            await deleteImageFromS3({ url: cellStyle.cellBackgroundImage });
            toast.success("Image deleted successfully");
          }

          // Then update the UI
          actions.updateCell(index, {
            cellStyle: {
              ...cellStyle,
              cellBackgroundImage: null, // Use null instead of undefined
              cellBackgroundImageOpacity: null,
              cellBackgroundImagePosition: null,
              cellBackgroundImageSize: null,
            },
          });
        } catch (error) {
          console.error("Error deleting image:", error);
          errorToast(`Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}`);

          // Still clear the UI even if server deletion fails
          actions.updateCell(index, {
            cellStyle: {
              ...cellStyle,
              cellBackgroundImage: null,
              cellBackgroundImageOpacity: null,
              cellBackgroundImagePosition: null,
              cellBackgroundImageSize: null,
            },
          });
        }
      };

      // Execute the async function
      void removeImage();
    }
  }, [cellStyle, actions, index, errorToast]);

  return (
    <div>
      <Tabs defaultValue="style" className="p-2">
        <TabsList className="flex h-12">
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
        </TabsList>
        <TabsContent value="style">
          <div className="flex flex-col items-center gap-2 p-2 text-xs text-foreground/50">
            <div className="flex items-center justify-between w-full">
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
                <SelectTrigger className="w-auto">
                  <Type className="h-4 w-4 mr-2" />
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

            <div className="flex items-center justify-between w-full">
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
                <SelectTrigger className="w-[80px]">
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

            <div className="flex items-center justify-between w-full">
              <span>Bold</span>
              <Button
                variant="ghost"
                size="icon"
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
                <Bold className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between w-full">
              <span>Italic</span>
              <Button
                variant="ghost"
                size="icon"
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
                <Italic className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between w-full">
              <span>Text Color</span>
              <ContextMenuSub
                open={activePopover === "textColor"}
                onOpenChange={(isOpen) => setActivePopover(isOpen ? "textColor" : null)}
              >
                <ContextMenuSubTrigger>
                  <Button variant="ghost" size="icon">
                    <Type className="h-4 w-4" />
                  </Button>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="p-0 z-10">
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

            <div className="flex items-center justify-between w-full">
              <span>Cell Background Opacity</span>
              <div className="flex items-center ml-2 gap-2">
                <Input
                  type="number"
                  value={cellStyle?.cellBackgroundOpacity ?? state.style.cellBackgroundOpacity}
                  onChange={(e) =>
                    actions.updateCell(index, {
                      cellStyle: {
                        ...cellStyle,
                        cellBackgroundOpacity: parseInt(e.target.value),
                      },
                    })
                  }
                  min={0}
                  max={100}
                  step={1}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between w-full">
              <span>Cell Background Color</span>
              <ContextMenuSub
                open={activePopover === "cellBackgroundColor"}
                onOpenChange={(isOpen) => setActivePopover(isOpen ? "cellBackgroundColor" : null)}
              >
                <ContextMenuSubTrigger>
                  <Button variant="ghost" size="icon">
                    <Palette className="h-4 w-4" />
                  </Button>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="p-0 w-auto">
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

            <div className="flex items-center justify-between w-full">
              <span>Border Color</span>
              <ContextMenuSub
                open={activePopover === "borderColor"}
                onOpenChange={(isOpen) => setActivePopover(isOpen ? "borderColor" : null)}
              >
                <ContextMenuSubTrigger>
                  <Button variant="ghost" size="icon">
                    <Square className="h-4 w-4" />
                  </Button>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="p-0">
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

            <div className="flex items-center justify-between gap-1 w-full">
              <span>Border Width</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
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
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between w-full">
              <span>Reset Style</span>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => void handleRemoveStyling()}
                disabled={!cellStyle}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="image">
          <div>
            {cellStyle?.cellBackgroundImage ? (
              <div className="flex flex-col gap-4 items-center justify-between w-full">
                <div
                  ref={containerRef}
                  className="relative w-full h-56 border rounded-lg overflow-hidden cursor-pointer"
                  onClick={handleImageClick}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${cellStyle.cellBackgroundImage})`,
                      backgroundSize: `${cellStyle.cellBackgroundImageSize || 100}%`,
                      backgroundPosition: `${position.x}% ${position.y}%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                  <div
                    onMouseDown={startDrag}
                    className="absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                    }}
                  />
                </div>
                <Label htmlFor="opacity" className="text-foreground/50">
                  Image Opacity
                </Label>{" "}
                <Slider
                  defaultValue={[cellStyle?.cellBackgroundImageOpacity ?? 100]}
                  onValueChange={(value: number[]) => {
                    // Use requestAnimationFrame for better performance on opacity changes
                    requestAnimationFrame(() => {
                      actions.updateCell(index, {
                        cellStyle: {
                          ...cellStyle,
                          cellBackgroundImageOpacity: value[0]!,
                        },
                      });
                    });
                  }}
                  step={1}
                  min={0}
                  max={100}
                  id="opacity"
                />
                <Label htmlFor="zoom" className="text-foreground/50">
                  Zoom
                </Label>{" "}
                <Slider
                  defaultValue={[cellStyle?.cellBackgroundImageSize ?? 100]}
                  onValueChange={(value: number[]) => {
                    // Use requestAnimationFrame for better performance on zoom changes
                    requestAnimationFrame(() => {
                      actions.updateCell(index, {
                        cellStyle: {
                          ...cellStyle,
                          cellBackgroundImageSize: value[0]!,
                        },
                      });
                    });
                  }}
                  step={1}
                  min={50}
                  max={200}
                  id="zoom"
                />
                <Button variant="destructive" onClick={handleRemoveImage}>
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input type="file" onChange={(e) => void handleFileSelect(e)} disabled={isUploading} />
                {isUploading && (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2"></div>
                    <span className="text-xs text-muted-foreground">Uploading...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

CellContextMenu.displayName = "CellContextMenu";

export default CellContextMenu;
