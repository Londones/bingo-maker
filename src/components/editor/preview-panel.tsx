"use client";
import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { deserializeGradientConfig } from "@/lib/utils";
import { RadialGradientStop } from "@/types/types";

const PreviewPanel = () => {
    const { state } = useEditor();

    const getBackground = () => {
        const { background } = state;
        if (background.type === "gradient") {
            const config = deserializeGradientConfig(background.value);
            const stopToGradient = (stop: RadialGradientStop) => {
                return `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`;
            };
            const backgroundImage = config.stops.map(stopToGradient).join(", ");
            return {
                backgroundColor: config.backgroundColor,
                backgroundImage: backgroundImage,
            };
        } else {
            return {
                backgroundImage: `url(${background.value})`,
            };
        }
    };

    const gradientStyle = getBackground();

    return (
        <div className='flex flex-col h-full items-center space-y-4'>
            <div className='w-full max-w-3xl mx-auto p-8 rounded-lg' style={gradientStyle}>
                <h1
                    className='text-center text-4xl font-bold text-white'
                    style={{
                        fontFamily: state.style.fontFamily,
                        color: state.style.color,
                    }}
                >
                    {state.title}
                </h1>
            </div>
        </div>
    );
};

export default PreviewPanel;
