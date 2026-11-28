"use client";

import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Check, ArrowUpRight } from "lucide-react";
import { BingoPreview, RadialGradientStop } from "@/types/types";
import { deserializeGradientConfig } from "@/lib/utils";
import { motion } from "framer-motion";

type BingoPreviewCardProps = {
  bingo: BingoPreview;
  type: "preview" | "user";
};

export function getPreviewGradientStyle(bingo: Pick<BingoPreview, "background">): React.CSSProperties {
  if (!bingo.background?.value) {
    return {
      backgroundColor: "#161024",
      backgroundImage:
        "radial-gradient(at 15% 15%, rgba(244, 114, 182, 0.55) 0px, transparent 55%), radial-gradient(at 80% 85%, rgba(129, 140, 248, 0.55) 0px, transparent 55%)",
    };
  }

  try {
    const config = deserializeGradientConfig(bingo.background.value);
    const stopToGradient = (stop: RadialGradientStop) =>
      `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`;
    return {
      backgroundColor: config.backgroundColor,
      backgroundImage: config.stops.map(stopToGradient).join(", "),
    };
  } catch {
    return { backgroundColor: "#161024" };
  }
}

export function getPreviewBgImageStyle(bingo: Pick<BingoPreview, "background">): React.CSSProperties {
  if (!bingo.background?.backgroundImage) return {};
  return {
    backgroundImage: `url(${bingo.background.backgroundImage})`,
    backgroundSize: bingo.background.backgroundImageSize ? `${bingo.background.backgroundImageSize}%` : "cover",
    backgroundPosition: bingo.background.backgroundImagePosition || "center",
    opacity: (bingo.background.backgroundImageOpacity ?? 100) / 100,
    backgroundRepeat: "no-repeat",
  };
}

const BingoPreviewCard = ({ bingo, type }: BingoPreviewCardProps) => {
  const link = type === "preview" ? `/bingo/${bingo.id}` : `/editor/${bingo.id}`;
  const gridSize = bingo.gridSize ?? 3;
  const cells = bingo.cells ?? [];
  const totalCells = gridSize * gridSize;
  const stampedCount = cells.filter((c) => c.validated).length;

  const displayCells =
    cells.length > 0
      ? cells.slice(0, totalCells)
      : Array.from({ length: totalCells }, (_, position) => ({ position, content: "", validated: false }));

  return (
    <Link href={link} scroll={false} className="w-full block group">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
        className="rounded-2xl overflow-hidden border border-border/80 bg-card/80 backdrop-blur-md shadow-sm hover:shadow-xl hover:border-foreground/25 transition-all"
      >
        {/* Mini Live Board Surface */}
        <div className="h-52 relative overflow-hidden p-4 flex flex-col justify-between">
          <div className="absolute inset-0 z-0" style={getPreviewGradientStyle(bingo)} />
          {bingo.background?.backgroundImage && (
            <div className="absolute inset-0 z-10" style={getPreviewBgImageStyle(bingo)} />
          )}
          <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/15 via-black/10 to-black/65 group-hover:to-black/75 transition-colors" />

          {/* Top mini-meta */}
          <div className="relative z-30 flex items-center justify-between text-[11px] font-mono text-white/85">
            <span className="bg-black/35 backdrop-blur-sm border border-white/15 rounded-md px-2 py-0.5">
              {gridSize}x{gridSize}
            </span>
            {stampedCount > 0 && (
              <span className="bg-black/35 backdrop-blur-sm border border-white/15 rounded-md px-2 py-0.5">
                {stampedCount}/{totalCells}
              </span>
            )}
          </div>

          {/* Live Miniature Grid */}
          <div className="relative z-30 flex-1 flex items-center justify-center my-2">
            <div
              className="grid gap-1 w-[112px] aspect-square transition-transform duration-300 group-hover:scale-105"
              style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
              {displayCells.map((cell) => (
                <div
                  key={cell.position}
                  className={`rounded-[4px] border flex items-center justify-center overflow-hidden ${
                    cell.validated
                      ? "bg-pink-400/90 border-white/60 text-zinc-950"
                      : "bg-black/30 border-white/20 backdrop-blur-sm"
                  }`}
                >
                  {cell.validated && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
              ))}
            </div>
          </div>

          {/* Card Title */}
          <div className="relative z-30 flex items-end justify-between gap-2">
            <h3 className="text-white font-semibold text-base truncate">{bingo.title}</h3>
            <ArrowUpRight className="h-4 w-4 text-white/75 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          </div>
        </div>

        {/* Clean Footer */}
        <div className="px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between border-t border-border/60">
          <span>{formatDistanceToNow(new Date(bingo.createdAt))} ago</span>
          <span className="font-medium text-foreground/80 group-hover:text-pink-500 transition-colors">
            {type === "preview" ? "Open board" : "Edit board"}
          </span>
        </div>
      </motion.div>
    </Link>
  );
};

export default BingoPreviewCard;
