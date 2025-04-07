"use client";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useRouter, usePathname } from "next/navigation";
import BingoPreviewCard from "@/components/bingo-preview-card";
import { BingoPreview, BingoPreviewResponse } from "@/types/types";

type BingoCardListProps = {
  initialBingos: BingoPreview[];
  initialPage: number;
  hasMore: boolean;
  userId?: string;
  fetchMoreBingos: (page: number) => Promise<BingoPreviewResponse>;
  updateUrl?: boolean;
};

const BingoCardList = ({
  initialBingos,
  initialPage,
  hasMore: initialHasMore,
  fetchMoreBingos,
  updateUrl = true,
}: BingoCardListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [bingos, setBingos] = useState<BingoPreview[]>(initialBingos);
  const [isLoading, setIsLoading] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  const loadMoreBingos = React.useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const nextPage = page + 1;

    try {
      const response = await fetchMoreBingos(nextPage);

      if (response.bingos?.length) {
        setBingos((prev) => [...prev, ...response.bingos]);
        setPage(nextPage);
        setHasMore(response.hasMore);

        // Only update URL if specified
        if (updateUrl) {
          router.push(`${pathname}?page=${nextPage}`, { scroll: false });
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching bingos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, fetchMoreBingos, pathname, router, updateUrl]);

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      void loadMoreBingos();
    }
  }, [inView, hasMore, isLoading, loadMoreBingos]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bingos.map((bingo) => (
          <BingoPreviewCard key={bingo.id} bingo={bingo} />
        ))}
      </div>

      {/* Loading indicator and intersection observer target */}
      {hasMore && (
        <div ref={ref} className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </>
  );
};

export default BingoCardList;
