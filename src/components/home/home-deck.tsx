"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Check, RotateCcw, Shuffle } from "lucide-react";
import { LatestBingosData, LatestBingosGrid } from "./latest-bingos-section";

interface HomeDeckProps {
  onCreateBingo: () => void;
  latestBingos: LatestBingosData;
}

interface SampleDeckCard {
  id: string;
  title: string;
  tag: string;
  bgStyle: React.CSSProperties;
  stampClass: string;
  winRingClass: string;
  cells: string[];
  defaultMarked: number[];
}

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const STAMP_TILTS = [-8, 6, -5, 7, -4, 8, -7, 5, -6];

const FIRST_DECK_CARD: SampleDeckCard = {
  id: "watch-party",
  title: "Movie Night",
  tag: "Watch party",
  bgStyle: {
    backgroundColor: "#161024",
    backgroundImage:
      "radial-gradient(at 15% 15%, rgba(244, 114, 182, 0.62) 0px, transparent 55%), radial-gradient(at 85% 25%, rgba(251, 146, 60, 0.45) 0px, transparent 50%), radial-gradient(at 75% 88%, rgba(129, 140, 248, 0.6) 0px, transparent 55%)",
  },
  stampClass: "bg-pink-400 text-zinc-950",
  winRingClass: "ring-2 ring-amber-300",
  cells: [
    "Bad CGI",
    "Phone goes off",
    "Wild plot hole",
    "Slow clap",
    "FREE",
    "Jump scare",
    "Walks away cool",
    "Sequel bait",
    "Post-credits",
  ],
  defaultMarked: [0, 4],
};

const DECK_CARDS: SampleDeckCard[] = [
  FIRST_DECK_CARD,
  {
    id: "road-trip",
    title: "Highway Bingo",
    tag: "Road trip",
    bgStyle: {
      backgroundColor: "#0d1b1a",
      backgroundImage:
        "radial-gradient(at 18% 20%, rgba(45, 212, 191, 0.58) 0px, transparent 55%), radial-gradient(at 82% 82%, rgba(250, 204, 21, 0.5) 0px, transparent 55%)",
    },
    stampClass: "bg-teal-300 text-zinc-950",
    winRingClass: "ring-2 ring-yellow-300",
    cells: [
      "Missed exit",
      "Gas station snacks",
      "Kayak on roof",
      "Toll booth",
      "FREE",
      "Neon diner sign",
      "Yellow car",
      "Aux cord debate",
      "Surprise detour",
    ],
    defaultMarked: [1, 4],
  },
  {
    id: "game-night",
    title: "Game Night",
    tag: "Friends",
    bgStyle: {
      backgroundColor: "#21110d",
      backgroundImage:
        "radial-gradient(at 20% 18%, rgba(251, 146, 60, 0.62) 0px, transparent 55%), radial-gradient(at 85% 80%, rgba(244, 63, 94, 0.55) 0px, transparent 55%)",
    },
    stampClass: "bg-amber-300 text-zinc-950",
    winRingClass: "ring-2 ring-orange-200",
    cells: [
      "Reads rules twice",
      "Dice hits floor",
      "Shady trade",
      "Made-up house rule",
      "FREE",
      "Terrible bluff",
      "Tie breaker",
      "Snack refill",
      "Demands rematch",
    ],
    defaultMarked: [2, 4],
  },
];

const PLAYFUL_HIGHLIGHTS = [
  {
    title: "Your grid, your rules",
    body: "Go 3x3 for a quick round or 5x5 for the full board. Drop text or photos into any square.",
    accentBar: "from-pink-500 to-orange-400",
    tilt: -0.6,
  },
  {
    title: "Make it look good",
    body: "Blend mesh gradients, throw on a background photo, and pick how your stamps look.",
    accentBar: "from-violet-500 to-sky-400",
    tilt: 0.4,
  },
  {
    title: "Drop it in the chat",
    body: "Hit publish for a shareable link. Stamp squares as you go and everyone watches it update live.",
    accentBar: "from-teal-400 to-emerald-400",
    tilt: -0.4,
  },
];

export default function HomeDeck({ onCreateBingo, latestBingos }: HomeDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [markedByCard, setMarkedByCard] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(DECK_CARDS.map((c) => [c.id, c.defaultMarked]))
  );

  const activeCard = DECK_CARDS[activeIndex] ?? FIRST_DECK_CARD;

  const activeWinningCells = useMemo(() => {
    const activeMarked = markedByCard[activeCard.id] ?? [];
    const win = new Set<number>();
    for (const line of WINNING_LINES) {
      if (line.every((idx) => activeMarked.includes(idx))) {
        line.forEach((idx) => win.add(idx));
      }
    }
    return win;
  }, [markedByCard, activeCard.id]);

  const cycleCard = (dir: 1 | -1) => {
    setActiveIndex((prev) => (prev + dir + DECK_CARDS.length) % DECK_CARDS.length);
  };

  const toggleCell = (cardId: string, cellIdx: number) => {
    setMarkedByCard((prev) => {
      const current = prev[cardId] ?? [];
      const next = current.includes(cellIdx) ? current.filter((i) => i !== cellIdx) : [...current, cellIdx];
      return { ...prev, [cardId]: next };
    });
  };

  const resetActiveCard = () => {
    setMarkedByCard((prev) => ({
      ...prev,
      [activeCard.id]: [4],
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-6 pb-24">
      {/* Hero with Bigger Interactive Fanned Deck */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center py-6 lg:py-12">
        <div className="lg:col-span-5 space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-foreground leading-[1.06]"
          >
            Turn any night into a bingo card.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md"
          >
            Build a board in a minute, mess with the colors and stamps, and send the link to your group chat.
          </motion.p>

          {/* Tactile Playful Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14 }}
            className="flex flex-wrap items-center gap-3.5 pt-1"
          >
            <motion.button
              type="button"
              onClick={onCreateBingo}
              whileHover={{ y: -2 }}
              whileTap={{ y: 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className="group relative inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl font-semibold text-base text-white bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 shadow-[0_4px_0_0_rgba(190,24,93,0.75)] hover:shadow-[0_6px_0_0_rgba(190,24,93,0.75)] active:shadow-[0_1px_0_0_rgba(190,24,93,0.75)] transition-shadow"
            >
              <span>Make a card</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>

            <motion.a
              href="#recent-boards"
              whileHover={{ y: -2 }}
              whileTap={{ y: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className="inline-flex items-center justify-center h-12 px-5 rounded-xl font-medium text-sm text-foreground border border-border bg-card/80 backdrop-blur-sm shadow-[0_3px_0_0_hsl(var(--border))] hover:bg-muted/60 transition-colors"
            >
              See what people made
            </motion.a>
          </motion.div>

          {/* Playful Deck Switcher Bar */}
          <div className="pt-5 flex items-center justify-between gap-4 max-w-sm">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Try clicking the board</div>
              <div className="text-sm font-semibold text-foreground truncate mt-0.5">
                {activeCard.title}
                {activeWinningCells.size > 0 && (
                  <span className="ml-2 text-pink-500 dark:text-pink-400 font-semibold">Bingo!</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
                onClick={resetActiveCard}
                aria-label="Reset current sample card"
                className="h-10 w-10 rounded-xl border border-border bg-card/80 hover:bg-muted shadow-[0_3px_0_0_hsl(var(--border))] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
                onClick={() => cycleCard(-1)}
                aria-label="Previous sample card"
                className="h-10 w-10 rounded-xl border border-border bg-card/80 hover:bg-muted shadow-[0_3px_0_0_hsl(var(--border))] flex items-center justify-center text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ y: 1 }}
                onClick={() => cycleCard(1)}
                aria-label="Next sample card"
                className="h-10 px-3.5 rounded-xl border border-border bg-card/80 hover:bg-muted shadow-[0_3px_0_0_hsl(var(--border))] flex items-center gap-1.5 text-xs font-semibold text-foreground transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bigger Interactive Fanned Card Stack */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[490px] h-[460px] sm:h-[520px] mx-6 sm:mx-8 lg:mx-0">
            {DECK_CARDS.map((card, idx) => {
              const offset = (idx - activeIndex + DECK_CARDS.length) % DECK_CARDS.length;
              const isFront = offset === 0;
              const marked = markedByCard[card.id] ?? [];

              const rotate = offset === 0 ? -1 : offset === 1 ? 6 : -7;
              const translateX = offset === 0 ? 0 : offset === 1 ? 34 : -28;
              const translateY = offset === 0 ? 0 : offset === 1 ? 16 : 24;
              const scale = offset === 0 ? 1 : offset === 1 ? 0.94 : 0.9;
              const zIndex = DECK_CARDS.length - offset;

              return (
                <motion.div
                  key={card.id}
                  animate={{
                    rotate,
                    x: translateX,
                    y: translateY,
                    scale,
                    opacity: isFront ? 1 : 0.78,
                  }}
                  whileHover={isFront ? undefined : { scale: scale + 0.02, opacity: 0.92 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  style={{ zIndex }}
                  onClick={() => {
                    if (!isFront) setActiveIndex(idx);
                  }}
                  className={`absolute inset-0 rounded-2xl border border-white/20 p-5 sm:p-6 shadow-2xl shadow-black/25 flex flex-col justify-between ${
                    isFront ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <div className="absolute inset-0 rounded-2xl overflow-hidden -z-10" style={card.bgStyle} />

                  {/* Card Header */}
                  <div className="flex items-start justify-between text-white">
                    <div>
                      <div className="text-lg sm:text-xl font-bold tracking-tight">{card.title}</div>
                      <div className="text-xs text-white/70 mt-0.5">{card.tag}</div>
                    </div>
                    <div className="text-xs font-mono text-white/80 bg-black/30 border border-white/15 rounded-lg px-2.5 py-1">
                      {marked.length} / 9
                    </div>
                  </div>

                  {/* 3x3 Playable Grid */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-4 flex-1">
                    {card.cells.map((cell, cellIdx) => {
                      const isMarked = marked.includes(cellIdx);
                      const isWin = isFront && activeWinningCells.has(cellIdx);
                      const tilt = STAMP_TILTS[cellIdx] ?? 0;

                      return (
                        <motion.button
                          key={cell}
                          type="button"
                          disabled={!isFront}
                          whileTap={isFront ? { scale: 0.93 } : undefined}
                          onClick={() => toggleCell(card.id, cellIdx)}
                          className={`relative rounded-xl border border-white/15 bg-black/30 backdrop-blur-sm p-2.5 flex items-center justify-center text-center text-white transition-colors ${
                            isFront ? "hover:bg-black/45" : ""
                          } ${isWin ? card.winRingClass : ""}`}
                        >
                          <span
                            className={`text-xs sm:text-sm font-medium leading-snug select-none transition-opacity ${
                              isMarked ? "opacity-35" : "opacity-95"
                            } ${cellIdx === 4 ? "font-mono tracking-widest uppercase text-xs" : ""}`}
                          >
                            {cell}
                          </span>

                          {isMarked && (
                            <motion.span
                              initial={{ scale: 0.25, rotate: tilt - 20, opacity: 0 }}
                              animate={{ scale: 1, rotate: tilt, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 460, damping: 20 }}
                              className={`absolute inset-0 m-auto h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shadow-lg ${card.stampClass}`}
                            >
                              <Check className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3]" />
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Card Footer */}
                  <div className="text-xs text-white/75 flex items-center justify-between">
                    <span>
                      {!isFront
                        ? "Click to pull to front"
                        : activeWinningCells.size > 0
                          ? "Bingo! Line complete."
                          : "Tap any square to stamp it"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleCard(1);
                      }}
                      className="inline-flex items-center gap-1.5 text-white/85 hover:text-white transition-colors"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      <span>Swap card</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Playful Tactile Feature Cards */}
      <section className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLAYFUL_HIGHLIGHTS.map((item) => (
          <motion.div
            key={item.title}
            whileHover={{ y: -4, rotate: item.tilt }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-6 shadow-sm"
          >
            <div className={`h-1.5 w-12 rounded-sm bg-gradient-to-r ${item.accentBar} mb-4`} />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{item.title}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.body}</p>
          </motion.div>
        ))}
      </section>

      {/* Recent Boards */}
      <section id="recent-boards" className="mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Recent boards</h2>
            <p className="text-sm text-muted-foreground mt-1">Fresh cards people have published.</p>
          </div>
        </div>

        <LatestBingosGrid data={latestBingos} />

        {/* Playful Bottom Callout */}
        <div className="mt-16 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">Got a funny idea for a board?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Open the editor and throw one together in a couple minutes.
            </p>
          </div>

          <motion.button
            type="button"
            onClick={onCreateBingo}
            whileHover={{ y: -2 }}
            whileTap={{ y: 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="group inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 shadow-[0_4px_0_0_rgba(190,24,93,0.75)] hover:shadow-[0_5px_0_0_rgba(190,24,93,0.75)] active:shadow-[0_1px_0_0_rgba(190,24,93,0.75)] transition-shadow shrink-0"
          >
            <span>Make a card</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </div>
      </section>
    </div>
  );
}
