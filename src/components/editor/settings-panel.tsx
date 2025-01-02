"use client";
import React from "react";
import BackgroundEditor from "@/components/editor/background/background-editor";
import GridControls from "@/components/editor/grid/grid-controls";

const SettingsPanel = () => {
    return (
        <div className='flex flex-col gap-4 py-2 dark:border-gray-100/10'>
            <BackgroundEditor />
            <GridControls />
        </div>
    );
};

export default SettingsPanel;
