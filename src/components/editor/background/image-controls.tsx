import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEditor } from "@/hooks/useEditor";
import { UploadButton } from "@/utils/uploadthing";
import { motion, PanInfo, useDragControls } from "framer-motion";
import { useState, useRef } from "react";
import { toast } from "sonner";

const ImageControls = () => {
    const { state, actions } = useEditor();
    const containerRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();
    const [position, setPosition] = useState({ x: 50, y: 50 }); // Default center

    const handleDragEnd = (event: MouseEvent, info: PanInfo) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, (info.point.x / rect.width) * 100));
        const y = Math.max(0, Math.min(100, (info.point.y / rect.height) * 100));

        setPosition({ x, y });
        actions.updateBackground({
            ...state.background,
            backgroundImagePosition: `${x}% ${y}%`,
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
                    <div ref={containerRef} className='relative w-full h-28 border rounded-lg overflow-hidden'>
                        <div
                            className='w-full h-full'
                            style={{
                                backgroundImage: `url(${state.background.backgroundImage})`,
                                backgroundSize: "cover",
                                backgroundPosition: `${position.x}% ${position.y}%`,
                                opacity: state.background.backgroundImageOpacity || 1,
                            }}
                        />
                        <motion.div
                            drag
                            dragConstraints={containerRef}
                            dragControls={dragControls}
                            dragMomentum={false}
                            onDragEnd={handleDragEnd}
                            className='absolute w-4 h-4 bg-primary rounded-full cursor-move'
                            style={{
                                left: `calc(${position.x}% - 8px)`,
                                top: `calc(${position.y}% - 8px)`,
                            }}
                        />
                    </div>

                    <div className='space-y-2'>
                        <label className='text-sm'>Opacity</label>
                        <Slider
                            defaultValue={[state.background.backgroundImageOpacity ?? 100]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) => {
                                actions.updateBackground({
                                    ...state.background,
                                    backgroundImageOpacity: value[0],
                                });
                            }}
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
