"use client";

import React, { useState, useEffect } from "react";
import LatestBingoList from "@/components/latest-bingo-list";
import { BingoPreview, LatestBingosResponse } from "@/types/types";

export interface LatestBingosData {
  items: BingoPreview[];
  hasMore: boolean;
  nextCursor?: string;
  isLoading: boolean;
}

export function useLatestBingos(): LatestBingosData {
  const [items, setItems] = useState<BingoPreview[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchInitialBingos = async () => {
      try {
        const response = await fetch(`/api/bingo/latest?limit=6&status=published`);
        if (!response.ok) {
          throw new Error("Failed to fetch bingos");
        }
        const data: LatestBingosResponse = await response.json();
        if (!active) return;
        setItems(data.items || []);
        setHasMore(data.hasMore || false);
        setNextCursor(data.nextCursor);
      } catch (error) {
        console.error("Error fetching initial bingos:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void fetchInitialBingos();
    return () => {
      active = false;
    };
  }, []);

  return { items, hasMore, nextCursor, isLoading };
}

export const LatestBingosGrid = ({ data }: { data: LatestBingosData }) => {
  if (data.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border/60 bg-card/50 overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-muted/60" />
            <div className="p-4 flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-muted/60" />
              <div className="h-3 w-16 rounded bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <LatestBingoList
        initialBingos={data.items}
        initialHasMore={data.hasMore}
        initialCursor={data.nextCursor}
        options={{
          status: "published",
          limit: 6,
        }}
      />
    </div>
  );
};
