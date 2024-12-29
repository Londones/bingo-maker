"use client";
import React from "react";
import BackgroundEditor from "@/components/editor/background/background-editor";

const SettingsPanel = () => {
    return (
        <div className='border-r pr-4 dark:border-gray-100/10'>
            <BackgroundEditor />
        </div>
    );
};

export default SettingsPanel;
