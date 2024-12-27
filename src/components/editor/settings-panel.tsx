import React from "react";
import BackgroundEditor from "@/components/editor/background/background-editor";

const SettingsPanel = () => {
    return (
        <div className='p-4 border-r dark:border-gray-800'>
            <BackgroundEditor />
        </div>
    );
};

export default SettingsPanel;
