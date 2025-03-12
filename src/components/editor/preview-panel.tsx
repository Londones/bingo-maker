"use client";
import React from "react";
import { useEditor } from "@/hooks/useEditor";
import { deserializeGradientConfig } from "@/lib/utils";
import { RadialGradientStop } from "@/types/types";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from "@/components/ui/context-menu";
import CellContextMenu from "@/components/editor/cell/cell-context-menu";

type PreviewPanelProps = {
  ref: React.RefObject<HTMLDivElement>;
};

const PreviewPanel = ({ ref }: PreviewPanelProps) => {
  const { state, actions } = useEditor();
  const [editingCell, setEditingCell] = React.useState<number | null>(null);
  const [editContent, setEditContent] = React.useState<string>("");
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const cellRefs = React.useRef<HTMLDivElement[]>([]);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const titleRef = React.useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = React.useState(1);

  const getBackground = () => {
    const { background } = state;
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

  const gradientStyle = getBackground();

  const getBackgroundImage = () => {
    const { background } = state;
    //const opacity = (background?.backgroundImageOpacity ?? 100) / 100;
    return {
      backgroundImage: `url(${background.backgroundImage})`,
      backgroundSize: `${background.backgroundImageSize}%` || "100%",
      backgroundPosition: background.backgroundImagePosition || "center",
      opacity: (background.backgroundImageOpacity ?? 100) / 100,
      backgroundRepeat: "no-repeat",
    };
  };

  const getBackgroundCellImage = (index: number) => {
    const {
      cellBackgroundImage,
      cellBackgroundImageOpacity,
      cellBackgroundImagePosition,
      cellBackgroundImageSize,
    } = state.cells[index]?.cellStyle || {};
    return {
      backgroundImage: `url(${cellBackgroundImage})`,
      backgroundSize: `${cellBackgroundImageSize}%` || "100%",
      backgroundPosition: cellBackgroundImagePosition || "center",
      opacity: (cellBackgroundImageOpacity ?? 100) / 100,
      backgroundRepeat: "no-repeat",
    };
  };

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
        let fontSize = el.style.fontSize
          ? parseInt(el.style.fontSize)
          : state.style.fontSize;

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

  // Function to convert px to rem
  const pxToRem = (px: number): string => {
    // Assuming base font size of 16px (browser default)
    return `${px / 16}rem`;
  };

  const getCellStyles = (index: number) => {
    const baseStyles = {
      width: pxToRem(state.style.cellSize),
      height: pxToRem(state.style.cellSize),
      color: state.cells[index]?.cellStyle?.color ?? state.style.color,
      fontSize: pxToRem(
        state.cells[index]?.cellStyle?.fontSize ?? state.style.fontSize
      ),
      fontFamily:
        state.cells[index]?.cellStyle?.fontFamily ?? state.style.fontFamily,
      fontWeight:
        state.cells[index]?.cellStyle?.fontWeight ?? state.style.fontWeight,
      fontStyle:
        state.cells[index]?.cellStyle?.fontStyle ?? state.style.fontStyle,
      backgroundColor: getBgColorWithOpacity(
        state.cells[index]?.cellStyle?.cellBackgroundColor ??
          state.style.cellBackgroundColor,
        state.cells[index]?.cellStyle?.cellBackgroundOpacity ??
          state.style.cellBackgroundOpacity
      ),
    };

    const backgroundStyles = {
      borderColor:
        state.cells[index]?.cellStyle?.cellBorderColor ??
        state.style.cellBorderColor,
      borderWidth:
        state.cells[index]?.cellStyle?.cellBorderWidth ??
        state.style.cellBorderWidth,
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

  // const getBackgroundImageWithOpacity = (imageUrl: string | undefined, opacity: number) => {
  //     if (!imageUrl) return undefined;
  //     return {
  //         backgroundImage: `linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${
  //             1 - opacity
  //         })), url(${imageUrl})`,
  //         backgroundSize: "cover",
  //         backgroundPosition: "center",
  //     };
  // };

  const calculateRows = React.useCallback(() => {
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

  React.useEffect(() => {
    let cellObserver: ResizeObserver | null = null;
    if (cellRefs.current.length > 0) {
      cellObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const index = parseInt(
            (entry.target as HTMLElement).dataset.index!,
            10
          );
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

    window.onbeforeunload = (e: BeforeUnloadEvent) => {
      if (!state.id) {
        e.preventDefault();
        // display a confirmation dialog
        alert("You have unsaved changes. Are you sure you want to leave?");
      }
    };

    calculateRows();
    window.addEventListener("resize", calculateRows);
    return () => {
      cellObserver?.disconnect();
      inputObserver?.disconnect();
      window.removeEventListener("resize", calculateRows);
    };
  }, [state.cells, checkOverflow, editingCell, state.id, calculateRows]);

  return (
    <div ref={ref} className="flex flex-col items-center space-y-4">
      <div
        className="w-full min-h-[40rem] mx-auto h-full flex items-center flex-col justify-center p-8 rounded-lg relative"
        style={gradientStyle}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={getBackgroundImage()}
        />
        {editingTitle ? (
          <textarea
            ref={titleRef}
            className="text-center w-full z-10 resize-none overflow-hidden text-4xl text-wrap bg-transparent font-bold rounded-lg"
            value={state.title}
            style={{
              color: state.style.color,
              fontFamily: state.style.fontFamily,
              fontStyle: state.style.fontStyle,
              height: "fit-content",
            }}
            onChange={(e) => {
              actions.setTitle(e.target.value);
              calculateRows();
            }}
            onFocus={calculateRows}
            onBlur={() => setEditingTitle(false)}
            rows={rows}
          />
        ) : (
          <h1
            className="text-center z-10 text-4xl font-bold "
            style={{
              fontFamily: state.style.fontFamily,
              color: state.style.color,
              fontStyle: state.style.fontStyle,
            }}
            onClick={() => setEditingTitle(true)}
          >
            {state.title}
          </h1>
        )}
        <div
          className="grid mt-8  mx-auto"
          style={{
            gridTemplateColumns: `repeat(${state.gridSize}, ${pxToRem(
              state.style.cellSize
            )})`,
            gap: pxToRem(state.style.gap),
            width: "fit-content",
          }}
        >
          {state.cells.map((cell, index) => (
            <ContextMenu key={index}>
              <ContextMenuTrigger>
                <div
                  key={index}
                  className="relative items-center justify-center rounded-md backdrop-blur-sm transition-all cursor-pointer hover:shadow-md"
                  style={{
                    ...getCellStyles(index).baseStyles,
                    ...getCellStyles(index).backgroundStyles,
                  }}
                  onClick={() => handleCellClick(index)}
                >
                  {editingCell === index ? (
                    <textarea
                      ref={inputRef}
                      className="w-full bg-transparent h-fit p-1 rounded-md text-center content-center resize-none whitespace-pre-wrap break-words overflow-auto"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onBlur={handleBlur}
                      style={{
                        ...getCellStyles(index).baseStyles,
                        backgroundColor: "transparent",
                      }}
                    />
                  ) : (
                    <div className="p-1 w-full h-full text-center whitespace-pre-wrap content-center break-words overflow-auto relative">
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={getBackgroundCellImage(index)}
                      />
                      <div className=" relative">{cell.content}</div>
                    </div>
                  )}

                  {cell.validated && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
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
                          alt="stamp"
                          className="w-full h-full object-contain"
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
              <ContextMenuContent className="bg-background/90 backdrop-blur-md overflow-visible">
                <CellContextMenu index={index} />
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
