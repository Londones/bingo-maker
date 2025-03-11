import React, { useEffect, useRef, useState } from "react";
import PreviewPanel from "@/components/editor/preview-panel";
import SettingsPanel from "@/components/editor/settings-panel";
import Controls from "./controls";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Editor = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [settingsHeight, setSettingsHeight] = useState<number>(40 * 16);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  useEffect(() => {
    if (!previewRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const previewHeight = entries[0]?.contentRect.height;
      const nexHeight = Math.min(85 * 16, Math.max(40 * 16, previewHeight!));
      setSettingsHeight(nexHeight);
    });

    resizeObserver.observe(previewRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  });

  return (
    <div
      style={{
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="mb-8 mx-auto border border-white/75 dark:border-[#6C6C6C] bg-gray-100/20 dark:bg-[#0c0c0c69] backdrop-blur-xl rounded-[30px] p-3 shadow-2xl"
    >
      <div className="bg-gray-100/10 dark:bg-gray-700/10 overflow-visible rounded-2xl md:rounded-2xl p-4 relative">
        <Button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          variant="outline"
          size="sm"
          className="absolute top-6 left-6 z-50 hidden max-xl:block"
        >
          {isPanelOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <div className="grid grid-cols-4 gap-8 relative">
          <div
            style={{
              height: `${settingsHeight}px`,
            }}
            className={`col-span-1 min-w-[21rem] border-r px-4 overflow-y-auto 
                            [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden 
                            text-foreground/50 transition-all duration-300 ease-in-out
                            max-xl:absolute max-xl:bg-gray-100/20 dark:max-xl:dark:bg-[#0c0c0c69] max-xl:backdrop-blur-xl max-xl:z-40
                            max-xl:rounded-xl max-xl:shadow-lg max-xl:origin-left
                            ${
                              isPanelOpen
                                ? "max-xl:translate-x-0 max-xl:block max-xl:scale-100"
                                : "max-xl:-translate-x-full max-xl:hidden max-xl:scale-95"
                            }`}
          >
            <div className="max-xl:mt-12">
              <Controls />
              <SettingsPanel />
            </div>
          </div>

          <div className="col-span-3 max-xl:col-span-4">
            <PreviewPanel ref={previewRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
