"use client";
import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { deserializeGradientConfig } from "@/lib/utils";
import { RadialGradientStop, Bingo } from "@/types/types";
import Image from "next/image";
import { motion } from "framer-motion";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "@/hooks/useWindowSize";

type BingoPreviewProps = {
    bingo: Bingo;
};

const BingoPreview = ({ bingo }: BingoPreviewProps) => {
    // State for confetti animation
    const [showConfetti, setShowConfetti] = useState(false);

    // Use our custom hook for window size
    const windowSize = useWindowSize();
    // Show confetti on first load if there's already a bingo pattern
    useEffect(() => {
        // We only want to show confetti when the component first loads
        const firstLoad = true;

        // Generate patterns
        const patterns = [
            // Horizontal
            ...Array.from({ length: bingo.gridSize }, (_, row) =>
                Array.from({ length: bingo.gridSize }, (_, col) => row * bingo.gridSize + col)
            ),
            // Vertical
            ...Array.from({ length: bingo.gridSize }, (_, col) =>
                Array.from({ length: bingo.gridSize }, (_, row) => row * bingo.gridSize + col)
            ),
            // Diagonal (top-left to bottom-right)
            Array.from({ length: bingo.gridSize }, (_, i) => i * bingo.gridSize + i),
            // Diagonal (top-right to bottom-left)
            Array.from({ length: bingo.gridSize }, (_, i) => (i + 1) * bingo.gridSize - i - 1),
        ];

        // Check if any pattern is completed on first load
        const hasBingo = patterns.some((pattern) => pattern.every((index) => bingo.cells[index]?.validated));

        // Show confetti immediately if there's a bingo on first load
        if (hasBingo && firstLoad) {
            setShowConfetti(true);
        }

        // This effect only runs once when the component mounts
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Function to convert px to rem for better responsiveness
    const pxToRem = useCallback((px: number): string => {
        // Assuming base font size of 16px (browser default)
        return `${px / 16}rem`;
    }, []);

    const getBackground = useMemo(() => {
        const { background } = bingo;
        const config = deserializeGradientConfig(background.value);
        const stopToGradient = (stop: RadialGradientStop) => {
            return `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`;
        };
        const backgroundImage = config.stops.map(stopToGradient).join(", ");
        return {
            backgroundColor: config.backgroundColor,
            backgroundImage: backgroundImage,
        };
    }, [bingo]);

    const getBackgroundImage = useMemo(() => {
        const { background } = bingo;
        return {
            backgroundImage: `url(${background.backgroundImage})`,
            backgroundSize: background.backgroundImageSize ? `${background.backgroundImageSize}%` : "cover",
            backgroundPosition: background.backgroundImagePosition || "center",
            opacity: (background?.backgroundImageOpacity ?? 100) / 100,
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "local",
        };
    }, [bingo]);

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
            const baseStyles = {
                width: pxToRem(bingo.style.cellSize),
                height: pxToRem(bingo.style.cellSize),
                color: bingo.cells[index]?.cellStyle?.color ?? bingo.style.color,
                fontSize: pxToRem(bingo.cells[index]?.cellStyle?.fontSize ?? bingo.style.fontSize),
                fontFamily: bingo.cells[index]?.cellStyle?.fontFamily ?? bingo.style.fontFamily,
                fontWeight: bingo.cells[index]?.cellStyle?.fontWeight ?? bingo.style.fontWeight,
                fontStyle: bingo.cells[index]?.cellStyle?.fontStyle ?? bingo.style.fontStyle,
                backgroundColor: getBgColorWithOpacity(
                    bingo.cells[index]?.cellStyle?.cellBackgroundColor ?? bingo.style.cellBackgroundColor,
                    bingo.cells[index]?.cellStyle?.cellBackgroundOpacity ?? bingo.style.cellBackgroundOpacity
                ),
            };

            const backgroundStyles = {
                borderColor: bingo.cells[index]?.cellStyle?.cellBorderColor ?? bingo.style.cellBorderColor,
                borderWidth: bingo.cells[index]?.cellStyle?.cellBorderWidth ?? bingo.style.cellBorderWidth,
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
            width: pxToRem(bingo.titleWidth!),
        }),
        [bingo.style.color, bingo.style.fontFamily, bingo.style.fontStyle, bingo.titleWidth, pxToRem]
    );
    return (
        <div className='flex flex-col items-center space-y-4'>
            {showConfetti && (
                <ReactConfetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={100}
                    gravity={0.3}
                    onConfettiComplete={() => {
                        setShowConfetti(false);
                    }}
                    style={{ position: "fixed", top: 0, left: 0, zIndex: 100 }}
                />
            )}
            <div
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
                        {bingo.cells.map((cell, index) => (
                            <div
                                key={cell.position}
                                className='relative items-center justify-center rounded-md backdrop-blur-sm transition-all'
                                style={{
                                    ...getCellStyles(index).baseStyles,
                                    ...getCellStyles(index).backgroundStyles,
                                }}
                            >
                                <div className='p-1 w-full h-full text-center whitespace-pre-wrap content-center break-words overflow-auto relative'>
                                    {/* Add the cell background image as an absolute positioned div */}
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
                        ))}
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
        </div>
    );
};

export default BingoPreview;
