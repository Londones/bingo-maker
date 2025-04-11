import React, { useEffect, useRef, useState } from "react";
import PreviewPanel from "@/components/editor/preview-panel";
import SettingsPanel from "@/components/editor/settings-panel";
import Controls from "./controls";

const Editor = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  // Add CSS to prevent body scrolling when editor is shown
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-background/40 backdrop-blur-sm overflow-hidden z-40">
      <div className="h-full w-full flex flex-col text-foreground/50">
        {" "}
        {/* Added padding top to make room for existing navbar */}
        {/* Editor Header with controls */}
        <div className="p-4 border-b flex items-center bg-background/40 backdrop-blur-sm">
          <Controls isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen} />
        </div>
        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Settings Panel - slides in/out on mobile */}
          <div
            className={`w-80 h-full border-r bg-background/80 backdrop-blur-sm overflow-y-auto
                      custom-scrollbar transition-all duration-300 ease-in-out z-30
                      lg:relative lg:translate-x-0
                      ${isPanelOpen ? "translate-x-0" : "-translate-x-full lg:w-0 lg:opacity-0 lg:border-r-0"}`}
          >
            <div className="p-4">
              <SettingsPanel />
            </div>
          </div>

          {/* Preview Area - Takes remaining space and scrolls independently */}
          <div className="flex-1 h-full overflow-auto custom-scrollbar bg-background/50">
            <div className="p-4 h-full min-h-0">
              <PreviewPanel ref={previewRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
