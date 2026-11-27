"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import PreviewPanel from "@/components/editor/preview-panel";
import Controls from "@/components/editor/controls";
import FloatingToolWindow, { WindowOffset } from "@/components/editor/floating-tool-window";
import { EDITOR_TOOLS, EditorToolId, renderEditorTool } from "@/components/editor/variants/editor-panels";
import { useEditorActions } from "@/hooks/useEditor";

const EditorTutorial = dynamic(() => import("@/components/editor/tutorial"), { ssr: false });

const WORKSPACE_STORAGE_KEY = "starfire-editor-workspace-v1";
const VALID_TOOLS = new Set<EditorToolId>(["cells", "background", "stamp", "grid"]);

const DOT_CANVAS_STYLE: React.CSSProperties = {
  backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.14) 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};

const INITIAL_WINDOW_POSITIONS: Record<EditorToolId, string> = {
  cells: "top-16 left-5",
  background: "top-16 right-5",
  stamp: "bottom-5 left-5",
  grid: "bottom-5 right-5",
};

interface SavedWorkspace {
  openTools: EditorToolId[];
  positions: Partial<Record<EditorToolId, WindowOffset>>;
}

interface EditorProps {
  setSaving?: (isSaving: boolean) => void;
}

export default function Editor({ setSaving }: EditorProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const actions = useEditorActions();

  // Desktop: ordered list of open floating windows (last item gets highest z-index)
  const [openTools, setOpenTools] = useState<EditorToolId[]>(["cells"]);
  const [positions, setPositions] = useState<Partial<Record<EditorToolId, WindowOffset>>>({});
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);

  // Responsive mobile shell (< 768px): single bottom sheet instead of multi-window desktop
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTool, setMobileTool] = useState<EditorToolId | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Restore saved desktop open tools & window positions from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedWorkspace>;
        if (Array.isArray(parsed.openTools)) {
          const valid = parsed.openTools.filter((id): id is EditorToolId => VALID_TOOLS.has(id));
          setOpenTools(valid);
        }
        if (parsed.positions && typeof parsed.positions === "object") {
          setPositions(parsed.positions);
        }
      }
    } catch {
      // Ignore malformed storage
    } finally {
      setWorkspaceLoaded(true);
    }
  }, []);

  // Persist desktop workspace whenever openTools or committed positions change
  useEffect(() => {
    if (!workspaceLoaded) return;
    try {
      const payload: SavedWorkspace = { openTools, positions };
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [openTools, positions, workspaceLoaded]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const toggleTool = (id: EditorToolId) => {
    if (isMobile) {
      setMobileTool((prev) => (prev === id ? null : id));
      return;
    }
    setOpenTools((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const focusTool = useCallback((id: EditorToolId) => {
    setOpenTools((prev) => {
      if (prev[prev.length - 1] === id) return prev;
      return [...prev.filter((item) => item !== id), id];
    });
  }, []);

  const closeTool = useCallback((id: EditorToolId) => {
    setOpenTools((prev) => prev.filter((item) => item !== id));
  }, []);

  const handlePositionCommit = useCallback((id: EditorToolId, offset: WindowOffset) => {
    setPositions((prev) => ({ ...prev, [id]: offset }));
  }, []);

  const activeMobileMeta = mobileTool ? EDITOR_TOOLS.find((t) => t.id === mobileTool) : null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-background/35 backdrop-blur-[2px] overflow-hidden z-40">
      {/* Dotted studio overlay on top of the app's radial gradient + noise */}
      <div className="pointer-events-none absolute inset-0" style={DOT_CANVAS_STYLE} />

      <EditorTutorial />

      {/* Floating Top Controls Bar */}
      <div className="fixed top-3 md:top-4 left-1/2 -translate-x-1/2 z-[48] w-fit max-w-[94vw] rounded-xl border border-border/80 bg-background/85 backdrop-blur-xl px-2.5 md:px-3 py-1.5 md:py-2 shadow-lg shadow-black/10 dark:shadow-black/40 overflow-x-auto">
        <Controls setSaving={setSaving} boardRef={previewRef} />
      </div>

      {/* Edge-to-Edge Canvas (clicking background deselects active cell) */}
      <div
        onClick={() => actions.setSelectedCell(null)}
        className="relative h-full w-full overflow-auto pt-20 md:pt-24 pb-24 md:pb-28 px-3 md:px-8 custom-scrollbar"
      >
        <div className="min-h-full flex items-center justify-center">
          <PreviewPanel ref={previewRef} />
        </div>
      </div>

      {/* DESKTOP: Multi-Window Draggable Tool Inspectors */}
      {!isMobile && (
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
                savedOffset={positions[tool.id]}
                zIndex={42 + orderIdx}
                onFocus={() => focusTool(tool.id)}
                onClose={() => closeTool(tool.id)}
                onPositionCommit={(offset) => handlePositionCommit(tool.id, offset)}
              />
            );
          })}
        </AnimatePresence>
      )}

      {/* MOBILE: Single Bottom Sheet Drawer */}
      {isMobile && (
        <AnimatePresence>
          {mobileTool && activeMobileMeta && (
            <motion.div
              key={mobileTool}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed inset-x-2 bottom-[76px] max-h-[52vh] rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/25 dark:shadow-black/60 flex flex-col overflow-hidden z-[48]"
            >
              <div className="px-4 py-2.5 border-b border-border/70 bg-muted/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <activeMobileMeta.icon className="h-4 w-4 text-foreground/80" />
                  <span className="text-xs font-semibold text-foreground">{activeMobileMeta.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileTool(null)}
                  aria-label={`Close ${activeMobileMeta.label}`}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-y-auto p-4 custom-scrollbar">{renderEditorTool(mobileTool)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Floating Bottom Tool Dock (shared on Desktop & Mobile) */}
      <div className="fixed bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-[49] max-w-[96vw]">
        <div className="flex items-center gap-1 md:gap-1.5 p-1.5 rounded-xl border border-border/80 bg-background/90 backdrop-blur-xl shadow-xl shadow-black/15 dark:shadow-black/50">
          {EDITOR_TOOLS.map(({ id, shortLabel, icon: Icon }) => {
            const isOpen = isMobile ? mobileTool === id : openTools.includes(id);
            return (
              <motion.button
                key={id}
                id={`${id}-accordion`}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
                onClick={() => toggleTool(id)}
                className={`relative h-10 px-2.5 sm:px-3.5 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs font-semibold transition-colors ${
                  isOpen
                    ? "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{shortLabel}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
