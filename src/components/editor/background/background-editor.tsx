"use client";
import React, { useState, useRef } from "react";
import { useEditor } from "@/hooks/useEditor";
import { RadialGradientStop } from "@/types/types";
import DraggableStop from "@/components/ui/draggable-stop";
import ColorPickerPopover from "@/components/ui/color-picker-popover";
import { deserializeGradientConfig } from "@/lib/utils";

// type BackgroundEditorProps = {
//     backgroundColor: string;
//     stops: RadialGradientStop[];
// };

const BackgroundEditor = () => {
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
        console.log("Raw coordinates:", { x, y });
        console.log("Container bounds:", rect);
        console.log("Relative coordinates:", {
            x: x - rect.left,
            y: y - rect.top,
        });

        // Clamp values between container bounds
        const relativeX = x - rect.left;
        const relativeY = y - rect.top;

        const percentageX = (relativeX / rect.width) * 100;
        const percentageY = (relativeY / rect.height) * 100;

        console.log("Percentage position:", {
            x: percentageX,
            y: percentageY,
        });

        const newStops = [...stops];
        newStops[index] = {
            ...stops[index],
            color: stops[index]?.color || "hsla(0, 0%, 100%, 1)",
            position: {
                x: Math.max(0, Math.min(100, percentageX)),
                y: Math.max(0, Math.min(100, percentageY)),
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

    return (
        <div className='relative w-full h-28 border rounded-lg overflow-hidden'>
            <div
                className='w-full h-full'
                ref={containerRef}
                style={{
                    backgroundColor,
                    backgroundImage: stops
                        .map(
                            (stop) =>
                                `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`
                        )
                        .join(", "),
                }}
                onDoubleClick={() => {
                    setEditingBackground(true);
                    setShowColorPicker(true);
                }}
            >
                {stops.map((stop, index) => (
                    <DraggableStop
                        key={index}
                        stop={stop}
                        index={index}
                        onDragEnd={handleDragEnd}
                        onDoubleClick={(index) => {
                            setSelectedStop(index);
                            setEditingBackground(false);
                            setShowColorPicker(true);
                        }}
                    />
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

export default BackgroundEditor;
