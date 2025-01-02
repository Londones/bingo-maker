"use client";
import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { deserializeGradientConfig } from "@/lib/utils";
import { RadialGradientStop } from "@/types/types";
import Image from "next/image";

const PreviewPanel = () => {
    const { state, actions } = useEditor();
    const [editingCell, setEditingCell] = React.useState<number | null>(null);
    const [editContent, setEditContent] = React.useState<string>("");
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const [editingTitle, setEditingTitle] = React.useState(false);

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

    const handleCellClick = (index: number) => {
        setEditingCell(index);
        setEditContent(state.cells[index]!.content);
    };

    const handleBlur = () => {
        if (editingCell !== null) {
            actions.updateCell(editingCell, { content: editContent });
            setEditingCell(null);
        }
    };

    const checkOverflow = (el: HTMLTextAreaElement, index: number) => {
        const isOverflowing = el.scrollHeight > el.clientHeight;
        if (isOverflowing) {
            let fontSize = state.style.fontSize;

            while (el.scrollHeight > el.clientHeight) {
                fontSize -= 1;
                el.style.fontSize = `${fontSize}px`;
            }

            actions.updateStyle({
                ...state.style,
                cellStyle: {
                    ...state.style.cellStyle,
                    ...state.style.cellStyle,
                    [index]: {
                        ...(state.style.cellStyle?.[index] || { fontSize: state.style.fontSize }),
                        fontSize: fontSize,
                    },
                },
            });
        }
    };

    return (
        <div className='flex flex-col h-full items-center space-y-4'>
            <div
                className='w-full mx-auto h-full flex items-center flex-col justify-center p-8 rounded-lg'
                style={gradientStyle}
            >
                {editingTitle ? (
                    <input
                        type='text'
                        className='text-center text-4xl bg-transparent font-bold rounded-lg'
                        value={state.title}
                        style={{
                            color: state.style.color,
                            fontFamily: state.style.fontFamily,
                        }}
                        onChange={(e) => actions.setTitle(e.target.value)}
                        onBlur={() => setEditingTitle(false)}
                    />
                ) : (
                    <h1
                        className='text-center text-4xl font-bold '
                        style={{
                            fontFamily: state.style.fontFamily,
                            color: state.style.color,
                        }}
                        onClick={() => setEditingTitle(true)}
                    >
                        {state.title}
                    </h1>
                )}
                <div
                    className='grid mt-8 mx-auto'
                    style={{
                        gridTemplateColumns: `repeat(${state.gridSize}, ${state.style.cellSize}px)`,
                        gap: state.style.gap,
                        width: "fit-content",
                    }}
                >
                    {state.cells.map((cell, index) => (
                        <div
                            key={index}
                            className='relative items-center justify-center rounded-md border bg-white backdrop-blur-sm transition-all cursor-pointer hover:shadow-md'
                            style={{
                                width: state.style.cellSize,
                                height: state.style.cellSize,
                                color: state.style.color,
                                fontSize: state.style.fontSize,
                                fontFamily: state.style.fontFamily,
                            }}
                            onClick={() => handleCellClick(index)}
                        >
                            {editingCell === index ? (
                                <textarea
                                    ref={inputRef}
                                    className='w-full h-fit p-1 bg-white rounded-md text-center resize-none whitespace-pre-wrap break-words overflow-auto'
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onBlur={handleBlur}
                                    style={{
                                        fontSize: state.style.fontSize,
                                        fontFamily: state.style.fontFamily,
                                    }}
                                />
                            ) : (
                                <div className='p-2 w-full h-full text-center whitespace-pre-wrap break-words overflow-auto'>
                                    {cell.content}
                                </div>
                            )}

                            {cell.validated && (
                                <div
                                    className='absolute inset-0 flex items-center justify-center pointer-events-none'
                                    style={{
                                        fontSize: state.stamp.size,
                                        opacity: state.stamp.opacity,
                                    }}
                                >
                                    {state.stamp.type === "text" ? (
                                        state.stamp.value
                                    ) : (
                                        <Image
                                            src={state.stamp.value}
                                            alt='stamp'
                                            className='w-full h-full object-contain'
                                            style={{
                                                maxWidth: state.stamp.size,
                                                maxHeight: state.stamp.size,
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PreviewPanel;
