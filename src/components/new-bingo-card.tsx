"use client";
import React from "react";
import Link from "next/link";
import { Card, CardFooter } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { BingoPreview, RadialGradientStop } from "@/types/types";
import { deserializeGradientConfig } from "@/lib/utils";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

type NewBingoCardProps = {
  wipBingo?: BingoPreview; // Optional WIP bingo data
};

const NewBingoCard = ({ wipBingo }: NewBingoCardProps) => {
  // Link to editor without ID for new bingo creation
  const link = wipBingo ? `/editor/${wipBingo.id}` : "/editor";

  // For WIP bingo, handle gradient background if available
  const getGradientBackground = () => {
    if (!wipBingo?.background?.value) return {};

    try {
      const config = deserializeGradientConfig(wipBingo.background.value);
      const stopToGradient = (stop: RadialGradientStop) => {
        return `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`;
      };
      const backgroundImage = config.stops.map(stopToGradient).join(", ");
      return {
        backgroundColor: config.backgroundColor,
        backgroundImage: backgroundImage,
      };
    } catch (e) {
      return {};
    }
  };

  // Handle background image if available for WIP bingo
  const bgImageStyle = wipBingo?.background?.backgroundImage
    ? {
        backgroundImage: `url(${wipBingo.background.backgroundImage})`,
        backgroundSize: `${wipBingo.background.backgroundImageSize}%` || "cover",
        backgroundPosition: wipBingo.background.backgroundImagePosition || "center",
        opacity: (wipBingo.background.backgroundImageOpacity ?? 100) / 100,
        backgroundRepeat: "no-repeat",
      }
    : {};

  // For completely new bingo (no WIP)
  const emptyCardGradient = {
    backgroundImage:
      "radial-gradient(at 50% 0%, hsla(343,100%,76%,0.5) 0px, transparent 50%), " +
      "radial-gradient(at 80% 50%, hsla(242,100%,70%,0.5) 0px, transparent 50%), " +
      "radial-gradient(at 0% 100%, hsla(22,100%,77%,0.5) 0px, transparent 50%)",
  };

  return (
    <Link href={link} className="w-full block group">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.03] border border-dashed border-gray-300/30">
        <div className="h-48 relative overflow-hidden">
          {/* Background layer - either WIP background or empty card gradient */}
          <div className="absolute inset-0 z-10" style={wipBingo ? getGradientBackground() : emptyCardGradient} />

          {/* Background image layer if WIP */}
          {wipBingo?.background?.backgroundImage && (
            <motion.div
              className="absolute inset-0 z-20"
              style={bgImageStyle}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            />
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 z-30 bg-gradient-to-b from-transparent via-transparent to-black/70 
                     group-hover:bg-gradient-to-b group-hover:from-black/10 group-hover:via-transparent group-hover:to-black/80
                     transition-all duration-500"
          />

          {/* Content area */}
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
            {!wipBingo ? (
              <motion.div
                className="flex flex-col items-center"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-full border-2 border-white/70 p-3 bg-black/30 backdrop-blur-sm">
                  <Plus size={36} className="text-white/90" />
                </div>
                <p className="text-white mt-3 font-medium text-lg">Create New Bingo</p>
              </motion.div>
            ) : (
              <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-yellow-200 text-xs uppercase tracking-wider">Draft</span>
                </div>
                <h3 className="text-white font-medium text-xl truncate group-hover:text-primary-foreground mt-1">
                  {wipBingo.title}
                </h3>
                <div className="w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-500 mt-1"></div>
              </div>
            )}
          </div>
        </div>
        <CardFooter className="py-3 text-sm text-gray-500 flex justify-between items-center">
          <span>
            {wipBingo ? `Updated ${formatDistanceToNow(new Date(wipBingo.createdAt))} ago` : "Start from scratch"}
          </span>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="text-primary text-xs font-semibold"
          >
            {wipBingo ? "Continue editing →" : "Get started →"}
          </motion.div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default NewBingoCard;
