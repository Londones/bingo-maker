"use client";
import React from "react";
import { useBingoStorage } from "@/hooks/useBingoStorage";
import { BingoPreview } from "@/types/types";
import { useInView } from "react-intersection-observer";
import { useRouter, usePathname } from "next/navigation";
import BingoPreviewCard from "@/components/bingo-preview-card";
import NewBingoCard from "@/components/new-bingo-card";
import { useEditorRoutePersistence } from "@/hooks/useEditorRoutePersistence";

type UserBingoListProps = {
  initialBingos: BingoPreview[];
  initialPage: number;
  hasMore: boolean;
  userId: string;
};

const UserBingoList = ({ initialBingos, initialPage, hasMore, userId }: UserBingoListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = React.useState(initialPage);
  const [allBingos, setAllBingos] = React.useState<BingoPreview[]>(initialBingos);
  const [hasMoreBingos, setHasMoreBingos] = React.useState(hasMore);
  const { ref, inView } = useInView();
  const { loadEditorState } = useEditorRoutePersistence();
  const wipBingo = React.useMemo(() => {
    // Check if there's a bingo being edited but not yet saved (has changes but no ID)
    // Ensure this runs on client-side only to avoid hydration mismatch
    if (typeof window === "undefined") return undefined;

    const state = loadEditorState();
    if (!state) return undefined;
    if (!state.id) {
      return {
        id: "",
        title: state.title,
        background: state.background,
        createdAt: new Date(Date.now()),
      } as BingoPreview;
    }
    return undefined;
  }, [loadEditorState]);

  // Initialize React Query with our API
  const { useGetUserBingos } = useBingoStorage();

  // Use the hook to fetch more data when needed
  const { data, isFetching, isError } = useGetUserBingos(inView && hasMoreBingos, {
    page: page + 1,
    userId,
  });

  React.useEffect(() => {
    if (data) {
      setAllBingos((prev) => [...prev, ...data.bingos]);
      setPage((prev) => prev + 1);
      setHasMoreBingos(data.hasMore);
      router.push(`${pathname}?page=${page + 1}`, { scroll: false });
    }
  }, [data, inView, hasMoreBingos, page, pathname, router]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Bingo Card component - shows either a "+" card or WIP bingo */}
        <NewBingoCard wipBingo={wipBingo} />

        {allBingos.map((bingo) => (
          <BingoPreviewCard key={bingo.id} bingo={bingo} type="user" />
        ))}
      </div>

      {/* Loading indicator and intersection observer target */}
      {hasMoreBingos && (
        <div ref={ref} className="flex justify-center my-8">
          {isFetching ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          ) : (
            <div className="h-8 w-8"></div> // Invisible element to trigger intersection
          )}
        </div>
      )}

      {isError && <div className="text-red-500 text-center">Error loading more bingos. Please try again.</div>}
    </>
  );
};

export default UserBingoList;
