import React, { useEffect, useRef, useState } from "react";
import PreviewPanel from "@/components/editor/preview-panel";
import SettingsPanel from "@/components/editor/settings-panel";
import Controls from "@/components/editor/controls";

const Editor = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-background/40 backdrop-blur-sm overflow-hidden z-40">
      <div className="h-full w-full flex flex-col text-foreground/50">
        <div className="p-4 border-b flex items-center bg-background/40 backdrop-blur-sm">
          <Controls isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen} />
        </div>
        <div className="flex overflow-hidden relative flex-1">
          <div
            className={`h-full border-r backdrop-blur-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overflow-y-auto
                      transition-all duration-300 ease-in-out z-30
                      ${isPanelOpen ? "translate-x-0 min-w-96" : "-translate-x-full w-0 opacity-0 lg:border-r-0"}`}
          >
            <div className="p-4">
              <SettingsPanel />
            </div>
          </div>
          <div className="w-full overflow-auto bg-background/50 flex-1 relative">
            <div className="inset-0 custom-scrollbar">
              <div className="min-h-full py-12">
                <div className={"flex lg:justify-center"}>
                  <div className={"mx-12 pr-12 lg:pr-0"}>
                    <PreviewPanel ref={previewRef} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
