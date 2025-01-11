import React from "react";
import PreviewPanel from "@/components/editor/preview-panel";
import SettingsPanel from "@/components/editor/settings-panel";

const Editor = () => {
    return (
        <div
            style={{
                boxShadow:
                    "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
            }}
            className='  mx-auto w-full border border-white/75 dark:border-[#6C6C6C] bg-gray-100/20 dark:bg-[#0c0c0c69] backdrop-blur-xl rounded-[30px] p-3 shadow-2xl'
        >
            <div className=' h-[50rem] w-full bg-gray-100/10 dark:bg-gray-700/10 overflow-hidden rounded-2xl  md:rounded-2xl py-4 pr-4 '>
                <div className='grid grid-cols-4 gap-8 h-full'>
                    <div className='col-span-1 border-r px-4 overflow-y-scroll [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-foreground/50'>
                        <SettingsPanel />
                    </div>
                    <div className='col-span-3'>
                        <PreviewPanel />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Editor;
