"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Settings, Palette, Grid, Check } from "lucide-react";

const EditorPreview: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [autoplay, setAutoplay] = useState<boolean>(true);

  // Feature data structured to match editor appearance
  const features = [
    {
      id: 1,
      title: "Custom Grid Layout",
      description: "Choose different grid sizes for your bingo cards",
      icon: <Grid className="h-5 w-5 text-foreground/70" />,
      content: (
        <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-12 md:w-14 md:h-14 rounded-md border border-foreground/20 bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground/70 font-medium"
            >
              {i + 1}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 2,
      title: "Beautiful Backgrounds",
      description: "Create stunning gradients or upload custom images",
      icon: <Palette className="h-5 w-5 text-foreground/70" />,
      content: (
        <div className="w-40 h-40 md:w-44 md:h-44 mx-auto rounded-lg overflow-hidden border border-foreground/20">
          <div className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 animate-gradient-x"></div>
        </div>
      ),
    },
    {
      id: 3,
      title: "Advanced Customization",
      description: "Fine-tune every aspect of your bingo cards",
      icon: <Settings className="h-5 w-5 text-foreground/70" />,
      content: (
        <div className="flex flex-col gap-3 w-fit mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/60"></div>
            <div className="h-6 w-32 rounded-md border border-foreground/20 bg-background/80"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/60"></div>
            <div className="h-6 w-32 rounded-md border border-foreground/20 bg-background/80"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/60"></div>
            <div className="h-6 w-32 rounded-md border border-foreground/20 bg-background/80"></div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: "Interactive Play Mode",
      description: "Easily mark cells as completed",
      icon: <Check className="h-5 w-5 text-foreground/70" />,
      content: (
        <div className="grid grid-cols-2 gap-2 w-fit mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-16 h-16 rounded-md border border-foreground/20 ${
                i % 3 === 0 ? "bg-primary/30" : "bg-background/80"
              } backdrop-blur-sm flex items-center justify-center text-foreground/70 font-medium`}
            >
              {i % 3 === 0 && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-foreground/90"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      ),
    },
  ];

  // Autoplay functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (autoplay) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length);
      }, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoplay, features.length]);

  const handleMouseEnter = () => setAutoplay(false);
  const handleMouseLeave = () => setAutoplay(true);

  const nextSlide = () => setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length);
  const prevSlide = () => setCurrentIndex((prevIndex) => (prevIndex - 1 + features.length) % features.length);

  return (
    <div
      className="h-[350px] relative rounded-lg overflow-hidden border border-foreground/10 bg-background/40 backdrop-blur-sm"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Editor-like interface */}
      <div className="flex h-full">
        {/* Side panel (similar to settings panel in editor) */}
        <div className="w-[100px] h-full border-r border-foreground/10 bg-background/60 flex flex-col items-center py-4">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-12 h-12 mb-3 rounded-md flex items-center justify-center cursor-pointer transition-all
                ${index === currentIndex ? "bg-primary/20 border border-primary/30" : "hover:bg-foreground/10"}`}
            >
              {feature.icon}
            </div>
          ))}
        </div>

        {/* Main content area (similar to preview panel in editor) */}
        <div className="flex-1 relative">
          <div className="absolute top-0 left-0 right-0 h-10 border-b border-foreground/10 bg-background/60 flex items-center px-4">
            <div className="text-sm font-medium text-foreground/70">{features[currentIndex]?.title}</div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="absolute inset-0 pt-10 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="pl-4 pt-2">
                <h3 className="text-lg font-medium text-foreground/90">{features[currentIndex]?.title}</h3>
                <p className="text-sm text-foreground/70">{features[currentIndex]?.description}</p>
              </div>
              <div className="flex-1 flex items-center justify-center ">{features[currentIndex]?.content}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation arrows */}
      <Button
        onClick={prevSlide}
        className="absolute left-[110px] bottom-4 rounded-sm p-1 h-7 w-7 bg-background/80 hover:bg-background text-foreground/70 border border-foreground/10 z-10"
        aria-label="Previous feature"
        variant="ghost"
        size="sm"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        onClick={nextSlide}
        className="absolute left-[150px] bottom-4 rounded-sm p-1 h-7 w-7 bg-background/80 hover:bg-background text-foreground/70 border border-foreground/10 z-10"
        aria-label="Next feature"
        variant="ghost"
        size="sm"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default EditorPreview;
