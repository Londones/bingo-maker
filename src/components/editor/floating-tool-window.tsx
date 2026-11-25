"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GripHorizontal, X } from "lucide-react";
import { EditorToolId, renderEditorTool } from "@/components/editor/variants/editor-panels";

interface FloatingToolWindowProps {
  id: EditorToolId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  initialPositionClass: string;
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
}

const VIEWPORT_PADDING = 8;

export default function FloatingToolWindow({
  id,
  title,
  icon: Icon,
  initialPositionClass,
  zIndex,
  onFocus,
  onClose,
}: FloatingToolWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const dragStateRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startOffsetX: number;
    startOffsetY: number;
    minDx: number;
    maxDx: number;
    minDy: number;
    maxDy: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const handleTitlebarPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      onFocus();

      const el = windowRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      dragStateRef.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startOffsetX: offsetRef.current.x,
        startOffsetY: offsetRef.current.y,
        minDx: VIEWPORT_PADDING - rect.left,
        maxDx: window.innerWidth - VIEWPORT_PADDING - rect.right,
        minDy: VIEWPORT_PADDING - rect.top,
        maxDy: window.innerHeight - VIEWPORT_PADDING - rect.bottom,
      };
      setIsDragging(true);
    },
    [onFocus]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;

      const rawDx = e.clientX - drag.startMouseX;
      const rawDy = e.clientY - drag.startMouseY;

      const clampedDx = Math.max(drag.minDx, Math.min(drag.maxDx, rawDx));
      const clampedDy = Math.max(drag.minDy, Math.min(drag.maxDy, rawDy));

      setOffset({
        x: drag.startOffsetX + clampedDx,
        y: drag.startOffsetY + clampedDy,
      });
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={windowRef}
      onPointerDown={onFocus}
      style={{
        zIndex,
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      className={`fixed ${initialPositionClass} w-[316px] max-w-[calc(100vw-2rem)] h-fit max-h-[calc(100vh-8.5rem)] will-change-transform`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="w-full h-fit max-h-[calc(100vh-8.5rem)] rounded-2xl border border-border/80 bg-background/90 backdrop-blur-xl shadow-2xl shadow-black/15 dark:shadow-black/50 flex flex-col overflow-hidden"
      >
        {/* Draggable Window Titlebar */}
        <div
          onPointerDown={handleTitlebarPointerDown}
          className={`px-3.5 py-2.5 border-b border-border/70 bg-muted/40 flex items-center justify-between gap-2 select-none shrink-0 touch-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <Icon className="h-3.5 w-3.5 text-foreground/80 shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">{title}</span>
          </div>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content hugs height up to max-h */}
        <div className="overflow-y-auto p-4 custom-scrollbar">{renderEditorTool(id)}</div>
      </motion.div>
    </div>
  );
}
