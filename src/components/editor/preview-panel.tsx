"use client";
import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { deserializeGradientConfig } from "@/lib/utils";
import { RadialGradientStop } from "@/types/types";
import Image from "next/image";
import { motion } from "framer-motion";

const PreviewPanel = () => {
    const { state, actions } = useEditor();
    const [editingCell, setEditingCell] = React.useState<number | null>(null);
    const [editContent, setEditContent] = React.useState<string>("");
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const cellRefs = React.useRef<HTMLDivElement[]>([]);
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

    const checkOverflow = React.useCallback(
        (el: HTMLTextAreaElement | HTMLDivElement, index: number) => {
            const isOverflowing = el.scrollHeight > el.clientHeight;
            if (isOverflowing) {
                let fontSize = el.style.fontSize ? parseInt(el.style.fontSize) : state.style.fontSize;

                while (el.scrollHeight > el.clientHeight) {
                    fontSize -= 1;
                    el.style.fontSize = `${fontSize}px`;
                }

                const existingCellStyle = state.cells[index]?.cellStyle;

                actions.updateCell(index, {
                    cellStyle: {
                        ...existingCellStyle,
                        fontSize: fontSize,
                    },
                });
            }
        },
        [actions, state.cells, state.style.fontSize]
    );

    const getCellStyles = (index: number) => {
        const baseStyles = {
            width: state.style.cellSize,
            height: state.style.cellSize,
            color: state.cells[index]?.cellStyle?.color ?? state.style.color,
            fontSize: state.cells[index]?.cellStyle?.fontSize ?? state.style.fontSize,
            fontFamily: state.cells[index]?.cellStyle?.fontFamily ?? state.style.fontFamily,
            fontWeight: state.cells[index]?.cellStyle?.fontWeight ?? state.style.fontWeight,
            fontStyle: state.cells[index]?.cellStyle?.fontStyle ?? state.style.fontStyle,
            backgroundColor: getBgColorWithOpacity(
                state.cells[index]?.cellStyle?.cellBackgroundColor ?? state.style.cellBackgroundColor,
                state.cells[index]?.cellStyle?.cellBackgroundOpacity ?? state.style.cellBackgroundOpacity
            ),
        };

        const backgroundStyles = {
            borderColor: state.cells[index]?.cellStyle?.cellBorderColor ?? state.style.cellBorderColor,
            borderWidth: state.style.cellBorderWidth,

            ...(state.cells[index]?.cellStyle?.cellBackgroundImage
                ? getBackgroundImageWithOpacity(
                      state.cells[index]?.cellStyle?.cellBackgroundImage,
                      state.cells[index]?.cellStyle?.cellBackgroundOpacity ?? state.style.cellBackgroundOpacity
                  )
                : {}),
        };

        return { baseStyles, backgroundStyles };
    };

    const getBgColorWithOpacity = (color: string, opacity: number) => {
        if (color.startsWith("hsla")) {
            return color.replace(/[\d.]+\)$/g, `${opacity})`);
        }

        if (color.startsWith("#")) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    };

    const getBackgroundImageWithOpacity = (imageUrl: string | undefined, opacity: number) => {
        if (!imageUrl) return undefined;
        return {
            backgroundImage: `linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${
                1 - opacity
            })), url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
        };
    };

    React.useEffect(() => {
        let cellObserver: ResizeObserver | null = null;
        if (cellRefs.current.length > 0) {
            cellObserver = new ResizeObserver((entries) => {
                entries.forEach((entry) => {
                    const index = parseInt((entry.target as HTMLElement).dataset.index!, 10);
                    checkOverflow(entry.target as HTMLDivElement, index);
                });
            });

            cellRefs.current.forEach((cell) => {
                cellObserver?.observe(cell);
            });
        }

        let inputObserver: ResizeObserver | null = null;
        if (editingCell !== null && inputRef.current) {
            inputObserver = new ResizeObserver(() => {
                if (inputRef.current && editingCell !== null) {
                    checkOverflow(inputRef.current, editingCell);
                }
            });
            inputObserver.observe(inputRef.current);
        }

        return () => {
            cellObserver?.disconnect();
            inputObserver?.disconnect();
        };
    }, [state.cells, checkOverflow, editingCell]);

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
                        <motion.div
                            key={index}
                            className='relative items-center justify-center rounded-md backdrop-blur-sm transition-all cursor-pointer hover:shadow-md'
                            style={{
                                ...getCellStyles(index).baseStyles,
                                ...getCellStyles(index).backgroundStyles,
                            }}
                            onClick={() => handleCellClick(index)}
                        >
                            {editingCell === index ? (
                                <textarea
                                    ref={inputRef}
                                    className='w-full h-fit p-1 rounded-md text-center content-center resize-none whitespace-pre-wrap break-words overflow-auto'
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onBlur={handleBlur}
                                    style={{
                                        ...getCellStyles(index).baseStyles,
                                    }}
                                />
                            ) : (
                                <div className='p-1 w-full h-full text-center whitespace-pre-wrap content-center break-words overflow-auto'>
                                    {cell.content}
                                </div>
                            )}

                            {cell.validated && (
                                <motion.div
                                    className='absolute inset-0 flex items-center justify-center pointer-events-none'
                                    style={{
                                        fontSize: state.stamp.size,
                                        opacity: state.stamp.opacity,
                                        fontStyle: "normal",
                                    }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
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
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PreviewPanel;
