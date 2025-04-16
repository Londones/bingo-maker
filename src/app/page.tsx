"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleCreateBingo = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push("/editor");
    }, 500); // Match this with the exit animation duration
  };

  return (
    <AnimatePresence mode="wait">
      {!isTransitioning && (
        <motion.div
          className="min-h-[80vh] flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-6">
            <motion.div
              className="relative inline-block"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h1
                className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsla(339,100%,55%,1)] to-[hsla(197,100%,64%,1)]"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Starfire
              </motion.h1>
              <div className="absolute -inset-1 rounded-lg blur-xl bg-gradient-to-r from-[hsla(339,100%,55%,0.2)] to-[hsla(197,100%,64%,0.2)] -z-10"></div>
            </motion.div>

            <motion.p
              className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Create entirely customizable bingo cards for any occasion, event, or watch party
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex justify-center"
            >
              <HoverBorderGradient as="div" className="text-lg font-medium" containerClassName="mt-8" duration={2}>
                <Button
                  onClick={handleCreateBingo}
                  className="hover:bg-transparent bg-transparent text-white hover:text-white rounded-full text-lg px-8 py-6"
                >
                  Create Your Bingo
                </Button>
              </HoverBorderGradient>
            </motion.div>
          </div>

          {/* Features Section */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10 p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[hsla(339,100%,55%,0.7)] to-[hsla(339,100%,55%,0.2)] flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-6 h-6 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Custom Grids</h3>
              <p className="text-foreground/70">Choose different grid sizes and customize each cell individually</p>
            </div>

            <div className="rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10 p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[hsla(270,100%,65%,0.7)] to-[hsla(270,100%,65%,0.2)] flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-6 h-6 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Beautiful Backgrounds</h3>
              <p className="text-foreground/70">Create stunning gradients or upload your own images as backgrounds</p>
            </div>

            <div className="rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10 p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[hsla(197,100%,64%,0.7)] to-[hsla(197,100%,64%,0.2)] flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-6 h-6 text-white"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Share With Friends</h3>
              <p className="text-foreground/70">Save and share your creations with a simple link</p>
            </div>
          </motion.div>

          {/* Recent Bingos Section */}
          <motion.div
            className="w-full mt-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Recent Creations</h2>
            <p className="text-center text-foreground/70 mb-8">
              Join us and start creating your own customized bingo cards today!
            </p>

            <div className="flex justify-center">
              <HoverBorderGradient as="div" className="text-md font-medium" containerClassName="" duration={2}>
                <Button
                  onClick={handleCreateBingo}
                  className="bg-transparent text-white hover:text-white rounded-full px-6 py-4"
                >
                  Start Creating Now
                </Button>
              </HoverBorderGradient>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
