"use client";
import React, { memo } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GradientEditor from "@/components/editor/background/gradient-editor";

const ImageControls = dynamic(() => import("@/components/editor/background/image-controls"), { ssr: false });

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
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:via-rose-500 data-[state=active]:to-orange-400 data-[state=active]:text-white"
          >
            Gradient
          </TabsTrigger>
          <TabsTrigger
            value="image"
            id="image-tab"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:via-rose-500 data-[state=active]:to-orange-400 data-[state=active]:text-white"
          >
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
