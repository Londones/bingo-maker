"use client";
import React from "react";
import { deserializeGradientConfig } from "@/lib/utils";
import { RadialGradientStop, Bingo, BingoCell } from "@/types/types";
import Image from "next/image";
import { motion } from "framer-motion";

type BingoPreviewProps = {
    bingo: Bingo;
};

const BingoPreview = ({ bingo }: BingoPreviewProps) => {
    const getBackground = () => {
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
    };

    const getBackgroundImage = () => {
        const { background } = bingo;
        return {
            backgroundImage: `url(${background.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: background.backgroundImagePosition || "center",
            opacity: (background?.backgroundImageOpacity ?? 100) / 100,
        };
    };

    const orderCells = () => {
        const orderedCells: BingoCell[] = Array(bingo.gridSize ** 2).fill(null);
        bingo.cells.forEach((cell) => {
            orderedCells[cell.position] = cell;
        });
        return orderedCells;
    };

    const getCellStyles = (index: number) => {
        const baseStyles = {
            width: bingo.style.cellSize,
            height: bingo.style.cellSize,
            color: bingo.cells[index]?.cellStyle?.color ?? bingo.style.color,
            fontSize: bingo.cells[index]?.cellStyle?.fontSize ?? bingo.style.fontSize,
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

            ...(bingo.cells[index]?.cellStyle?.cellBackgroundImage
                ? getBackgroundImageWithOpacity(
                      bingo.cells[index]?.cellStyle?.cellBackgroundImage,
                      bingo.cells[index]?.cellStyle?.cellBackgroundImageOpacity ?? bingo.style.cellBackgroundOpacity
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

    return (
        <div className='flex flex-col items-center space-y-4'>
            <div
                className=' mx-auto h-full flex items-center flex-col justify-center p-8 rounded-lg  shadow-lg'
                style={getBackground()}
            >
                <div className='relative w-full h-full' style={getBackgroundImage()}>
                    <h1
                        className='text-center text-4xl font-bold'
                        style={{
                            color: bingo.style.color,
                            fontFamily: bingo.style.fontFamily,
                            fontStyle: bingo.style.fontStyle,
                        }}
                    >
                        {bingo.title}
                    </h1>
                    <div
                        className='grid mt-8 mx-auto'
                        style={{
                            gridTemplateColumns: `repeat(${bingo.gridSize}, ${bingo.style.cellSize}px)`,
                            gap: bingo.style.gap,
                            width: "fit-content",
                        }}
                    >
                        {orderCells().map((cell) => (
                            <div
                                key={cell.position}
                                className='relative items-center justify-center rounded-md backdrop-blur-sm transition-all'
                                style={{
                                    ...getCellStyles(cell.position).baseStyles,
                                    ...getCellStyles(cell.position).backgroundStyles,
                                }}
                            >
                                <div className='p-1 w-full h-full text-center whitespace-pre-wrap content-center break-words overflow-auto'>
                                    {cell.content}
                                </div>
                                {cell.validated && (
                                    <motion.div
                                        className='absolute inset-0 flex items-center justify-center pointer-events-none'
                                        style={{
                                            fontSize: bingo.stamp.size,
                                            opacity: bingo.stamp.opacity,
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
                                                width={bingo.stamp.size}
                                                height={bingo.stamp.size}
                                                style={{
                                                    maxWidth: bingo.stamp.size,
                                                    maxHeight: bingo.stamp.size,
                                                }}
                                            />
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BingoPreview;
