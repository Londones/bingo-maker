"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Grid3X3, Palette, Stamp, Type } from "lucide-react";
import CellsToolbar from "@/components/editor/cell/cells-controls";

const PanelLoader = () => (
  <div className="py-10 text-center text-xs text-muted-foreground animate-pulse">Loading...</div>
);

export const LazyBackgroundEditor = dynamic(() => import("@/components/editor/background/background-editor"), {
  ssr: false,
  loading: PanelLoader,
});

export const LazyStampControls = dynamic(() => import("@/components/editor/stamp/stamp-controls"), {
  ssr: false,
  loading: PanelLoader,
});

export const LazyGridControls = dynamic(() => import("@/components/editor/grid/grid-controls"), {
  ssr: false,
  loading: PanelLoader,
});

export type EditorToolId = "cells" | "background" | "stamp" | "grid";

export const EDITOR_TOOLS: {
  id: EditorToolId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "cells", label: "Cells & Typography", shortLabel: "Cells", icon: Type },
  { id: "background", label: "Background", shortLabel: "Backdrop", icon: Palette },
  { id: "stamp", label: "Stamp", shortLabel: "Stamp", icon: Stamp },
  { id: "grid", label: "Grid & Marks", shortLabel: "Grid", icon: Grid3X3 },
];

export function renderEditorTool(tool: EditorToolId) {
  switch (tool) {
    case "cells":
      return <CellsToolbar />;
    case "background":
      return <LazyBackgroundEditor />;
    case "stamp":
      return <LazyStampControls />;
    case "grid":
      return <LazyGridControls />;
  }
}
