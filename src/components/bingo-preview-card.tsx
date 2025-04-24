import React from "react";
import Link from "next/link";
import { Card, CardFooter } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { BingoPreview, RadialGradientStop } from "@/types/types";
import { deserializeGradientConfig } from "@/lib/utils";
import { motion } from "framer-motion";

type BingoPreviewCardProps = {
  bingo: BingoPreview;
  type: "preview" | "user";
};

const BingoPreviewCard = ({ bingo, type }: BingoPreviewCardProps) => {
  const link = type === "preview" ? `/bingo/${bingo.id}` : `/editor/${bingo.id}`;

  const getGradientBackground = () => {
    if (!bingo.background?.value) return {};

    try {
      const config = deserializeGradientConfig(bingo.background.value);
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

  // Handle background image if available
  const bgImageStyle = bingo.background?.backgroundImage
    ? {
        backgroundImage: `url(${bingo.background.backgroundImage})`,
        backgroundSize: `${bingo.background.backgroundImageSize}%` || "cover",
        backgroundPosition: bingo.background.backgroundImagePosition || "center",
        opacity: (bingo.background.backgroundImageOpacity ?? 100) / 100,
        backgroundRepeat: "no-repeat",
      }
    : {};

  return (
    <Link href={link} className="w-full block group">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.03] border border-gray-200/20">
        <div className="h-48 relative overflow-hidden">
          {/* Gradient background layer */}
          <div className="absolute inset-0 z-10" style={getGradientBackground()} />

          {/* Background image layer */}
          <motion.div
            className="absolute inset-0 z-20"
            style={bgImageStyle}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />

          {/* Gradient overlay - moves on hover */}
          <div
            className="absolute inset-0 z-30 bg-gradient-to-b from-transparent via-transparent to-black/80 
                         group-hover:bg-gradient-to-b group-hover:from-black/10 group-hover:via-transparent group-hover:to-black/90
                         transition-all duration-500"
          />

          {/* Title area with horizontal sliding effect */}
          <div className="absolute bottom-0 left-0 right-0 z-40 p-4 transform transition-transform duration-300">
            <h3 className="text-white font-medium text-xl truncate group-hover:text-primary-foreground">
              {bingo.title}
            </h3>
            <div className="w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-500 mt-1"></div>
          </div>
        </div>
        <CardFooter className="py-3 text-sm text-gray-500 flex justify-between items-center">
          <span>Created {formatDistanceToNow(new Date(bingo.createdAt))} ago</span>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="text-primary text-xs font-semibold"
          >
            Click to view →
          </motion.div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default BingoPreviewCard;
