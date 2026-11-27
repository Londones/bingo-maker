"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    useEditorActions,
    useEditorCell,
    useEditorSelectedCell,
    useEditorStamp,
    useEditorStyle,
} from "@/hooks/useEditor";

function pxToRem(px: number): string {
    return `${px / 16}rem`;
}

function getBgColorWithOpacity(color: string, opacity: number): string {
    if (color.startsWith("hsla")) {
        return color.replace(/[\d.]+\)$/g, `${opacity / 100})`);
    }
    if (color.startsWith("#")) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
    }
    return color;
}

interface EditorCellProps {
    index: number;
}

const EditorCell = memo(({ index }: EditorCellProps) => {
    const cell = useEditorCell(index);
    const style = useEditorStyle();
    const stamp = useEditorStamp();
    const selectedCellIndex = useEditorSelectedCell();
    const actions = useEditorActions();

    const isSelected = selectedCellIndex === index;
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");

    const cellRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fontSizeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastFittedFontSizeRef = useRef<number | null>(null);

    const cellStyle = cell?.cellStyle;

    const handleCellClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!cell) return;
            actions.setSelectedCell(index);

            if (isEditing) return;
            setEditContent(cell.content);
            setIsEditing(true);

            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    const len = cell.content.length;
                    inputRef.current.setSelectionRange(len, len);
                }
            });
        },
        [isEditing, cell, actions, index]
    );

    const handleBlur = useCallback(() => {
        if (!isEditing) return;
        if (cell && editContent !== cell.content) {
            actions.updateCell(index, { content: editContent });
        }
        setIsEditing(false);
    }, [isEditing, cell, editContent, actions, index]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Escape") {
                e.preventDefault();
                if (cell && editContent !== cell.content) {
                    actions.updateCell(index, { content: editContent });
                }
                setIsEditing(false);
                actions.setSelectedCell(null);
            }
        },
        [actions, cell, editContent, index]
    );

    const checkOverflow = useCallback(
        (el: HTMLTextAreaElement | HTMLDivElement) => {
            if (!el || el.scrollHeight <= el.clientHeight) return;

            const currentCellFontSize = cellStyle?.fontSize || style.fontSize;
            let fontSize = el.style.fontSize ? parseInt(el.style.fontSize, 10) : style.fontSize;
            if (fontSize !== currentCellFontSize) {
                fontSize = currentCellFontSize;
                el.style.fontSize = `${fontSize}px`;
            }

            const minFontSize = 8;
            if (fontSize <= minFontSize) {
                el.style.fontSize = `${minFontSize}px`;
                return;
            }

            let maxFontSize = fontSize;
            let minAttempt = minFontSize;
            let bestSize = fontSize;

            while (maxFontSize - minAttempt > 1 && fontSize > minFontSize) {
                fontSize = Math.floor((maxFontSize + minAttempt) / 2);
                el.style.fontSize = `${fontSize}px`;
                if (el.scrollHeight > el.clientHeight) {
                    maxFontSize = fontSize;
                } else {
                    minAttempt = fontSize;
                    bestSize = fontSize;
                }
            }

            el.style.fontSize = `${bestSize}px`;

            if (bestSize !== currentCellFontSize && lastFittedFontSizeRef.current !== bestSize) {
                if (fontSizeTimerRef.current) clearTimeout(fontSizeTimerRef.current);
                fontSizeTimerRef.current = setTimeout(() => {
                    lastFittedFontSizeRef.current = bestSize;
                    actions.updateCell(index, {
                        cellStyle: {
                            ...cellStyle,
                            fontSize: bestSize,
                        },
                    });
                }, 200);
            }
        },
        [actions, cellStyle, index, style.fontSize]
    );

    useEffect(() => {
        const el = isEditing ? inputRef.current : cellRef.current;
        if (!el) return;

        const observer = new ResizeObserver(() => {
            checkOverflow(el);
        });
        observer.observe(el);

        return () => observer.disconnect();
    }, [isEditing, checkOverflow]);

    useEffect(() => {
        return () => {
            if (fontSizeTimerRef.current) clearTimeout(fontSizeTimerRef.current);
        };
    }, []);

    const { baseStyles, backgroundStyles } = useMemo(() => {
        const base = {
            width: pxToRem(style.cellSize),
            height: pxToRem(style.cellSize),
            color: cellStyle?.color ?? style.color,
            fontSize: pxToRem(cellStyle?.fontSize ?? style.fontSize),
            fontFamily: cellStyle?.fontFamily ?? style.fontFamily,
            fontWeight: cellStyle?.fontWeight ?? style.fontWeight,
            fontStyle: cellStyle?.fontStyle ?? style.fontStyle,
            backgroundColor: getBgColorWithOpacity(
                cellStyle?.cellBackgroundColor ?? style.cellBackgroundColor,
                cellStyle?.cellBackgroundOpacity ?? style.cellBackgroundOpacity
            ),
        };

        const bg = {
            borderColor: cellStyle?.cellBorderColor ?? style.cellBorderColor,
            borderWidth: cellStyle?.cellBorderWidth ?? style.cellBorderWidth,
        };

        return { baseStyles: base, backgroundStyles: bg };
    }, [style, cellStyle]);

    const cellBackgroundImageStyle = useMemo(() => {
        if (!cellStyle?.cellBackgroundImage) return undefined;
        return {
            backgroundImage: `url(${cellStyle.cellBackgroundImage})`,
            backgroundSize: cellStyle.cellBackgroundImageSize ? `${cellStyle.cellBackgroundImageSize}%` : "100%",
            backgroundPosition: cellStyle.cellBackgroundImagePosition || "center",
            opacity: (cellStyle.cellBackgroundImageOpacity ?? 100) / 100,
            backgroundRepeat: "no-repeat",
        };
    }, [
        cellStyle?.cellBackgroundImage,
        cellStyle?.cellBackgroundImageSize,
        cellStyle?.cellBackgroundImagePosition,
        cellStyle?.cellBackgroundImageOpacity,
    ]);

    if (!cell) return null;

    return (
        <div
            ref={cellRef}
            data-index={index}
            className={`relative items-center justify-center rounded-md backdrop-blur-sm transition-all cursor-pointer bingo-cell hover:shadow-md ${
                isSelected ? "ring-2 ring-pink-500 ring-offset-1 ring-offset-background/40 z-10" : ""
            }`}
            data-testid={`cell-${index} bingo-cell`}
            style={{
                ...baseStyles,
                ...backgroundStyles,
            }}
            onClick={handleCellClick}
        >
            {isEditing ? (
                <textarea
                    ref={inputRef}
                    className='w-full bg-transparent h-fit p-1 rounded-md text-center content-center resize-none whitespace-pre-wrap break-words overflow-auto outline-none'
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={{
                        ...baseStyles,
                        backgroundColor: "transparent",
                    }}
                />
            ) : (
                <div className='p-1 w-full h-full text-center whitespace-pre-wrap content-center break-words overflow-auto relative'>
                    {cellBackgroundImageStyle && (
                        <div className='absolute inset-0 pointer-events-none' style={cellBackgroundImageStyle} />
                    )}
                    <div className='relative'>{cell.content}</div>
                </div>
            )}

            {cell.validated && (
                <motion.div
                    className='absolute inset-0 flex items-center justify-center pointer-events-none'
                    style={{
                        fontSize: pxToRem(stamp.size),
                        opacity: stamp.opacity,
                        fontStyle: "normal",
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                >
                    {stamp.type === "text" ? (
                        stamp.value
                    ) : (
                        <Image
                            src={stamp.value}
                            alt='stamp'
                            className='w-full h-full object-contain'
                            width={stamp.size}
                            height={stamp.size}
                            style={{
                                maxWidth: stamp.size,
                                maxHeight: stamp.size,
                            }}
                        />
                    )}
                </motion.div>
            )}
        </div>
    );
});

EditorCell.displayName = "EditorCell";

export default EditorCell;
