"use client";
import React, { memo } from "react";
import BackgroundEditor from "@/components/editor/background/background-editor";
import GridControls from "@/components/editor/grid/grid-controls";
import CellsToolbar from "@/components/editor/cell/cells-controls";
import StampControls from "@/components/editor/stamp/stamp-controls";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const AccordionSection = memo(
  ({ value, title, children }: { value: string; title: string; children: React.ReactNode }) => (
    <AccordionItem value={value} id={`${value}-accordion`}>
      <AccordionTrigger className={value === "cells" ? "pb-4" : "py-4"}>
        <h1 className="text-lg font-bold">{title}</h1>
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  )
);

AccordionSection.displayName = "AccordionSection";

const SettingsPanel = () => {
  return (
    <Accordion type="multiple" defaultValue={["cells", "stamp", "background", "grid"]}>
      <AccordionSection value="cells" title="Cells">
        <CellsToolbar />
      </AccordionSection>
      <AccordionSection value="stamp" title="Stamp">
        <StampControls />
      </AccordionSection>
      <AccordionSection value="background" title="Background">
        <BackgroundEditor />
      </AccordionSection>
      <AccordionSection value="grid" title="Grid">
        <GridControls />
      </AccordionSection>
    </Accordion>
  );
};

export default memo(SettingsPanel);
