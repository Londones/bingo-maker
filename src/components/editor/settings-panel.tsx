"use client";
import React from "react";
import BackgroundEditor from "@/components/editor/background/background-editor";
import GridControls from "@/components/editor/grid/grid-controls";
import CellsToolbar from "./cell/cells-controls";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const SettingsPanel = () => {
    return (
        <Accordion type='multiple' defaultValue={["cells", "background", "grid"]}>
            <AccordionItem value='cells'>
                <AccordionTrigger className='pb-4'>
                    <h1 className='text-lg font-bold'>Cells</h1>
                </AccordionTrigger>
                <AccordionContent>
                    <CellsToolbar />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value='background'>
                <AccordionTrigger className='py-4'>
                    <h1 className='text-lg font-bold'>Background</h1>
                </AccordionTrigger>
                <AccordionContent>
                    <BackgroundEditor />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value='grid'>
                <AccordionTrigger className='py-4'>
                    <h1 className='text-lg font-bold'>Grid</h1>
                </AccordionTrigger>
                <AccordionContent>
                    <GridControls />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

export default SettingsPanel;
