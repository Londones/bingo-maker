import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEditor } from "@/hooks/useEditor";
import { UploadButton } from "@/utils/uploadthing";
import { motion, PanInfo, useDragControls } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

const ImageControls = () => {
    const { state, actions } = useEditor();
    const containerRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

    const [position, setPosition] = useState(() => {
        const posStr = state.background.backgroundImagePosition || "50% 50%";
        const [x, y] = posStr.split(" ").map((val) => parseInt(val));
        return {
            x: isNaN(x) ? 50 : x,
            y: isNaN(y) ? 50 : y,
        };
    });

    useEffect(() => {
        if (state.background.backgroundImagePosition) {
            const posStr = state.background.backgroundImagePosition;
            const [xStr, yStr] = posStr.split(" ");
            const x = parseInt(xStr);
            const y = parseInt(yStr);

            if (!isNaN(x) && !isNaN(y)) {
                setPosition({ x, y });
            }
        }
    }, [state.background.backgroundImagePosition]);

    const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((info.point.x - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((info.point.y - rect.top) / rect.height) * 100));

        setPosition({ x, y });
    };

    const handleDragEnd = () => {
        actions.updateBackground({
            backgroundImagePosition: `${position.x}% ${position.y}%`,
        });
    };

    const errorToast = (message: string) => {
        toast.error(message, {
            duration: 3000,
        });
    };

    const handleRemoveImage = () => {
        if (state.background.backgroundImage) {
            void (async () => {
                try {
                    const fileKey = state.background.backgroundImage?.split("/").pop();
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
                        } else {
                            actions.updateBackground({
                                ...state.background,
                                backgroundImage: undefined,
                                backgroundImageOpacity: undefined,
                                backgroundImagePosition: undefined,
                            });
                        }
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
        <div className='space-y-4'>
            {state.background.backgroundImage ? (
                <div>
                    <div
                        ref={containerRef}
                        className='relative w-full h-28 border rounded-lg overflow-hidden cursor-pointer'
                        onClick={(e) => {
                            if (!containerRef.current) return;
                            const rect = containerRef.current.getBoundingClientRect();
                            const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                            const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

                            setPosition({ x, y });
                            actions.updateBackground({
                                backgroundImagePosition: `${x}% ${y}%`,
                            });
                        }}
                    >
                        <div
                            className='w-full h-full'
                            style={{
                                backgroundImage: `url(${state.background.backgroundImage})`,
                                backgroundSize: "cover",
                                backgroundPosition: `${position.x}% ${position.y}%`,
                                opacity: (state.background.backgroundImageOpacity || 100) / 100,
                            }}
                        />
                        <motion.div
                            drag
                            dragConstraints={containerRef}
                            dragControls={dragControls}
                            dragMomentum={false}
                            onDrag={handleDrag}
                            onDragEnd={handleDragEnd}
                            className='absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 z-10'
                            style={{
                                left: `${position.x}%`,
                                top: `${position.y}%`,
                                touchAction: "none",
                            }}
                        />
                    </div>

                    <div className='space-y-2 mt-2'>
                        <label className='text-sm'>Opacity</label>
                        <Slider
                            value={[state.background.backgroundImageOpacity ?? 100]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) => {
                                actions.updateBackground({
                                    backgroundImageOpacity: value[0],
                                });
                            }}
                        />

                        <Button variant='destructive' onClick={handleRemoveImage}>
                            Remove Image
                        </Button>
                    </div>
                </div>
            ) : (
                <UploadButton
                    className='pt-2 ut-button:bg-black ut-button:text-white ut-button:ut-readying:bg-black/50 ut-button:ut-readying:text-white'
                    endpoint='backgroundUploader'
                    onClientUploadComplete={(res) => {
                        actions.updateBackground({
                            ...state.background,
                            backgroundImage: res[0]?.url,
                            backgroundImageOpacity: 100,
                        });
                    }}
                    onUploadError={(err) => {
                        errorToast(err.message);
                    }}
                />
            )}
        </div>
    );
};

export default ImageControls;
