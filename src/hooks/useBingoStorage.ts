import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateAuthorToken } from "@/lib/utils";
import type { Bingo, MigrateRequest, BingoPatch } from "@/types/types";
import { APIError } from "@/lib/errors";

interface PaginatedBingos {
  items: Bingo[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

// Create a safe localStorage accessor
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("ownedBingos");
    // Don't remove authorToken as it might be needed for future sessions
  },
};

export function useBingoStorage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [authorToken, setAuthorToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!session?.user && isClient) {
      const stored = safeLocalStorage.getItem("bingoAuthorToken");
      if (stored) {
        setAuthorToken(stored);
      } else {
        const newToken = generateAuthorToken();
        safeLocalStorage.setItem("bingoAuthorToken", newToken);
        setAuthorToken(newToken);
      }
    }
  }, [session, isClient]);

  const useGetBingos = (options?: { cursor?: string; limit?: number }) =>
    useQuery<PaginatedBingos>({
      queryKey: ["bingos", options?.cursor, options?.limit],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (options?.cursor) params.append("cursor", options.cursor);
        if (options?.limit) params.append("limit", options.limit.toString());

        const res = await fetch(`/api/bingo?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch bingos");
        return res.json();
      },
    });

  const useGetBingo = (bingoId: string) =>
    useQuery<Bingo>({
      queryKey: ["bingo", bingoId],
      queryFn: async () => {
        const res = await fetch(`/api/bingo/${bingoId}`);
        if (!res.ok) throw new Error("Failed to fetch bingo");
        return res.json();
      },
    });

  const useSaveBingo = useMutation({
    mutationFn: async (bingoData: Bingo): Promise<Bingo> => {
      const response = await fetch("/api/bingo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...bingoData,
          authorToken: session?.user ? null : authorToken,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).message as string);
      }

      return response.json() as Promise<Bingo>;
    },
    onMutate: () => {
      const previousBingos = queryClient.getQueryData<Bingo[]>(["bingos"]) ?? [];
      return { previousBingos };
    },
    onSuccess: async (data: Bingo) => {
      await queryClient.invalidateQueries({ queryKey: ["bingos"] });
      if (!session?.user) {
        const stored = JSON.parse(safeLocalStorage.getItem("ownedBingos") || "[]") as Bingo[];
        safeLocalStorage.setItem("ownedBingos", JSON.stringify([...stored, data.id]));
      }
    },
    onError: (_, __, context) => {
      if (context) {
        queryClient.setQueryData(["bingos"], context.previousBingos);
      }
    },
  });

  const useUpdateBingo = useMutation({
    mutationFn: async ({
      bingoId,
      updates,
    }: {
      bingoId: string;
      updates: Partial<Bingo> | BingoPatch;
    }): Promise<Bingo> => {
      const authorToken = safeLocalStorage.getItem("bingoAuthorToken");

      // Extract only the fields that have actually changed
      const patchData: BingoPatch = {};

      if (updates.title !== undefined) patchData.title = updates.title;
      if (updates.status !== undefined) patchData.status = updates.status;

      // Only include non-empty objects
      if (updates.style && Object.keys(updates.style).length > 0) patchData.style = updates.style;

      if (updates.background && Object.keys(updates.background).length > 0) patchData.background = updates.background;

      if (updates.stamp && Object.keys(updates.stamp).length > 0) patchData.stamp = updates.stamp;

      if (updates.cells && updates.cells.length > 0) patchData.cells = updates.cells;

      const response = await fetch(`/api/bingo/${bingoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...patchData,
          authorToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error((errorData.message as string) || "Failed to update bingo");
      }

      return response.json() as Promise<Bingo>;
    },
    onSuccess: async (data: Bingo) => {
      await queryClient.invalidateQueries({ queryKey: ["bingo", data.id] });
    },
  });

  const useDeleteBingo = useMutation({
    mutationFn: (bingoId: string) =>
      fetch(`/api/bingo/${bingoId}`, { method: "DELETE" })
        .catch((error) => {
          if (error instanceof APIError) throw new Error(error.message);
          else throw new Error("Failed to delete bingo");
        })
        .then((res) => res.json()),
    onSuccess: async (_, bingoId) => {
      await queryClient.invalidateQueries({ queryKey: ["bingos"] });
      if (!session?.user) {
        const stored = JSON.parse(safeLocalStorage.getItem("ownedBingos") || "[]") as Bingo[];
        safeLocalStorage.setItem("ownedBingos", JSON.stringify(stored.filter((bingo: Bingo) => bingo.id !== bingoId)));
      }
    },
  });

  const useMigrateBingos = useMutation({
    mutationFn: ({ bingoIds, authorToken, userId }: MigrateRequest) =>
      fetch("/api/bingo/migrate", {
        method: "POST",
        body: JSON.stringify({ bingoIds, authorToken, userId }),
      })
        .catch((error) => {
          if (error instanceof APIError) throw new Error(error.message);
          else throw new Error("Failed to migrate bingos");
        })
        .then((res) => res.json()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bingos"] });
    },
  });

  const useCheckOwnership = (bingoId: string, options = {}) => {
    return useQuery({
      queryKey: ["bingo", bingoId, "ownership"],
      queryFn: async (): Promise<{ isOwner: boolean }> => {
        if (!bingoId) return { isOwner: false };

        const authorToken = safeLocalStorage.getItem("bingoAuthorToken");
        if (!authorToken) return { isOwner: false };

        const response = await fetch(`/api/bingo/${bingoId}/check-ownership`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ authorToken }),
        });

        if (!response.ok) {
          throw new Error((await response.json()).message as string);
        }

        return response.json() as Promise<{ isOwner: boolean }>;
      },
      enabled: !!bingoId && isClient,
      staleTime: 1000 * 60 * 60,
      ...options,
    });
  };

  const clearLocalStorage = () => {
    safeLocalStorage.clear();
  };

  return {
    authorToken,
    isClient,
    userId: session?.user?.id,
    useGetBingo,
    useGetBingos,
    useSaveBingo,
    useUpdateBingo,
    useDeleteBingo,
    useMigrateBingos,
    useCheckOwnership,
    clearLocalStorage,
  };
}
