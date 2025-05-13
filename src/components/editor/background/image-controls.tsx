// filepath: d:\Projects\bingo-maker\src\components\editor\background\image-controls.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEditor } from "@/hooks/useEditor";
import { useState, useRef, useEffect, ChangeEvent, useCallback, memo, useMemo } from "react";
import { toast } from "sonner";
import { uploadImagesToBingo } from "@/lib/client-s3upload";
import { deleteImageFromS3 } from "@/app/actions/delete-image";

const ImageControls = () => {
    const { state, actions } = useEditor();
    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // State for tracking uploads and refreshing
    const [isUploading, setIsUploading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [position, setPosition] = useState(() => {
        const posStr = state.background.backgroundImagePosition || "50% 50%";
        const [x, y] = posStr.split(" ").map((val) => parseInt(val));
        return {
            x: isNaN(x!) ? 50 : x,
            y: isNaN(y!) ? 50 : y,
        };
    });

    const [isDragging, setIsDragging] = useState(false);
    const initialPositionRef = useRef({ x: 0, y: 0 });
    const initialMouseRef = useRef({ x: 0, y: 0 });

    // Clean up any pending animations or timeouts on unmount
    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    // Debounced position update to reduce state updates to the editor
    const debouncedUpdatePosition = useCallback(() => {
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
            actions.updateBackground({
                backgroundImagePosition: `${position.x}% ${position.y}%`,
            });
            updateTimeoutRef.current = null;
        }, 100); // 100ms debounce
    }, [actions, position.x, position.y]);
    // Update position with requestAnimationFrame for smoother UI
    const updatePositionWithRaf = useCallback((newX: number, newY: number) => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        // Store the latest position values to avoid stale values
        const positionToUpdate = { x: newX, y: newY };

        rafRef.current = requestAnimationFrame(() => {
            setPosition(positionToUpdate);
            rafRef.current = null;
        });
    }, []); // Store dimensions in a ref to avoid repeated calculations
    const rectDimensionsRef = useRef({ width: 0, height: 0 });
    useEffect(() => {
        if (!isDragging) return;

        // Pre-calculate container dimensions when dragging starts
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            rectDimensionsRef.current = { width: rect.width, height: rect.height };
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            const deltaX = e.clientX - initialMouseRef.current.x;
            const deltaY = e.clientY - initialMouseRef.current.y;

            const newX = Math.max(
                0,
                Math.min(100, initialPositionRef.current.x + (deltaX / rectDimensionsRef.current.width) * 100)
            );
            const newY = Math.max(
                0,
                Math.min(100, initialPositionRef.current.y + (deltaY / rectDimensionsRef.current.height) * 100)
            );

            updatePositionWithRaf(newX, newY);
            // Update the background position with debounce while dragging
            debouncedUpdatePosition();
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            // Final position update when dragging ends
            actions.updateBackground({
                backgroundImagePosition: `${position.x}% ${position.y}%`,
            });
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, actions, position, updatePositionWithRaf, debouncedUpdatePosition]);
    const startDrag = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsDragging(true);
            initialPositionRef.current = { x: position.x!, y: position.y! };
            initialMouseRef.current = { x: e.clientX ?? 0, y: e.clientY ?? 0 };
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

            // Debounce to reduce editor state updates
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }

            updateTimeoutRef.current = setTimeout(() => {
                actions.updateBackground({
                    backgroundImagePosition: `${x}% ${y}%`,
                });
                updateTimeoutRef.current = null;
            }, 100);
        },
        [actions]
    );

    const errorToast = useCallback((message: string) => {
        toast.error(message, {
            duration: 3000,
        });
    }, []);
    const handleRemoveImage = useCallback(async () => {
        if (state.background.backgroundImage) {
            try {
                // Delete image from S3 if it's a remote URL (not local base64)
                if (
                    typeof state.background.backgroundImage === "string" &&
                    !state.background.backgroundImage.startsWith("data:")
                ) {
                    await deleteImageFromS3({ url: state.background.backgroundImage });
                }

                // Update state to remove the background image
                actions.updateBackground({
                    backgroundImage: undefined,
                    backgroundImageOpacity: undefined,
                    backgroundImagePosition: undefined,
                    backgroundImageSize: undefined,
                });
                toast.success("Background image removed");
            } catch (error) {
                console.error("Error removing background image:", error);
                errorToast("Failed to remove background image");
            }
        }
    }, [state.background.backgroundImage, actions, errorToast]);
    const handleFileSelect = useCallback(
        async (e: ChangeEvent<HTMLInputElement>) => {
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
                setIsUploading(true); // Show loading indicator for better user feedback
                setIsUploading(true);

                // 2. Set up files for direct S3 upload with caching
                const files = new Map<
                    string,
                    {
                        file: File;
                        type: "cell" | "background" | "stamp";
                        position?: number;
                    }
                >();

                files.set("background", {
                    file,
                    type: "background",
                });

                // 3. Upload directly to S3
                const uploadedImages = await uploadImagesToBingo(files); // 4. Update background with the S3 URL
                if (uploadedImages && uploadedImages.length > 0) {
                    const uploadedImage = uploadedImages.find((img) => img.type === "background");

                    if (uploadedImage) {
                        // Update background with S3 URL immediately - no delay
                        actions.updateBackground({
                            backgroundImage: uploadedImage.url,
                            backgroundImageOpacity: 100,
                            backgroundImagePosition: "50% 50%",
                            backgroundImageSize: 100,
                        });

                        toast.success("Background image uploaded successfully");
                    }
                }
            } catch (error) {
                console.error("Error uploading background image:", error);
                errorToast(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            } finally {
                setIsUploading(false);
            }
        },
        [actions, errorToast]
    ); // Use refs for tracking slider values during interaction
    const opacityValueRef = useRef<number>(state.background.backgroundImageOpacity ?? 100);
    const sizeValueRef = useRef<number>(state.background.backgroundImageSize ?? 100);

    // Update refs when state changes externally
    useEffect(() => {
        opacityValueRef.current = state.background.backgroundImageOpacity ?? 100;
    }, [state.background.backgroundImageOpacity]);

    useEffect(() => {
        sizeValueRef.current = state.background.backgroundImageSize ?? 100;
    }, [state.background.backgroundImageSize]); // Responsive opacity handler with immediate visual feedback
    const handleOpacityChange = useCallback(
        (value: number[]) => {
            // Ensure we have a valid number
            const newOpacity = value[0] ?? 100;

            // Store the current value in ref for immediate visual feedback
            opacityValueRef.current = newOpacity;

            // Use requestAnimationFrame for smoother visual updates
            requestAnimationFrame(() => {
                // Only update state after a small delay to avoid excessive state updates
                if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current);
                }

                updateTimeoutRef.current = setTimeout(() => {
                    actions.updateBackground({
                        backgroundImageOpacity: newOpacity,
                    });
                    updateTimeoutRef.current = null;
                }, 50); // Shorter delay for better responsiveness
            });
        },
        [actions]
    );

    // Responsive size handler with immediate visual feedback
    const handleSizeChange = useCallback(
        (value: number[]) => {
            // Ensure we have a valid number
            const newSize = value[0] ?? 100;

            // Store the current value in ref for immediate visual feedback
            sizeValueRef.current = newSize;

            // Use requestAnimationFrame for smoother visual updates
            requestAnimationFrame(() => {
                // Only update state after a small delay to avoid excessive state updates
                if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current);
                }

                updateTimeoutRef.current = setTimeout(() => {
                    actions.updateBackground({
                        backgroundImageSize: newSize,
                    });
                    updateTimeoutRef.current = null;
                }, 50); // Shorter delay for better responsiveness
            });
        },
        [actions]
    );
    // Memoize background style using refs for smoother updates
    const backgroundStyle = useMemo(
        () => ({
            backgroundImage: `url(${state.background.backgroundImage})`,
            backgroundSize: `${sizeValueRef.current}%`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundRepeat: "no-repeat",
            opacity: opacityValueRef.current / 100,
        }),
        [state.background.backgroundImage, position.x, position.y]
    );

    // Memoize handle position style
    const handleStyle = useMemo(
        () => ({
            left: `${position.x}%`,
            top: `${position.y}%`,
        }),
        [position.x, position.y]
    );

    return (
        <div className='space-y-4'>
            {state.background.backgroundImage ? (
                <div>
                    <div
                        ref={containerRef}
                        className='relative w-full h-48 border rounded-lg overflow-hidden cursor-pointer'
                        onClick={handleImageClick}
                    >
                        <div className='w-full h-full' style={backgroundStyle} />
                        <div
                            onMouseDown={startDrag}
                            className='absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 z-10'
                            style={handleStyle}
                        />
                    </div>

                    <div className='space-y-4 mt-2 flex flex-col'>
                        <label className='text-sm'>Opacity</label>
                        <Slider
                            value={[state.background.backgroundImageOpacity ?? 100]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={handleOpacityChange}
                        />
                        <Label>Zoom</Label>
                        <Slider
                            value={[state.background.backgroundImageSize ?? 100]}
                            min={50}
                            max={200}
                            step={1}
                            onValueChange={handleSizeChange}
                        />
                        <Button variant='destructive' onClick={() => void handleRemoveImage()} disabled={isRefreshing}>
                            Remove Image
                        </Button>
                    </div>
                </div>
            ) : (
                <div className='space-y-2'>
                    <Input type='file' onChange={(e) => void handleFileSelect(e)} disabled={isUploading} />
                    {isUploading && (
                        <div className='flex items-center space-x-2'>
                            <span className='text-sm text-muted-foreground'>Uploading image...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default memo(ImageControls);
