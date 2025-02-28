"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GradientEditor from "@/components/editor/background/gradient-editor";
import ImageControls from "@/components/editor/background/image-controls";
const BackgroundEditor = () => {
    return (
        <div>
            <Tabs defaultValue='gradient' className=''>
                <TabsList className='flex h-12'>
                    <TabsTrigger
                        value='gradient'
                        className=' data-[state=active]:bg-gradient-to-r from-[hsla(339,100%,55%,1)] to-[hsla(197,100%,64%,1)]'
                    >
                        Gradient
                    </TabsTrigger>
                    <TabsTrigger value='image' className=''>
                        Image
                    </TabsTrigger>
                </TabsList>
                <TabsContent value='gradient'>
                    <GradientEditor />
                </TabsContent>
                <TabsContent value='image'>
                    <ImageControls />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default BackgroundEditor;
