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
        <div className=" flex overflow-hidden relative">
          {/* Settings Panel - slides in/out on mobile */}
          <div
            className={`h-full border-r backdrop-blur-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overflow-y-auto
                      custom-scrollbar transition-all duration-300 ease-in-out z-30
                      relative translate-x-0
                      ${isPanelOpen ? "translate-x-0 min-w-96" : "-translate-x-full w-0 opacity-0 lg:border-r-0"}`}
          >
            <div className="p-4">
              <SettingsPanel />
            </div>
          </div>

          {/* Preview Area - Takes remaining space and scrolls independently */}
          <div className="w-full h-full bg-background/50 flex-1 relative">
            {/* Add a larger minimum padding around the preview content to ensure it's fully visible */}
            <div className="absolute inset-0 overflow-auto p-8 md:p-12 custom-scrollbar">
              <div className="min-w-full min-h-full flex items-center justify-center">
                <PreviewPanel ref={previewRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
