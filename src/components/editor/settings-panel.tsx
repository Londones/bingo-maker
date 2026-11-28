"use client";

import React, { memo, useState } from "react";
import dynamic from "next/dynamic";
import { Grid3X3, Palette, Stamp, Type } from "lucide-react";
import CellsToolbar from "@/components/editor/cell/cells-controls";

const PanelLoader = () => (
  <div className="py-10 text-center text-xs text-muted-foreground animate-pulse">Loading controls...</div>
);

const BackgroundEditor = dynamic(() => import("@/components/editor/background/background-editor"), {
  ssr: false,
  loading: PanelLoader,
});

const StampControls = dynamic(() => import("@/components/editor/stamp/stamp-controls"), {
  ssr: false,
  loading: PanelLoader,
});

const GridControls = dynamic(() => import("@/components/editor/grid/grid-controls"), {
  ssr: false,
  loading: PanelLoader,
});

type TabId = "cells" | "background" | "stamp" | "grid";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "cells", label: "Cells", icon: Type },
  { id: "background", label: "Background", icon: Palette },
  { id: "stamp", label: "Stamp", icon: Stamp },
  { id: "grid", label: "Grid", icon: Grid3X3 },
];

const SettingsPanel = () => {
  const [activeTab, setActiveTab] = useState<TabId>("cells");

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Editor settings"
        className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-muted/60 border border-border/60"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`${id}-accordion`}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-background text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-1">
        {activeTab === "cells" && <CellsToolbar />}
        {activeTab === "background" && <BackgroundEditor />}
        {activeTab === "stamp" && <StampControls />}
        {activeTab === "grid" && <GridControls />}
      </div>
    </div>
  );
};

export default memo(SettingsPanel);
