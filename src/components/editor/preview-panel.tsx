"use client";
import React, { useCallback, useMemo } from "react";
import { useEditor } from "@/hooks/useEditor";
import { deserializeGradientConfig } from "@/lib/utils";
import { BingoCell, RadialGradientStop } from "@/types/types";
import Image from "next/image";
import { motion } from "framer-motion";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent } from "@/components/ui/context-menu";
import CellContextMenu from "@/components/editor/cell/cell-context-menu";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useBingoPatterns } from "@/hooks/useBingoPatterns";
import ReactConfetti from "react-confetti";

type PreviewPanelProps = {
    ref: React.RefObject<HTMLDivElement>;
};

const PreviewPanel = React.memo(({ ref }: PreviewPanelProps) => {
    const { state, actions, canSave } = useEditor();
    const [editingCell, setEditingCell] = React.useState<number | null>(null);
    const [editContent, setEditContent] = React.useState<string>("");
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const cellRefs = React.useRef<HTMLDivElement[]>([]);
    const [editingTitle, setEditingTitle] = React.useState(false);
    const titleRef = React.useRef<HTMLTextAreaElement>(null);
    const [rows, setRows] = React.useState(1);
    const [prevFontSizes, setPrevFontSizes] = React.useState<Record<number, number>>({});
    const fontSizeDebounceTimerRef = React.useRef<Record<number, NodeJS.Timeout>>({});
    const titleDebounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const [localTitle, setLocalTitle] = React.useState(state.title);
    const windowSize = useWindowSize();
    const [showConfetti, setShowConfetti] = React.useState(false);

    const { bingoPatterns } = useBingoPatterns(state.cells, state.gridSize, () => setShowConfetti(true));

    React.useEffect(() => {
        setLocalTitle(state.title);
    }, [state.title]);

    React.useEffect(() => {
        setShowConfetti(false);
    }, [state.id]);

    // Optimize the getBackground function with specific dependencies
    const getBackground = useMemo(() => {
        const { value } = state.background;
        const config = deserializeGradientConfig(value);
        const stopToGradient = (stop: RadialGradientStop) => {
            return `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`;
        };
        const backgroundImage = config.stops.map(stopToGradient).join(", ");
        return {
            backgroundColor: config.backgroundColor,
            backgroundImage: backgroundImage,
        };
    }, [state.background]);

    const getBackgroundImage = useMemo(() => {
        const { backgroundImage, backgroundImageSize, backgroundImagePosition, backgroundImageOpacity } =
            state.background;

        return backgroundImage
            ? {
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: `${backgroundImageSize}%` || "100%",
                  backgroundPosition: backgroundImagePosition || "center",
                  opacity: (backgroundImageOpacity ?? 100) / 100,
                  backgroundRepeat: "no-repeat",
                  backgroundAttachment: "local",
              }
            : {};
    }, [state.background]);

    const getBackgroundCellImage = useCallback(
        (index: number) => {
            const {
                cellBackgroundImage,
                cellBackgroundImageOpacity,
                cellBackgroundImagePosition,
                cellBackgroundImageSize,
            } = state.cells[index]?.cellStyle || {};

            if (!cellBackgroundImage) return {};

            return {
                backgroundImage: `url(${cellBackgroundImage})`,
                backgroundSize: `${cellBackgroundImageSize}%` || "100%",
                backgroundPosition: cellBackgroundImagePosition || "center",
                opacity: (cellBackgroundImageOpacity ?? 100) / 100,
                backgroundRepeat: "no-repeat",
            };
        },
        [state.cells]
    );

    const handleCellClick = useCallback(
        (index: number) => {
            if (editingCell === index) {
                return;
            }
            setEditingCell(index);
            setEditContent(state.cells[index]!.content);

            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    // Set cursor position to the end of the text
                    const textLength = state.cells[index]!.content.length;
                    inputRef.current.setSelectionRange(textLength, textLength);
                }
            }, 0);
        },
        [state.cells, editingCell]
    );

    const handleBlur = useCallback(() => {
        if (editingCell !== null) {
            actions.updateCell(editingCell, { content: editContent });
            setEditingCell(null);
        }
    }, [editingCell, editContent, actions]);

    const updateCellFontSize = useCallback(
        (index: number, fontSize: number) => {
            if (prevFontSizes[index] === fontSize) {
                return;
            }

            if (fontSizeDebounceTimerRef.current[index]) {
                clearTimeout(fontSizeDebounceTimerRef.current[index]);
            }

            fontSizeDebounceTimerRef.current[index] = setTimeout(() => {
                setPrevFontSizes((prev) => ({ ...prev, [index]: fontSize }));
                actions.updateCell(index, {
                    cellStyle: {
                        ...state.cells[index]?.cellStyle,
                        fontSize,
                    },
                });
            }, 200); // 200ms debounce
        },
        [actions, state.cells, prevFontSizes]
    );

    const checkOverflow = useCallback(
        (el: HTMLTextAreaElement | HTMLDivElement, index: number) => {
            if (!el) return;

            const isOverflowing = el.scrollHeight > el.clientHeight;
            if (isOverflowing) {
                let fontSize = el.style.fontSize ? parseInt(el.style.fontSize) : state.style.fontSize;
                const currentCellFontSize = state.cells[index]?.cellStyle?.fontSize || state.style.fontSize;

                // Use current font size as starting point to avoid unnecessary iterations
                if (fontSize !== currentCellFontSize) {
                    fontSize = currentCellFontSize;
                    el.style.fontSize = `${fontSize}px`;
                }

                // Set a minimum font size to avoid infinite loop
                const minFontSize = 8;

                // Stop if we're already at minimum font size
                if (fontSize <= minFontSize) {
                    el.style.fontSize = `${minFontSize}px`;
                    return;
                }

                // Use a binary search approach for finding optimal font size
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
                        bestSize = fontSize; // This is a valid size
                    }
                }

                // Use the last working font size
                fontSize = bestSize;
                el.style.fontSize = `${fontSize}px`;

                // Only update if the font size is different
                if (fontSize !== currentCellFontSize) {
                    updateCellFontSize(index, fontSize);
                }
            }
        },
        [updateCellFontSize, state.style.fontSize, state.cells]
    );

    // Function to convert px to rem
    const pxToRem = useCallback((px: number): string => {
        // Assuming base font size of 16px (browser default)
        return `${px / 16}rem`;
    }, []);

    const getBgColorWithOpacity = useMemo(
        () => (color: string, opacity: number) => {
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
        },
        []
    );

    const getCellStyles = useCallback(
        (index: number) => {
            const baseStyles = {
                width: pxToRem(state.style.cellSize),
                height: pxToRem(state.style.cellSize),
                color: state.cells[index]?.cellStyle?.color ?? state.style.color,
                fontSize: pxToRem(state.cells[index]?.cellStyle?.fontSize ?? state.style.fontSize),
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
                borderWidth: state.cells[index]?.cellStyle?.cellBorderWidth ?? state.style.cellBorderWidth,
            };

            return { baseStyles, backgroundStyles };
        },
        [state.style, state.cells, pxToRem, getBgColorWithOpacity]
    );

    const calculateRows = useCallback(() => {
        if (titleRef.current) {
            const textarea = titleRef.current;
            const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
            const paddingTop = parseInt(getComputedStyle(textarea).paddingTop);
            const paddingBottom = parseInt(getComputedStyle(textarea).paddingBottom);

            textarea.style.height = "auto";
            const scrollHeight = textarea.scrollHeight - paddingTop - paddingBottom;
            const newRows = Math.max(1, Math.ceil(scrollHeight / lineHeight));

            setRows(newRows);
            textarea.style.height = `${scrollHeight}px`;
        }
    }, []);

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newTitle = e.target.value;
            setLocalTitle(newTitle);

            // Debounce the title change action
            if (titleDebounceTimerRef.current) {
                clearTimeout(titleDebounceTimerRef.current);
            }

            titleDebounceTimerRef.current = setTimeout(() => {
                actions.setTitle(newTitle);
            }, 300); // 300ms debounce
        },
        [actions]
    );

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
                if (cell) cellObserver?.observe(cell);
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

        window.onbeforeunload = (e: BeforeUnloadEvent) => {
            if (canSave) {
                e.preventDefault();
                // display a confirmation dialog
                // alert("You have unsaved changes. Are you sure you want to leave?");
            }
        };

        calculateRows();
        window.addEventListener("resize", calculateRows);
        return () => {
            cellObserver?.disconnect();
            inputObserver?.disconnect();
            window.removeEventListener("resize", calculateRows);
            window.onbeforeunload = null;
        };
    }, [state.cells, checkOverflow, editingCell, state.id, calculateRows, canSave]);

    const gridStyle = useMemo(
        () => ({
            gridTemplateColumns: `repeat(${state.gridSize}, ${pxToRem(state.style.cellSize)})`,
            gap: pxToRem(state.style.gap),
            width: "fit-content",
        }),
        [state.gridSize, state.style.cellSize, state.style.gap, pxToRem]
    );

    const titleStyle = useMemo(
        () => ({
            fontFamily: state.style.fontFamily,
            color: state.style.color,
            fontStyle: state.style.fontStyle,
        }),
        [state.style.fontFamily, state.style.color, state.style.fontStyle]
    );

    // Optimize the cell rendering using memo
    const renderCell = useCallback(
        (cell: BingoCell, index: number) => {
            const cellStyles = getCellStyles(index);
            return (
                <ContextMenu key={index}>
                    <ContextMenuTrigger>
                        <div
                            ref={(el) => {
                                if (el) cellRefs.current[index] = el;
                            }}
                            data-index={index}
                            className='relative items-center justify-center rounded-md backdrop-blur-sm transition-all cursor-pointer bingo-cell hover:shadow-md'
                            data-testid={`cell-${index} bingo-cell`}
                            style={{
                                ...cellStyles.baseStyles,
                                ...cellStyles.backgroundStyles,
                            }}
                            onClick={() => handleCellClick(index)}
                        >
                            {editingCell === index ? (
                                <textarea
                                    ref={inputRef}
                                    className='w-full bg-transparent h-fit p-1 rounded-md text-center content-center resize-none whitespace-pre-wrap break-words overflow-auto'
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onBlur={handleBlur}
                                    autoFocus
                                    style={{
                                        ...cellStyles.baseStyles,
                                        backgroundColor: "transparent",
                                    }}
                                />
                            ) : (
                                <div className='p-1 w-full h-full text-center whitespace-pre-wrap content-center break-words overflow-auto relative'>
                                    <div
                                        className='absolute inset-0 pointer-events-none'
                                        style={getBackgroundCellImage(index)}
                                    />
                                    <div className='relative'>{cell.content}</div>
                                </div>
                            )}

                            {cell.validated && (
                                <motion.div
                                    className='absolute inset-0 flex items-center justify-center pointer-events-none'
                                    style={{
                                        fontSize: pxToRem(state.stamp.size),
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
                                            width={state.stamp.size}
                                            height={state.stamp.size}
                                            style={{
                                                maxWidth: state.stamp.size,
                                                maxHeight: state.stamp.size,
                                            }}
                                        />
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className='bg-background/90 backdrop-blur-md overflow-visible'>
                        <CellContextMenu index={index} />
                    </ContextMenuContent>
                </ContextMenu>
            );
        },
        [
            editingCell,
            editContent,
            getCellStyles,
            getBackgroundCellImage,
            handleBlur,
            handleCellClick,
            pxToRem,
            state.stamp,
        ]
    );

    React.useEffect(() => {
        const currentTimers = fontSizeDebounceTimerRef.current;
        return () => {
            Object.values(currentTimers).forEach((timer) => clearTimeout(timer));
        };
    }, []);
    return (
        <div ref={ref} className='flex flex-col items-center overflow-visible justify-center h-full w-full'>
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
                className='h-fit flex flex-col p-8 rounded-lg overflow-hidden relative custom-scrollbar'
                style={getBackground}
            >
                <div className='absolute inset-0 pointer-events-none' style={getBackgroundImage} />
                <div className='relative z-10 max-w-full'>
                    {" "}
                    {editingTitle ? (
                        <textarea
                            ref={titleRef}
                            className='text-center w-full z-10 resize-none overflow-hidden text-4xl text-wrap bg-transparent font-bold rounded-lg'
                            value={localTitle}
                            style={{
                                ...titleStyle,
                                width: pxToRem(state.titleWidth!),
                            }}
                            onChange={handleTitleChange}
                            onFocus={calculateRows}
                            onBlur={() => setEditingTitle(false)}
                            rows={rows}
                        />
                    ) : (
                        <h1
                            id='bingo-title'
                            className='text-center z-10 text-4xl font-bold'
                            style={{
                                ...titleStyle,
                                width: pxToRem(state.titleWidth!),
                            }}
                            onClick={() => setEditingTitle(true)}
                        >
                            {localTitle}
                        </h1>
                    )}
                    <div className='grid mt-8' style={gridStyle}>
                        {state.cells.map((cell, index) => renderCell(cell, index))}
                    </div>
                    <small
                        className='absolute -right-6 -bottom-6 text-xs'
                        style={{
                            filter: "invert(1) contrast(1.5)",
                            mixBlendMode: "difference",
                            opacity: 0.85,
                        }}
                    >
                        starfire.lol
                    </small>
                </div>
            </div>
        </div>
    );
});

PreviewPanel.displayName = "PreviewPanel";

export default PreviewPanel;
