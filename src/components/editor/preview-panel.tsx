"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
    useEditorActions,
    useEditorBackground,
    useEditorCells,
    useEditorGridSize,
    useEditorMeta,
    useEditorStyle,
    useEditorTitle,
} from "@/hooks/useEditor";
import { deserializeGradientConfig } from "@/lib/utils";
import { RadialGradientStop } from "@/types/types";
import { useWindowSize } from "@/hooks/useWindowSize";
import { useBingoPatterns } from "@/hooks/useBingoPatterns";
import EditorCell from "@/components/editor/preview/editor-cell";

const ReactConfetti = dynamic(() => import("react-confetti"), { ssr: false });

type PreviewPanelProps = {
    ref: React.RefObject<HTMLDivElement>;
};

function pxToRem(px: number): string {
    return `${px / 16}rem`;
}

const PreviewPanel = React.memo(({ ref }: PreviewPanelProps) => {
    const background = useEditorBackground();
    const style = useEditorStyle();
    const gridSize = useEditorGridSize();
    const cells = useEditorCells();
    const { title, titleWidth } = useEditorTitle();
    const { id, canSave } = useEditorMeta();
    const actions = useEditorActions();

    const [editingTitle, setEditingTitle] = useState(false);
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const [rows, setRows] = useState(1);
    const titleDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [localTitle, setLocalTitle] = useState(title);
    const windowSize = useWindowSize();
    const [showConfetti, setShowConfetti] = useState(false);

    useBingoPatterns(cells, gridSize, () => setShowConfetti(true));

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    useEffect(() => {
        setShowConfetti(false);
    }, [id]);

    const getBackground = useMemo(() => {
        const config = deserializeGradientConfig(background.value);
        const stopToGradient = (stop: RadialGradientStop) =>
            `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`;
        return {
            backgroundColor: config.backgroundColor,
            backgroundImage: config.stops.map(stopToGradient).join(", "),
        };
    }, [background.value]);

    const getBackgroundImage = useMemo(() => {
        if (!background.backgroundImage) return undefined;
        return {
            backgroundImage: `url(${background.backgroundImage})`,
            backgroundSize: background.backgroundImageSize ? `${background.backgroundImageSize}%` : "100%",
            backgroundPosition: background.backgroundImagePosition || "center",
            opacity: (background.backgroundImageOpacity ?? 100) / 100,
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "local",
        };
    }, [
        background.backgroundImage,
        background.backgroundImageSize,
        background.backgroundImagePosition,
        background.backgroundImageOpacity,
    ]);

    const calculateRows = useCallback(() => {
        if (!titleRef.current) return;
        const textarea = titleRef.current;
        const computed = getComputedStyle(textarea);
        const lineHeight = parseInt(computed.lineHeight, 10) || 40;
        const paddingTop = parseInt(computed.paddingTop, 10) || 0;
        const paddingBottom = parseInt(computed.paddingBottom, 10) || 0;

        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight - paddingTop - paddingBottom;
        const newRows = Math.max(1, Math.ceil(scrollHeight / lineHeight));

        setRows(newRows);
        textarea.style.height = `${scrollHeight}px`;
    }, []);

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newTitle = e.target.value;
            setLocalTitle(newTitle);

            if (titleDebounceTimerRef.current) {
                clearTimeout(titleDebounceTimerRef.current);
            }

            titleDebounceTimerRef.current = setTimeout(() => {
                actions.setTitle(newTitle);
            }, 300);
        },
        [actions]
    );

    useEffect(() => {
        window.onbeforeunload = (e: BeforeUnloadEvent) => {
            if (canSave) {
                e.preventDefault();
            }
        };

        calculateRows();
        window.addEventListener("resize", calculateRows);
        return () => {
            window.removeEventListener("resize", calculateRows);
            window.onbeforeunload = null;
        };
    }, [calculateRows, canSave]);

    useEffect(() => {
        return () => {
            if (titleDebounceTimerRef.current) clearTimeout(titleDebounceTimerRef.current);
        };
    }, []);

    const gridStyle = useMemo(
        () => ({
            gridTemplateColumns: `repeat(${gridSize}, ${pxToRem(style.cellSize)})`,
            gap: pxToRem(style.gap),
            width: "fit-content",
        }),
        [gridSize, style.cellSize, style.gap]
    );

    const titleStyle = useMemo(() => {
        const gridWidthPx = gridSize * style.cellSize + (gridSize - 1) * style.gap;
        return {
            fontFamily: style.fontFamily,
            color: style.color,
            fontStyle: style.fontStyle,
            width: titleWidth ? pxToRem(titleWidth) : undefined,
            maxWidth: pxToRem(titleWidth || gridWidthPx),
        };
    }, [style.fontFamily, style.color, style.fontStyle, style.cellSize, style.gap, gridSize, titleWidth]);

    const cellIndices = useMemo(() => Array.from({ length: gridSize * gridSize }, (_, i) => i), [gridSize]);

    return (
        <div className='m-auto shrink-0 flex flex-col items-center'>
            {showConfetti && (
                <div className='fixed inset-0 pointer-events-none overflow-hidden z-[100]'>
                    <ReactConfetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={100}
                        gravity={0.3}
                        onConfettiComplete={() => setShowConfetti(false)}
                    />
                </div>
            )}
            <div
                ref={ref}
                className='w-fit h-fit shrink-0 flex flex-col p-8 rounded-lg overflow-hidden relative'
                style={getBackground}
            >
                {getBackgroundImage && (
                    <div className='absolute inset-0 pointer-events-none' style={getBackgroundImage} />
                )}
                <div className='relative z-10 w-fit'>
                    {editingTitle ? (
                        <textarea
                            ref={titleRef}
                            autoFocus
                            className='text-center w-full z-10 resize-none overflow-hidden text-4xl text-wrap break-words bg-transparent font-bold rounded-lg'
                            value={localTitle}
                            style={titleStyle}
                            onChange={handleTitleChange}
                            onFocus={calculateRows}
                            onBlur={() => setEditingTitle(false)}
                            rows={rows}
                        />
                    ) : (
                        <h1
                            id='bingo-title'
                            className='text-center z-10 text-4xl font-bold break-words mx-auto'
                            style={titleStyle}
                            onClick={() => setEditingTitle(true)}
                        >
                            {localTitle}
                        </h1>
                    )}
                    <div className='grid mt-8' style={gridStyle}>
                        {cellIndices.map((index) => (
                            <EditorCell key={index} index={index} />
                        ))}
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
