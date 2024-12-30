"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GradientEditor from "@/components/ui/gradient-editor";

const BackgroundEditor = () => {
    return (
        <div>
            <Tabs defaultValue='gradient' className=''>
                <TabsList className='flex h-12'>
                    <TabsTrigger value='gradient' className=''>
                        Gradient
                    </TabsTrigger>
                    <TabsTrigger value='image'>Image</TabsTrigger>
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
