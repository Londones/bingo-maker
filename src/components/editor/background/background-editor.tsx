"use client";
import React, { memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GradientEditor from "@/components/editor/background/gradient-editor";
import ImageControls from "@/components/editor/background/image-controls";

const TabContent = memo(({ value, children }: { value: string; children: React.ReactNode }) => (
  <TabsContent value={value}>{children}</TabsContent>
));

TabContent.displayName = "TabContent";

const BackgroundEditor = () => {
  return (
    <div>
      <Tabs defaultValue="gradient" className="">
        <TabsList className="flex h-12">
          {" "}
          <TabsTrigger
            value="gradient"
            className=" data-[state=active]:bg-gradient-to-r from-[hsla(339,100%,55%,1)] to-[hsla(197,100%,64%,1)]"
          >
            Gradient
          </TabsTrigger>
          <TabsTrigger value="image" className="" id="image-tab">
            Image
          </TabsTrigger>
        </TabsList>
        <TabContent value="gradient">
          <GradientEditor />
        </TabContent>
        <TabContent value="image">
          <ImageControls />
        </TabContent>
      </Tabs>
    </div>
  );
};

export default memo(BackgroundEditor);
