"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { motion, AnimatePresence } from "framer-motion";
import LatestBingoList from "@/components/latest-bingo-list";
import EditorPreview from "@/components/editor-preview";
import { BingoPreview, LatestBingosResponse } from "@/types/types";

// Component to fetch and display latest bingos
const LatestBingosSection = () => {
  const [initialBingos, setInitialBingos] = useState<BingoPreview[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial bingos when component mounts
    const fetchInitialBingos = async () => {
      try {
        const response = await fetch(`/api/bingo/latest?limit=6&status=published`);

        if (!response.ok) {
          throw new Error("Failed to fetch bingos");
        }

        const data: LatestBingosResponse = await response.json();
        setInitialBingos(data.items || []);
        setHasMore(data.hasMore || false);
        setNextCursor(data.nextCursor);
      } catch (error) {
        console.error("Error fetching initial bingos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchInitialBingos();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <LatestBingoList
        initialBingos={initialBingos}
        initialHasMore={hasMore}
        initialCursor={nextCursor}
        options={{
          status: "published",
          limit: 6,
        }}
      />
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    // Create a bouncy effect for the title
    const interval = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
          <div className="mb-8 relative">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              <div className="lg:w-1/2 text-center lg:text-left lg:pt-10">
                <motion.div
                  className="relative inline-block"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: bounce ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.h1
                    className="text-5xl md:text-7xl font-bold text-foreground relative inline-block"
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    Starfire
                    <span className="relative inline-block ml-1 animate-bounce">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-8 h-8 text-primary"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </motion.h1>
                </motion.div>

                <motion.p
                  className="text-xl md:text-2xl text-foreground/80 mt-4 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  Create customizable bingo cards for game nights, watch parties, or any event.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex lg:justify-start justify-center"
                >
                  <HoverBorderGradient as="div" className="text-lg font-medium" containerClassName="mt-4" duration={2}>
                    <Button
                      onClick={handleCreateBingo}
                      className="hover:bg-transparent bg-transparent text-white hover:text-white rounded-full text-lg px-8 py-6"
                    >
                      Create your bingo
                    </Button>
                  </HoverBorderGradient>
                </motion.div>
              </div>

              {/* Editor preview on the right side */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="lg:w-1/2 w-full"
              >
                <EditorPreview />
              </motion.div>
            </div>
          </div>

          {/* Features Section */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {/* Feature Card 1 */}
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              className="rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm border border-pink-500/20 p-6 shadow-lg transition-all duration-300"
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[hsla(339,100%,65%,0.7)] to-[hsla(339,100%,45%,0.6)] flex items-center justify-center mb-4 shadow-lg transform -rotate-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-8 h-8 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                Custom Grids
              </h3>
              <p className="text-foreground/80">
                Choose from differents layouts! Design each cell just how you want it.
              </p>
            </motion.div>

            {/* Feature Card 2 */}
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-400/10 backdrop-blur-sm border border-blue-500/20 p-6 shadow-lg transition-all duration-300"
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[hsla(210,100%,65%,0.7)] to-[hsla(210,100%,45%,0.6)] flex items-center justify-center mb-4 shadow-lg transform rotate-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-8 h-8 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                Amazing Backgrounds
              </h3>
              <p className="text-foreground/80">
                Create colorful gradients or upload your own images! Let your creativity shine.
              </p>
            </motion.div>

            {/* Feature Card 3 */}
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 p-6 shadow-lg transition-all duration-300"
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[hsla(150,100%,50%,0.7)] to-[hsla(150,100%,35%,0.6)] flex items-center justify-center mb-4 shadow-lg transform -rotate-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-8 h-8 text-white"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
                Shareable Fun
              </h3>
              <p className="text-foreground/80">
                Instantly share with friends! Perfect for game nights, movie bingo, or any party.
              </p>
            </motion.div>
          </motion.div>

          {/* Recent Bingos Section with playful design */}
          <motion.div
            className="w-full mt-20 relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            {/* Decorative elements */}
            <div className="absolute -top-10 left-10 w-20 h-20 rounded-full bg-pink-400/10 blur-xl"></div>
            <div className="absolute -bottom-10 right-10 w-32 h-32 rounded-full bg-blue-400/10 blur-xl"></div>
            <div className="absolute top-1/2 left-1/4 w-4 h-4 rounded-full bg-yellow-400/80 animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-3 h-3 rounded-full bg-green-400/80 animate-pulse"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-1 w-10 bg-gradient-to-r from-pink-500 to-transparent rounded-full"></div>
                <h2 className="text-3xl font-extrabold text-center relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500">
                    Recent Creations
                  </span>
                  <motion.span
                    className="absolute -top-6 -right-6"
                    animate={{
                      rotate: [0, 10, -10, 0],
                      y: [0, -2, 2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                  >
                    ✨
                  </motion.span>
                </h2>
                <div className="h-1 w-10 bg-gradient-to-l from-purple-500 to-transparent rounded-full"></div>
              </div>

              <p className="text-center text-foreground/70 mb-8 max-w-2xl mx-auto">
                Check out what others have made and published!
              </p>

              <LatestBingosSection />

              <motion.div className="flex justify-center mt-10" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <HoverBorderGradient as="div" className="text-md font-medium" containerClassName="" duration={2}>
                  <Button
                    onClick={handleCreateBingo}
                    className="bg-transparent text-white hover:text-white hover:bg-transparent rounded-full px-8 py-4 text-lg"
                  >
                    Start Creating Now
                  </Button>
                </HoverBorderGradient>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
