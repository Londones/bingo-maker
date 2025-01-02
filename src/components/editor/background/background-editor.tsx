"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GradientEditor from "@/components/editor/background/gradient-editor";

const BackgroundEditor = () => {
    return (
        <div>
            <Tabs defaultValue='gradient' className=''>
                <TabsList className='flex h-12'>
                    <TabsTrigger
                        value='gradient'
                        className='px-8 data-[state=active]:bg-gradient-to-r from-[hsla(339,100%,55%,1)] to-[hsla(197,100%,64%,1)]'
                    >
                        Gradient
                    </TabsTrigger>
                    <TabsTrigger value='image' className='px-8'>
                        Image
                    </TabsTrigger>
                </TabsList>
                <TabsContent value='gradient'>
                    <GradientEditor />
                </TabsContent>
                <TabsContent value='image'>
                    <div>Image</div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default BackgroundEditor;
