"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { useRouter, usePathname } from "next/navigation";
import BingoPreviewCard from "@/components/bingo-preview-card";
import { BingoPreview, LatestBingosResponse } from "@/types/types";

interface LatestBingoListProps {
  initialBingos: BingoPreview[];
  initialHasMore: boolean;
  initialCursor?: string;
  options?: {
    status?: "draft" | "published";
    limit?: number;
    updateUrl?: boolean;
  };
}

const LatestBingoList = ({ initialBingos, initialHasMore, initialCursor, options = {} }: LatestBingoListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [bingos, setBingos] = useState<BingoPreview[]>(initialBingos);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);

  // Destructure options with defaults
  const { status = "published", limit = 10, updateUrl = true } = options;

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  const fetchMoreBingos = useCallback(async () => {
    if (isLoading || !hasMore || !cursor) return;

    setIsLoading(true);
    try {
      // Build the query parameters
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("status", status);
      if (cursor) params.append("cursor", cursor);

      const response = await fetch(`/api/bingo/latest?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch latest bingos");
      }

      const data: LatestBingosResponse = await response.json();

      if (data.items.length) {
        setBingos((prev) => [...prev, ...data.items]);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);

        // Update URL if specified and cursor exists
        if (updateUrl && data.nextCursor) {
          const newParams = new URLSearchParams(window.location.search);
          newParams.set("cursor", data.nextCursor);
          if (status) newParams.set("status", status);
          router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching bingos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, cursor, limit, status, pathname, router, updateUrl]);

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      void fetchMoreBingos();
    }
  }, [inView, hasMore, isLoading, fetchMoreBingos]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bingos.map((bingo) => (
          <BingoPreviewCard key={bingo.id} bingo={bingo} type="preview" />
        ))}
      </div>

      {/* Loading indicator and intersection observer target */}
      {hasMore && (
        <div ref={ref} className="flex justify-center my-8">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          ) : (
            <div className="h-8 w-8"></div> // Invisible element to trigger intersection
          )}
        </div>
      )}

      {!isLoading && bingos.length === 0 && (
        <div className="text-center text-foreground/50 my-8">No bingos created yet, be the first!</div>
      )}
    </>
  );
};

export default LatestBingoList;
