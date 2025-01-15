import React, { useEffect, useRef, useState } from "react";
import PreviewPanel from "@/components/editor/preview-panel";
import SettingsPanel from "@/components/editor/settings-panel";
import Controls from "./controls";

const Editor = () => {
    const previewRef = useRef<HTMLDivElement>(null);
    const [settingsHeight, setSettingsHeight] = useState<number>(40 * 16);

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
            className=' mb-8 mx-auto border border-white/75 dark:border-[#6C6C6C] bg-gray-100/20 dark:bg-[#0c0c0c69] backdrop-blur-xl rounded-[30px] p-3 shadow-2xl'
        >
            <div className=' bg-gray-100/10 dark:bg-gray-700/10 overflow-visible rounded-2xl  md:rounded-2xl py-4 pr-4 '>
                <div className='grid grid-cols-4 gap-8'>
                    <div
                        style={{
                            height: `${settingsHeight}px`,
                        }}
                        className='col-span-1 min-w-[21rem] border-r px-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-foreground/50'
                    >
                        <Controls />
                        <SettingsPanel />
                    </div>
                    <div className='col-span-3'>
                        <PreviewPanel ref={previewRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Editor;
