"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Copy, Download, Loader, Pencil, Radio } from "lucide-react";
import { toast } from "sonner";
import BingoPreview from "@/components/bingo-preview";
import { exportBoardToPng } from "@/lib/export-bingo";
import { Bingo, BingoCell } from "@/types/types";

interface BingoViewProps {
  bingo: Bingo;
  isAuthor: boolean;
  onToggleCell: (cell: BingoCell) => void;
}

export default function BingoView({ bingo, isAuthor, onToggleCell }: BingoViewProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const { stampedCount, totalCells, completedLines } = useMemo(() => {
    const total = bingo.gridSize * bingo.gridSize;
    const stamped = bingo.cells.filter((c) => c?.validated).length;

    const patterns: number[][] = [
      ...Array.from({ length: bingo.gridSize }, (_, row) =>
        Array.from({ length: bingo.gridSize }, (_, col) => row * bingo.gridSize + col)
      ),
      ...Array.from({ length: bingo.gridSize }, (_, col) =>
        Array.from({ length: bingo.gridSize }, (_, row) => row * bingo.gridSize + col)
      ),
      Array.from({ length: bingo.gridSize }, (_, i) => i * bingo.gridSize + i),
      Array.from({ length: bingo.gridSize }, (_, i) => (i + 1) * bingo.gridSize - i - 1),
    ];

    let lineCount = 0;
    for (const pattern of patterns) {
      if (pattern.every((idx) => bingo.cells[idx]?.validated)) {
        lineCount += 1;
      }
    }

    return {
      stampedCount: stamped,
      totalCells: total,
      completedLines: lineCount,
    };
  }, [bingo.cells, bingo.gridSize]);

  const progressPct = totalCells > 0 ? Math.round((stampedCount / totalCells) * 100) : 0;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  const handleDownloadPng = useCallback(async () => {
    if (!boardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportBoardToPng(boardRef.current, bingo.title);
      toast.success("PNG downloaded");
    } catch (error) {
      console.error("Failed to export PNG:", error);
      toast.error("Failed to export PNG");
    } finally {
      setIsExporting(false);
    }
  }, [bingo.title, isExporting]);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-2 pb-16 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1.5">
            <Radio className="h-3.5 w-3.5 text-pink-500 animate-pulse" />
            <span>LIVE BOARD</span>
            <span>/</span>
            <span>
              {bingo.gridSize}x{bingo.gridSize}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{bingo.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-card/80 hover:bg-muted text-xs font-semibold text-foreground shadow-[0_3px_0_0_hsl(var(--border))] active:translate-y-[1px] transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy link"}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => void handleDownloadPng()}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-card/80 hover:bg-muted text-xs font-semibold text-foreground shadow-[0_3px_0_0_hsl(var(--border))] active:translate-y-[1px] transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>{isExporting ? "Exporting..." : "Save PNG"}</span>
          </button>

          {isAuthor && (
            <Link
              href={`/editor/${bingo.id}`}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 shadow-[0_3px_0_0_rgba(190,24,93,0.75)] active:translate-y-[1px] transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit board</span>
            </Link>
          )}
        </div>
      </div>

      {/* Progress Strip */}
      <div className="rounded-xl border border-border/80 bg-card/70 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-mono font-semibold text-foreground">
            {stampedCount} / {totalCells} stamped
          </span>
          {completedLines > 0 ? (
            <span className="font-semibold text-pink-500 dark:text-pink-400">
              {completedLines} {completedLines === 1 ? "bingo line!" : "bingo lines!"}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isAuthor ? "Click any square below to stamp it live." : "Watching live updates."}
            </span>
          )}
        </div>
        <div className="w-full sm:w-48 h-2 rounded-sm bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          />
        </div>
      </div>

      {/* Board directly on the page (no extra card/stage background) */}
      <div className="overflow-x-auto py-2">
        <BingoPreview
          bingo={bingo}
          canEdit={isAuthor}
          onToggleCell={onToggleCell}
          boardRef={boardRef}
          hideActions
        />
      </div>
    </div>
  );
}
