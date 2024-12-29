"use client";
import React, { useState, useRef } from "react";
import { useEditor } from "@/hooks/useEditor";
import { RadialGradientStop } from "@/types/types";
import DraggableStop from "@/components/ui/draggable-stop";
import ColorPickerPopover from "@/components/ui/color-picker-popover";
import { deserializeGradientConfig } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const GradientEditor = () => {
    const { state, actions } = useEditor();
    const [selectedStop, setSelectedStop] = useState<number | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [editingBackground, setEditingBackground] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { backgroundColor, stops } = deserializeGradientConfig(state.background.value);

    const updateGradient = (newBackground: string, newStops: RadialGradientStop[]) => {
        actions.updateBackground({
            type: "gradient",
            value: JSON.stringify({
                backgroundColor: newBackground,
                stops: newStops,
            }),
        });
    };

    const handleDragEnd = (index: number, x: number, y: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();

        const relativeX = Math.max(0, Math.min(x - rect.left, rect.width));
        const relativeY = Math.max(0, Math.min(y - rect.top - rect.bottom - rect.height, rect.height));

        // Convert to percentages
        const percentageX = Math.round((relativeX / rect.width) * 100);
        const percentageY = Math.round((relativeY / rect.height) * 100);

        const newStops = [...stops];
        newStops[index] = {
            ...stops[index],
            color: stops[index]?.color || "hsla(0, 0%, 100%, 1)",
            position: {
                x: percentageX,
                y: percentageY,
            },
        };
        updateGradient(backgroundColor, newStops);
    };

    const handleColorChange = (color: string) => {
        if (editingBackground) {
            updateGradient(color, stops);
        } else if (selectedStop !== null) {
            const newStops = [...stops];
            newStops[selectedStop] = {
                ...newStops[selectedStop],
                color,
                position: newStops[selectedStop]?.position || { x: 0, y: 0 },
            };
            updateGradient(backgroundColor, newStops);
        }
    };

    const handleClickBackground = (x: number, y: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();

        // Calculate relative position
        const relativeX = x - rect.left;
        const relativeY = y - rect.top;

        // Convert to percentages and round to nearest integer
        const percentageX = Math.round((relativeX / rect.width) * 100);
        const percentageY = Math.round((relativeY / rect.height) * 100);

        const newStops = [...stops, { color: "hsla(0, 0%, 100%, 1)", position: { x: percentageX, y: percentageY } }];
        updateGradient(backgroundColor, newStops);
    };

    return (
        <div>
            <div ref={containerRef} className='relative w-full h-28 border rounded-lg'>
                <div
                    className='w-full h-full rounded-lg'
                    style={{
                        backgroundColor,
                        backgroundImage: stops
                            .map(
                                (stop) =>
                                    `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`
                            )
                            .join(", "),
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setEditingBackground(true);
                        setShowColorPicker(true);
                    }}
                    onClick={(e) => handleClickBackground(e.clientX, e.clientY)}
                >
                    {stops.map((stop, index) => (
                        <DraggableStop
                            key={index}
                            stop={stop}
                            index={index}
                            onDragEnd={handleDragEnd}
                            containerRef={containerRef}
                        />
                    ))}
                </div>
            </div>
            <div className='grid grid-cols-2 gap-2 mt-4 overflow-y-auto rounded-md justify-center items-center border border-gray-100/10 small-scrollbar h-20'>
                {stops.map((stop, index) => (
                    <div key={index} className='flex items-center justify-center gap-2'>
                        <div
                            className='w-6 h-6 rounded-full'
                            onClick={() => {
                                setSelectedStop(index);
                                setEditingBackground(false);
                                setShowColorPicker(true);
                            }}
                            style={{ backgroundColor: stop.color }}
                        />
                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => {
                                const newStops = [...stops];
                                newStops.splice(index, 1);
                                updateGradient(backgroundColor, newStops);
                            }}
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                ))}
            </div>
            {showColorPicker && (
                <ColorPickerPopover
                    color={editingBackground ? backgroundColor : stops[selectedStop!]?.color || "hsla(0, 0%, 100%, 1)"}
                    onChange={handleColorChange}
                    onClose={() => setShowColorPicker(false)}
                />
            )}
        </div>
    );
};

export default GradientEditor;
