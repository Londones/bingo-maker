import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateAuthorToken } from "@/lib/utils";
import type { Bingo, MigrateRequest } from "@/types/types";
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
      const previousBingos =
        queryClient.getQueryData<Bingo[]>(["bingos"]) ?? [];
      return { previousBingos };
    },
    onSuccess: async (data: Bingo) => {
      await queryClient.invalidateQueries({ queryKey: ["bingos"] });
      if (!session?.user) {
        const stored = JSON.parse(
          safeLocalStorage.getItem("ownedBingos") || "[]"
        ) as Bingo[];
        safeLocalStorage.setItem(
          "ownedBingos",
          JSON.stringify([...stored, data.id])
        );
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
      updates: Partial<Bingo>;
    }): Promise<Bingo> => {
      const authorToken = safeLocalStorage.getItem("bingoAuthorToken");

      const response = await fetch(`/api/bingo/${bingoId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...updates,
          authorToken,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).message as string);
      }

      return response.json() as Promise<Bingo>;
    },
    onSuccess: async (_, { bingoId }) => {
      await queryClient.invalidateQueries({ queryKey: ["bingo", bingoId] });
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
        const stored = JSON.parse(
          safeLocalStorage.getItem("ownedBingos") || "[]"
        ) as Bingo[];
        safeLocalStorage.setItem(
          "ownedBingos",
          JSON.stringify(stored.filter((bingo: Bingo) => bingo.id !== bingoId))
        );
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

  const useCheckOwnership = (bingoId: string) => {
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
    });
  };

  return {
    authorToken,
    isClient,
    useGetBingo,
    useGetBingos,
    useSaveBingo,
    useUpdateBingo,
    useDeleteBingo,
    useMigrateBingos,
    useCheckOwnership,
  };
}
