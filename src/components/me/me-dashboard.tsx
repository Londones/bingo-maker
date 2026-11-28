"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { BingoPreview, BingoPreviewCell } from "@/types/types";
import { ITEMS_PER_PAGE } from "@/utils/constants";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import { useEditorRoutePersistence } from "@/hooks/useEditorRoutePersistence";
import { getPreviewBgImageStyle, getPreviewGradientStyle } from "@/components/bingo-preview-card";
import SignOutButton from "@/components/sign-out-button";
import MigrationToast from "@/components/migration-toast";

type StatusFilter = "all" | "published" | "draft";

const STAMP_TILTS = [-9, 7, -5, 8, -4, 9, -7, 6, -6, 5, -8, 4];
const DECK_VISIBLE_CARDS = 4;

function hexToRgba(color: string | undefined, opacityPct: number | undefined, fallback: string): string {
  const alpha = Math.max(0, Math.min(100, opacityPct ?? 35)) / 100;
  if (!color) return fallback;
  const trimmed = color.trim();
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
  }
  return fallback;
}

function getNormalizedCells(bingo: BingoPreview): BingoPreviewCell[] {
  const gridSize = bingo.gridSize ?? 3;
  const total = gridSize * gridSize;
  const existing = bingo.cells ?? [];
  if (existing.length >= total) {
    return existing.slice(0, total);
  }
  const byPos = new Map(existing.map((c) => [c.position, c]));
  return Array.from({ length: total }, (_, position) => {
    const found = byPos.get(position);
    return found ?? { position, content: "", validated: false };
  });
}

function BoardStampMark({
  stamp,
  tilt,
  compact = false,
}: {
  stamp: BingoPreview["stamp"];
  tilt: number;
  compact?: boolean;
}) {
  if (stamp?.type === "image" && stamp.value) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={stamp.value}
        alt=""
        style={{ transform: `rotate(${tilt}deg)` }}
        className={`pointer-events-none select-none object-contain drop-shadow-md ${
          compact ? "h-5 w-5" : "h-8 w-8 sm:h-10 sm:w-10"
        }`}
      />
    );
  }

  if (stamp?.type === "text" && stamp.value.trim().length > 0) {
    return (
      <span
        style={{ transform: `rotate(${tilt}deg)` }}
        className={`pointer-events-none select-none font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] ${
          compact ? "text-xs" : "text-lg sm:text-2xl"
        }`}
      >
        {stamp.value}
      </span>
    );
  }

  return (
    <span
      style={{ transform: `rotate(${tilt}deg)` }}
      className={`pointer-events-none select-none rounded-lg bg-pink-400 text-zinc-950 flex items-center justify-center shadow-md ${
        compact ? "h-5 w-5" : "h-8 w-8 sm:h-9 sm:w-9"
      }`}
    >
      <Check className={compact ? "h-3 w-3 stroke-[3]" : "h-4 w-4 sm:h-5 sm:w-5 stroke-[3]"} />
    </span>
  );
}

function AuthenticBoardCanvas({ bingo }: { bingo: BingoPreview }) {
  const gridSize = bingo.gridSize ?? 3;
  const cells = getNormalizedCells(bingo);
  const is5x5 = gridSize >= 5;

  const cellBg = hexToRgba(
    bingo.style?.cellBackgroundColor,
    bingo.style?.cellBackgroundOpacity,
    "rgba(10, 10, 14, 0.42)"
  );
  const cellBorder = bingo.style?.cellBorderColor || "rgba(255, 255, 255, 0.22)";
  const textColor = bingo.style?.color || "#ffffff";
  const fontFamily = bingo.style?.fontFamily || undefined;

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col p-5 sm:p-6" style={{ fontFamily }}>
      {/* Real Board Mesh Gradient & Image */}
      <div className="absolute inset-0 z-0" style={getPreviewGradientStyle(bingo)} />
      {bingo.background?.backgroundImage && (
        <div className="absolute inset-0 z-10" style={getPreviewBgImageStyle(bingo)} />
      )}
      <div className="absolute inset-0 z-10 bg-black/15" />

      {/* Board Title Header */}
      <div className="relative z-20 flex items-center justify-between gap-2 mb-3">
        <h3
          className="font-bold tracking-tight truncate drop-shadow-sm text-lg sm:text-xl"
          style={{ color: textColor }}
        >
          {bingo.title}
        </h3>
        <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/40 border border-white/15 text-white/90">
          {gridSize}x{gridSize}
        </span>
      </div>

      {/* Real Cells Grid */}
      <div
        className={`relative z-20 flex-1 grid ${is5x5 ? "gap-1" : "gap-2.5"}`}
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, idx) => {
          const tilt = STAMP_TILTS[idx % STAMP_TILTS.length] ?? 0;
          const label = cell.content.trim();

          return (
            <div
              key={cell.position}
              style={{
                backgroundColor: cellBg,
                borderColor: cellBorder,
                color: textColor,
              }}
              className={`relative border backdrop-blur-[2px] flex items-center justify-center text-center overflow-hidden ${
                is5x5 ? "rounded-[5px] p-0.5" : "rounded-xl p-2"
              }`}
            >
              {label && (
                <span
                  className={`leading-tight break-words line-clamp-3 select-none ${
                    cell.validated ? "opacity-35" : "opacity-95"
                  } ${is5x5 ? "text-[9px] sm:text-[10px]" : "text-xs sm:text-[13px] font-medium"}`}
                >
                  {label}
                </span>
              )}

              {cell.validated && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BoardStampMark stamp={bingo.stamp} tilt={tilt} compact={is5x5} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CopyBoardLinkButton({ bingoId, className = "" }: { bingoId: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/bingo/${bingoId}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Link copied" : "Copy share link"}
      className={className}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
      <span>{copied ? "Copied" : "Copy link"}</span>
    </button>
  );
}

interface MeDashboardProps {
  initialBingos: BingoPreview[];
  initialPage: number;
  initialTotalPages: number;
  totalCount: number;
  publishedCount: number;
  draftCount: number;
  userId: string;
  userName?: string | null;
  migratedCount: number;
}

export default function MeDashboard({
  initialBingos,
  initialPage,
  initialTotalPages,
  totalCount,
  publishedCount,
  draftCount,
  userId,
  userName,
  migratedCount,
}: MeDashboardProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [trayPage, setTrayPage] = useState(initialPage);
  const [pagesByFilter, setPagesByFilter] = useState<Record<StatusFilter, Record<number, BingoPreview[]>>>(() => ({
    all: { [initialPage]: initialBingos },
    published: {},
    draft: {},
  }));
  const [totalPagesByFilter, setTotalPagesByFilter] = useState<Record<StatusFilter, number>>(() => ({
    all: Math.max(1, initialTotalPages),
    published: Math.max(1, Math.ceil(publishedCount / ITEMS_PER_PAGE)),
    draft: Math.max(1, Math.ceil(draftCount / ITEMS_PER_PAGE)),
  }));
  const [activeDeckId, setActiveDeckId] = useState<string | null>(() => initialBingos[0]?.id ?? null);
  const [wipBingo, setWipBingo] = useState<BingoPreview | undefined>(undefined);

  const { loadEditorState } = useEditorRoutePersistence();
  const { useGetUserBingos } = useBingoStorage();

  useEffect(() => {
    const state = loadEditorState();
    if (state && !state.id) {
      setWipBingo({
        id: "",
        title: state.title,
        status: "draft",
        gridSize: state.gridSize,
        style: state.style,
        stamp: state.stamp,
        cells: state.cells?.map((c) => ({
          position: c.position,
          content: c.content,
          validated: c.validated,
        })),
        background: state.background,
        createdAt: new Date(Date.now()),
      });
    }
  }, [loadEditorState]);

  const currentPagesMap = pagesByFilter[filter];
  const currentTotalPages = totalPagesByFilter[filter];
  const apiStatus = filter === "all" ? undefined : filter;

  // Ordered flat list of all currently loaded boards for this filter (used by the Deck)
  const loadedBingos = useMemo(() => {
    const pageNumbers = Object.keys(currentPagesMap)
      .map(Number)
      .sort((a, b) => a - b);
    const seen = new Set<string>();
    const list: BingoPreview[] = [];
    for (const num of pageNumbers) {
      const items = currentPagesMap[num] ?? [];
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }
    return list;
  }, [currentPagesMap]);

  const activeDeckIndex = useMemo(() => {
    if (loadedBingos.length === 0) return 0;
    if (!activeDeckId) return 0;
    const found = loadedBingos.findIndex((b) => b.id === activeDeckId);
    return found >= 0 ? found : 0;
  }, [loadedBingos, activeDeckId]);

  const activeDeckBingo = loadedBingos[activeDeckIndex];

  // Ensure activeDeckId stays in sync when switching filters or after a page loads
  useEffect(() => {
    if (loadedBingos.length === 0) {
      setActiveDeckId(null);
      return;
    }
    if (!activeDeckId || !loadedBingos.some((b) => b.id === activeDeckId)) {
      setActiveDeckId(loadedBingos[0]?.id ?? null);
    }
  }, [loadedBingos, activeDeckId]);

  // 1) Fetch the currently viewed tray page if not cached yet
  const needsTrayPage = !currentPagesMap[trayPage];
  const trayQuery = useGetUserBingos(needsTrayPage, {
    page: trayPage,
    userId,
    status: apiStatus,
  });

  useEffect(() => {
    if (trayQuery.data) {
      setPagesByFilter((prev) => ({
        ...prev,
        [filter]: {
          ...prev[filter],
          [trayPage]: trayQuery.data.bingos,
        },
      }));
      setTotalPagesByFilter((prev) => ({
        ...prev,
        [filter]: Math.max(1, trayQuery.data.totalPages),
      }));
    }
  }, [trayQuery.data, filter, trayPage]);

  // 2) Dynamic Deck prefetch: when stepping within 2 cards of the end of loaded boards,
  //    automatically fetch the next unloaded sequential page (batch of 8) in the background.
  const nextSequentialPage = useMemo(() => {
    for (let p = 1; p <= currentTotalPages; p++) {
      if (!currentPagesMap[p]) return p;
    }
    return null;
  }, [currentPagesMap, currentTotalPages]);

  const shouldPrefetchNextForDeck =
    !needsTrayPage &&
    nextSequentialPage !== null &&
    loadedBingos.length > 0 &&
    activeDeckIndex >= loadedBingos.length - 2;

  const prefetchQuery = useGetUserBingos(shouldPrefetchNextForDeck, {
    page: nextSequentialPage ?? 1,
    userId,
    status: apiStatus,
  });

  useEffect(() => {
    if (prefetchQuery.data && nextSequentialPage !== null) {
      setPagesByFilter((prev) => ({
        ...prev,
        [filter]: {
          ...prev[filter],
          [nextSequentialPage]: prefetchQuery.data.bingos,
        },
      }));
      setTotalPagesByFilter((prev) => ({
        ...prev,
        [filter]: Math.max(1, prefetchQuery.data.totalPages),
      }));
    }
  }, [prefetchQuery.data, filter, nextSequentialPage]);

  const handleFilterChange = (nextFilter: StatusFilter) => {
    setFilter(nextFilter);
    setTrayPage(1);
    const firstLoaded = pagesByFilter[nextFilter][1]?.[0]?.id ?? null;
    setActiveDeckId(firstLoaded);
  };

  const cycleDeck = (dir: 1 | -1) => {
    if (loadedBingos.length <= 1) return;
    const nextIdx = (activeDeckIndex + dir + loadedBingos.length) % loadedBingos.length;
    const target = loadedBingos[nextIdx];
    if (target) {
      setActiveDeckId(target.id);
    }
  };

  const shuffleDeck = () => {
    if (loadedBingos.length <= 1) return;
    let nextIdx = activeDeckIndex;
    while (nextIdx === activeDeckIndex) {
      nextIdx = Math.floor(Math.random() * loadedBingos.length);
    }
    const target = loadedBingos[nextIdx];
    if (target) {
      setActiveDeckId(target.id);
    }
  };

  // Only mount up to 4 cards in the Deck DOM at any time
  const visibleDeckCards = useMemo(() => {
    if (loadedBingos.length === 0) return [];
    const maxVisible = Math.min(DECK_VISIBLE_CARDS, loadedBingos.length);
    const result: { bingo: BingoPreview; offset: number }[] = [];
    for (let offset = 0; offset < maxVisible; offset++) {
      const idx = (activeDeckIndex + offset) % loadedBingos.length;
      const item = loadedBingos[idx];
      if (item) {
        result.push({ bingo: item, offset });
      }
    }
    return result;
  }, [loadedBingos, activeDeckIndex]);

  const currentTrayBingos = currentPagesMap[trayPage] ?? [];
  const displayName = userName?.trim() || "Your";
  const isFetchingMoreForDeck = prefetchQuery.isFetching;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-2 pb-16 space-y-10">
      <MigrationToast count={migratedCount} />

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {userName ? `${displayName}'s deck` : "Your deck"}
        </h1>

        <div className="flex items-center gap-2.5">
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 shadow-[0_3px_0_0_rgba(190,24,93,0.75)] hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
          >
            <Plus className="h-4 w-4" />
            <span>New board</span>
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Interactive Fanned Stack of Your Actual Boards */}
      {activeDeckBingo ? (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center py-2">
          {/* Left Spotlight Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span
                className={`px-2 py-0.5 rounded-md border ${
                  activeDeckBingo.status === "published"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 dark:text-emerald-300"
                    : "border-border bg-muted/60 text-muted-foreground"
                }`}
              >
                {activeDeckBingo.status === "published" ? "Published" : "Draft"}
              </span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight break-words">
                {activeDeckBingo.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Created {formatDistanceToNow(new Date(activeDeckBingo.createdAt))} ago ·{" "}
                {activeDeckBingo.gridSize ?? 3}x{activeDeckBingo.gridSize ?? 3} grid
              </p>
            </div>

            {/* Progress Bar for Selected Card */}
            {(() => {
              const total = (activeDeckBingo.gridSize ?? 3) ** 2;
              const stamped = (activeDeckBingo.cells ?? []).filter((c) => c.validated).length;
              const pct = Math.round((stamped / total) * 100);
              return (
                <div className="space-y-1.5 max-w-sm">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>
                      {stamped} / {total} stamped
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-md bg-muted overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Link
                href={`/editor/${activeDeckBingo.id}`}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 shadow-[0_4px_0_0_rgba(190,24,93,0.75)] hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit board</span>
              </Link>
              <Link
                href={`/bingo/${activeDeckBingo.id}`}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-medium border border-border bg-card/80 hover:bg-muted shadow-[0_3px_0_0_hsl(var(--border))] text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open</span>
              </Link>
              <CopyBoardLinkButton
                bingoId={activeDeckBingo.id}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-medium border border-border bg-card/80 hover:bg-muted shadow-[0_3px_0_0_hsl(var(--border))] text-foreground transition-colors"
              />
            </div>

            {/* Deck Navigation */}
            {loadedBingos.length > 1 && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => cycleDeck(-1)}
                  aria-label="Previous board"
                  className="h-10 w-10 rounded-xl border border-border bg-card/80 hover:bg-muted shadow-[0_3px_0_0_hsl(var(--border))] flex items-center justify-center text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => cycleDeck(1)}
                  aria-label="Next board"
                  className="h-10 px-4 rounded-xl border border-border bg-card/80 hover:bg-muted shadow-[0_3px_0_0_hsl(var(--border))] flex items-center gap-1.5 text-xs font-semibold text-foreground transition-colors"
                >
                  <span>Next card</span>
                  {isFetchingMoreForDeck ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={shuffleDeck}
                  aria-label="Pick random board"
                  className="h-10 px-3.5 rounded-xl border border-border bg-card/80 hover:bg-muted shadow-[0_3px_0_0_hsl(var(--border))] flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span>Random</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Fanned Real Board Stack (windowed to 4 mounted cards) */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[460px] aspect-square mx-4 sm:mx-8 lg:mx-0">
              {visibleDeckCards.map(({ bingo, offset }) => {
                const isFront = offset === 0;
                const rotate = offset === 0 ? -1 : offset === 1 ? 5 : offset === 2 ? -6 : 9;
                const x = offset === 0 ? 0 : offset === 1 ? 28 : offset === 2 ? -24 : 42;
                const y = offset === 0 ? 0 : offset === 1 ? 12 : offset === 2 ? 20 : 26;
                const scale = 1 - offset * 0.055;
                const zIndex = visibleDeckCards.length - offset;

                return (
                  <motion.div
                    key={bingo.id}
                    animate={{
                      rotate,
                      x,
                      y,
                      scale,
                      opacity: isFront ? 1 : Math.max(0.55, 0.85 - offset * 0.12),
                    }}
                    whileHover={isFront ? { y: -4 } : { scale: scale + 0.02, opacity: 0.96 }}
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                    style={{ zIndex }}
                    onClick={() => {
                      if (!isFront) setActiveDeckId(bingo.id);
                    }}
                    className={`absolute inset-0 rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-black/30 ${
                      isFront ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <AuthenticBoardCanvas bingo={bingo} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      ) : trayQuery.isFetching ? (
        <div className="rounded-2xl border border-border/70 bg-card/40 p-12 flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading boards...</span>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-10 text-center space-y-3">
          <div className="text-lg font-semibold text-foreground">
            {filter === "all" ? "No boards yet" : `No ${filter} boards`}
          </div>
          <p className="text-sm text-muted-foreground">
            {filter === "all"
              ? "Start a fresh board in the editor to build your deck."
              : "Switch filters below or create a new board in the editor."}
          </p>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400"
          >
            <Plus className="h-4 w-4" />
            <span>Make a board</span>
          </Link>
        </div>
      )}

      {/* Bottom Board Tray (8 cards per page) */}
      <section className="space-y-4 pt-4 border-t border-border/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/60">
            {(["all", "published", "draft"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleFilterChange(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "all"
                  ? `All (${totalCount})`
                  : tab === "published"
                    ? `Published (${publishedCount})`
                    : `Drafts (${draftCount})`}
              </button>
            ))}
          </div>

          {wipBingo && (
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-pink-500/40 bg-pink-500/10 text-xs font-medium text-foreground hover:bg-pink-500/20 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-pink-500" />
              <span>Resume unsaved draft: {wipBingo.title}</span>
            </Link>
          )}
        </div>

        {/* 8-Card Grid */}
        {needsTrayPage && trayQuery.isFetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
              <div
                key={idx}
                className="h-[66px] rounded-xl border border-border/60 bg-card/40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {currentTrayBingos.map((bingo) => {
              const isSelected = bingo.id === activeDeckBingo?.id;
              const total = (bingo.gridSize ?? 3) ** 2;
              const stamped = (bingo.cells ?? []).filter((c) => c.validated).length;

              return (
                <button
                  key={bingo.id}
                  type="button"
                  onClick={() => setActiveDeckId(bingo.id)}
                  className={`group text-left rounded-xl border p-2.5 flex items-center gap-3 transition-all ${
                    isSelected
                      ? "border-pink-500/80 bg-card shadow-md ring-1 ring-pink-500/30"
                      : "border-border/80 bg-card/60 hover:bg-card hover:border-foreground/30"
                  }`}
                >
                  <div
                    className="h-11 w-11 rounded-lg shrink-0 border border-white/15 relative overflow-hidden"
                    style={getPreviewGradientStyle(bingo)}
                  >
                    {bingo.background?.backgroundImage && (
                      <div className="absolute inset-0" style={getPreviewBgImageStyle(bingo)} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground truncate">{bingo.title}</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span>
                        {bingo.gridSize ?? 3}x{bingo.gridSize ?? 3}
                      </span>
                      <span>·</span>
                      <span>
                        {stamped}/{total}
                      </span>
                      <span>·</span>
                      <span>{bingo.status === "published" ? "Published" : "Draft"}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tray Pagination Controls */}
        {currentTotalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-mono text-muted-foreground">
              Page {trayPage} of {currentTotalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={trayPage <= 1}
                onClick={() => setTrayPage((p) => Math.max(1, p - 1))}
                className="h-9 px-3 rounded-lg border border-border bg-card/80 hover:bg-muted disabled:opacity-40 disabled:pointer-events-none text-xs font-medium text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={trayPage >= currentTotalPages}
                onClick={() => setTrayPage((p) => Math.min(currentTotalPages, p + 1))}
                className="h-9 px-3 rounded-lg border border-border bg-card/80 hover:bg-muted disabled:opacity-40 disabled:pointer-events-none text-xs font-medium text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {(trayQuery.isError || prefetchQuery.isError) && (
          <div className="text-destructive text-sm text-center pt-2">
            Error loading boards. Please try again.
          </div>
        )}
      </section>
    </div>
  );
}
