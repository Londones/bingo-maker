"use client";
import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { deserializeGradientConfig } from "@/lib/utils";
import { RadialGradientStop, Bingo, BingoCell } from "@/types/types";
import Image from "next/image";
import { motion } from "framer-motion";
import { Download, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWindowSize } from "@/hooks/useWindowSize";
import { exportBoardToPng } from "@/lib/export-bingo";
import { toast } from "sonner";

const ReactConfetti = dynamic(() => import("react-confetti"), { ssr: false });

type BingoPreviewProps = {
    bingo: Bingo;
    canEdit?: boolean;
    onToggleCell?: (cell: BingoCell) => void;
    boardRef?: React.RefObject<HTMLDivElement>;
    hideActions?: boolean;
};

const BingoPreview = ({
    bingo,
    canEdit = false,
    onToggleCell,
    boardRef: externalBoardRef,
    hideActions = false,
}: BingoPreviewProps) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const prevCompletedCountRef = useRef<number | null>(null);
    const internalBoardRef = useRef<HTMLDivElement>(null);
    const activeBoardRef = externalBoardRef ?? internalBoardRef;

    const handleDownloadPng = useCallback(async () => {
        if (!activeBoardRef.current || isExporting) return;
        setIsExporting(true);
        try {
            await exportBoardToPng(activeBoardRef.current, bingo.title);
            toast.success("PNG downloaded");
        } catch (error) {
            console.error("Failed to export PNG:", error);
            toast.error("Failed to export PNG");
        } finally {
            setIsExporting(false);
        }
    }, [activeBoardRef, bingo.title, isExporting]);

    const windowSize = useWindowSize();

    // Detect completed bingo lines on mount and whenever cells change
    useEffect(() => {
        const patterns = [
            ...Array.from({ length: bingo.gridSize }, (_, row) =>
                Array.from({ length: bingo.gridSize }, (_, col) => row * bingo.gridSize + col)
            ),
            ...Array.from({ length: bingo.gridSize }, (_, col) =>
                Array.from({ length: bingo.gridSize }, (_, row) => row * bingo.gridSize + col)
            ),
            Array.from({ length: bingo.gridSize }, (_, i) => i * bingo.gridSize + i),
            Array.from({ length: bingo.gridSize }, (_, i) => (i + 1) * bingo.gridSize - i - 1),
        ];

        const completedCount = patterns.filter((pattern) =>
            pattern.every((index) => bingo.cells[index]?.validated)
        ).length;

        if (prevCompletedCountRef.current === null) {
            if (completedCount > 0) {
                setShowConfetti(true);
            }
        } else if (completedCount > prevCompletedCountRef.current) {
            setShowConfetti(true);
        }

        prevCompletedCountRef.current = completedCount;
    }, [bingo.cells, bingo.gridSize]);

    const pxToRem = useCallback((px: number): string => {
        return `${px / 16}rem`;
    }, []);

    const getBackground = useMemo(() => {
        const config = deserializeGradientConfig(bingo.background.value);
        const stopToGradient = (stop: RadialGradientStop) => {
            return `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`;
        };
        const backgroundImage = config.stops.map(stopToGradient).join(", ");
        return {
            backgroundColor: config.backgroundColor,
            backgroundImage: backgroundImage,
        };
    }, [bingo.background.value]);

    const getBackgroundImage = useMemo(() => {
        const background = bingo.background;
        if (!background.backgroundImage) return {};
        return {
            backgroundImage: `url(${background.backgroundImage})`,
            backgroundSize: background.backgroundImageSize ? `${background.backgroundImageSize}%` : "cover",
            backgroundPosition: background.backgroundImagePosition || "center",
            opacity: (background.backgroundImageOpacity ?? 100) / 100,
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "local",
        };
    }, [bingo.background]);

    const getBgColorWithOpacity = useCallback((color: string, opacity: number) => {
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
    }, []);

    const getCellStyles = useCallback(
        (index: number) => {
            const cellStyle = bingo.cells[index]?.cellStyle;
            const baseStyles = {
                width: pxToRem(bingo.style.cellSize),
                height: pxToRem(bingo.style.cellSize),
                color: cellStyle?.color ?? bingo.style.color,
                fontSize: pxToRem(cellStyle?.fontSize ?? bingo.style.fontSize),
                fontFamily: cellStyle?.fontFamily ?? bingo.style.fontFamily,
                fontWeight: cellStyle?.fontWeight ?? bingo.style.fontWeight,
                fontStyle: cellStyle?.fontStyle ?? bingo.style.fontStyle,
                backgroundColor: getBgColorWithOpacity(
                    cellStyle?.cellBackgroundColor ?? bingo.style.cellBackgroundColor,
                    cellStyle?.cellBackgroundOpacity ?? bingo.style.cellBackgroundOpacity
                ),
            };

            const backgroundStyles = {
                borderColor: cellStyle?.cellBorderColor ?? bingo.style.cellBorderColor,
                borderWidth: cellStyle?.cellBorderWidth ?? bingo.style.cellBorderWidth,
            };

            return { baseStyles, backgroundStyles };
        },
        [bingo.style, bingo.cells, pxToRem, getBgColorWithOpacity]
    );

    const gridStyle = useMemo(
        () => ({
            gridTemplateColumns: `repeat(${bingo.gridSize}, ${pxToRem(bingo.style.cellSize)})`,
            gap: pxToRem(bingo.style.gap),
            width: "fit-content",
        }),
        [bingo.gridSize, bingo.style.cellSize, bingo.style.gap, pxToRem]
    );

    const titleStyle = useMemo(
        () => ({
            color: bingo.style.color,
            fontFamily: bingo.style.fontFamily,
            fontStyle: bingo.style.fontStyle,
            width: bingo.titleWidth ? pxToRem(bingo.titleWidth) : undefined,
        }),
        [bingo.style.color, bingo.style.fontFamily, bingo.style.fontStyle, bingo.titleWidth, pxToRem]
    );

    return (
        <div className='flex flex-col items-center'>
            {showConfetti && (
                <div className='fixed inset-0 pointer-events-none overflow-hidden z-[100]'>
                    <ReactConfetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={100}
                        gravity={0.3}
                        onConfettiComplete={() => {
                            setShowConfetti(false);
                        }}
                    />
                </div>
            )}
            <div
                ref={activeBoardRef}
                className='mx-auto h-fit flex items-center flex-col justify-center p-8 rounded-lg shadow-lg overflow-hidden relative'
                style={getBackground}
            >
                <div className='absolute inset-0 pointer-events-none' style={getBackgroundImage} />
                <div className='relative z-10 max-w-full'>
                    <h1
                        className='text-center text-4xl font-bold'
                        style={{
                            ...titleStyle,
                        }}
                    >
                        {bingo.title}
                    </h1>
                    <div className='grid mt-8 mx-auto' style={gridStyle}>
                        {bingo.cells.map((cell, index) => {
                            if (!cell) return null;
                            const { baseStyles, backgroundStyles } = getCellStyles(index);

                            return (
                                <div
                                    key={cell.id ?? cell.position}
                                    role={canEdit ? "button" : undefined}
                                    tabIndex={canEdit ? 0 : undefined}
                                    aria-pressed={canEdit ? cell.validated : undefined}
                                    onClick={canEdit && onToggleCell ? () => onToggleCell(cell) : undefined}
                                    onKeyDown={
                                        canEdit && onToggleCell
                                            ? (e) => {
                                                  if (e.key === "Enter" || e.key === " ") {
                                                      e.preventDefault();
                                                      onToggleCell(cell);
                                                  }
                                              }
                                            : undefined
                                    }
                                    className={`relative items-center justify-center rounded-md backdrop-blur-sm ${
                                        canEdit
                                            ? "transition-all select-none cursor-pointer hover:ring-2 hover:ring-white/70 active:scale-[0.97]"
                                            : "cursor-default select-text"
                                    }`}
                                    style={{
                                        ...baseStyles,
                                        ...backgroundStyles,
                                    }}
                                >
                                    <div className='p-1 w-full h-full text-center whitespace-pre-wrap content-center break-words overflow-auto relative'>
                                        {cell.cellStyle?.cellBackgroundImage && (
                                            <div
                                                className='absolute inset-0 pointer-events-none'
                                                style={{
                                                    backgroundImage: `url(${cell.cellStyle.cellBackgroundImage})`,
                                                    backgroundSize: cell.cellStyle.cellBackgroundImageSize
                                                        ? `${cell.cellStyle.cellBackgroundImageSize}%`
                                                        : "cover",
                                                    backgroundPosition:
                                                        cell.cellStyle.cellBackgroundImagePosition || "center",
                                                    backgroundRepeat: "no-repeat",
                                                    opacity: (cell.cellStyle.cellBackgroundImageOpacity ?? 100) / 100,
                                                }}
                                            />
                                        )}
                                        <div className='relative'>{cell.content}</div>
                                    </div>
                                    {cell.validated && (
                                        <motion.div
                                            className='absolute inset-0 flex items-center justify-center pointer-events-none'
                                            style={{
                                                fontSize: pxToRem(bingo.stamp.size || 24),
                                                opacity: bingo.stamp.opacity || 0.8,
                                                fontStyle: "normal",
                                            }}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: "spring", stiffness: 420, damping: 22 }}
                                        >
                                            {bingo.stamp.type === "text" ? (
                                                bingo.stamp.value
                                            ) : (
                                                <Image
                                                    src={bingo.stamp.value}
                                                    alt='stamp'
                                                    className='w-full h-full object-contain'
                                                    width={bingo.stamp.size || 24}
                                                    height={bingo.stamp.size || 24}
                                                    style={{
                                                        maxWidth: bingo.stamp.size || 24,
                                                        maxHeight: bingo.stamp.size || 24,
                                                    }}
                                                />
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <small
                        className='absolute -right-6 -bottom-6 text-xs'
                        style={{
                            filter: "invert(1) contrast(1.5)",
                            mixBlendMode: "difference",
                            opacity: 0.5,
                        }}
                    >
                        starfire.lol
                    </small>
                </div>
            </div>
            {!hideActions && (
                <div className='flex flex-col items-center gap-2 mt-4'>
                    {canEdit && (
                        <p className='text-xs text-muted-foreground'>Click any square to stamp or unstamp it live.</p>
                    )}
                    <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={isExporting}
                        onClick={() => void handleDownloadPng()}
                        className='rounded-lg'
                    >
                        {isExporting ? (
                            <Loader className='h-4 w-4 mr-2 animate-spin' />
                        ) : (
                            <Download className='h-4 w-4 mr-2' />
                        )}
                        {isExporting ? "Exporting..." : "Download PNG"}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default BingoPreview;
