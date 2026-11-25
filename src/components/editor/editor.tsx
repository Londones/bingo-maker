"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import PreviewPanel from "@/components/editor/preview-panel";
import Controls from "@/components/editor/controls";
import FloatingToolWindow from "@/components/editor/floating-tool-window";
import { EDITOR_TOOLS, EditorToolId } from "@/components/editor/variants/editor-panels";

const EditorTutorial = dynamic(() => import("@/components/editor/tutorial"), { ssr: false });

const DOT_CANVAS_STYLE: React.CSSProperties = {
  backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.14) 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};

const INITIAL_WINDOW_POSITIONS: Record<EditorToolId, string> = {
  cells: "top-20 right-5",
  background: "top-20 left-5",
  stamp: "bottom-24 left-5",
  grid: "bottom-24 right-5",
};

interface EditorProps {
  setSaving?: (isSaving: boolean) => void;
}

export default function Editor({ setSaving }: EditorProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  // Ordered list of open tool windows (last item gets highest z-index)
  const [openTools, setOpenTools] = useState<EditorToolId[]>(["cells"]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const toggleTool = (id: EditorToolId) => {
    setOpenTools((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const focusTool = (id: EditorToolId) => {
    setOpenTools((prev) => {
      if (prev[prev.length - 1] === id) return prev;
      return [...prev.filter((item) => item !== id), id];
    });
  };

  const closeTool = (id: EditorToolId) => {
    setOpenTools((prev) => prev.filter((item) => item !== id));
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-background/35 backdrop-blur-[2px] overflow-hidden z-40">
      {/* Dotted studio overlay on top of the app's radial gradient + noise */}
      <div className="pointer-events-none absolute inset-0" style={DOT_CANVAS_STYLE} />

      <EditorTutorial />

      {/* Floating Top Controls Bar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[48] w-fit max-w-[92vw] rounded-xl border border-border/80 bg-background/85 backdrop-blur-xl px-3 py-2 shadow-lg shadow-black/10 dark:shadow-black/40">
        <Controls setSaving={setSaving} />
      </div>

      {/* Edge-to-Edge Canvas */}
      <div className="relative h-full w-full overflow-auto pt-24 pb-28 px-8 custom-scrollbar">
        <div className="min-h-full flex items-center justify-center">
          <PreviewPanel ref={previewRef} />
        </div>
      </div>

      {/* Multi-Window Draggable Tool Inspectors (fixed DOM order, dynamic z-index) */}
      <AnimatePresence>
        {EDITOR_TOOLS.filter((tool) => openTools.includes(tool.id)).map((tool) => {
          const orderIdx = openTools.indexOf(tool.id);

          return (
            <FloatingToolWindow
              key={tool.id}
              id={tool.id}
              title={tool.label}
              icon={tool.icon}
              initialPositionClass={INITIAL_WINDOW_POSITIONS[tool.id]}
              zIndex={42 + orderIdx}
              onFocus={() => focusTool(tool.id)}
              onClose={() => closeTool(tool.id)}
            />
          );
        })}
      </AnimatePresence>

      {/* Floating Bottom Tool Dock */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[49]">
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-border/80 bg-background/90 backdrop-blur-xl shadow-xl shadow-black/15 dark:shadow-black/50">
          {EDITOR_TOOLS.map(({ id, shortLabel, icon: Icon }) => {
            const isOpen = openTools.includes(id);
            return (
              <motion.button
                key={id}
                id={`${id}-accordion`}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
                onClick={() => toggleTool(id)}
                className={`relative h-10 px-3.5 rounded-lg flex items-center gap-2 text-xs font-semibold transition-colors ${
                  isOpen
                    ? "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{shortLabel}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
