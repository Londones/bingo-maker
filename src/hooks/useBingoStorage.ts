import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateAuthorToken } from "@/lib/generate-token";
import type { BingoData, MigrateRequest } from "@/types/types";

interface PaginatedBingos {
    items: BingoData[];
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
}

export function useBingoStorage(): {
    authorToken: string | null;
    useGetBingo: (id: string) => ReturnType<typeof useQuery<BingoData>>;
    useGetBingos: (options?: { cursor?: string; limit?: number }) => ReturnType<typeof useQuery<PaginatedBingos>>;
    useSaveBingo: ReturnType<typeof useMutation>;
    useUpdateBingo: ReturnType<typeof useMutation>;
    useDeleteBingo: ReturnType<typeof useMutation>;
    useMigrateBingos: ReturnType<typeof useMutation>;
} {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const [authorToken, setAuthorToken] = useState<string | null>(null);

    useEffect(() => {
        if (!session?.user) {
            const stored = localStorage.getItem("bingoAuthorToken");
            if (stored) {
                setAuthorToken(stored);
            } else {
                const newToken = generateAuthorToken();
                localStorage.setItem("bingoAuthorToken", newToken);
                setAuthorToken(newToken);
            }
        }
    }, [session]);

    // Get bingos
    const useGetBingos = (options?: {
        cursor?: string;
        limit?: number;
    }): ReturnType<typeof useQuery<PaginatedBingos>> =>
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

    // Get bingo
    const useGetBingo = (id: string): ReturnType<typeof useQuery<BingoData>> =>
        useQuery<BingoData>({
            queryKey: ["bingo", id],
            queryFn: async () => {
                const res = await fetch(`/api/bingo/${id}`);
                if (!res.ok) throw new Error("Failed to fetch bingo");
                return res.json();
            },
        });

    // Save bingo
    const useSaveBingo = useMutation({
        mutationFn: (bingoData: BingoData) =>
            fetch("/api/bingo", {
                method: "POST",
                body: JSON.stringify({
                    ...bingoData,
                    authorToken: session?.user ? null : authorToken,
                }),
            }).then((res) => res.json()),
        onSuccess: (data: BingoData) => {
            await queryClient.invalidateQueries({ queryKey: ["bingos"] });
            if (!session?.user) {
                const stored = JSON.parse(localStorage.getItem("ownedBingos") || "[]") as BingoData[];
                localStorage.setItem("ownedBingos", JSON.stringify([...stored, data.id]));
            }
        },
    });

    // Update bingo
    const useUpdateBingo = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<BingoData> }) =>
            fetch(`/api/bingo/${id}`, {
                method: "PATCH",
                body: JSON.stringify(updates),
            }).then((res) => res.json()),
        onSuccess: (_, { id }) => {
            await queryClient.invalidateQueries({ queryKey: ["bingo", id] });
        },
    });

    // Delete bingo
    const useDeleteBingo = useMutation({
        mutationFn: (id: string) => fetch(`/api/bingo/${id}`, { method: "DELETE" }),
        onSuccess: (_, id) => {
            await queryClient.invalidateQueries({ queryKey: ["bingos"] });
            if (!session?.user) {
                const stored = JSON.parse(localStorage.getItem("ownedBingos") || "[]") as BingoData[];
                localStorage.setItem("ownedBingos", JSON.stringify(stored.filter((bingoId: string) => bingoId !== id)));
            }
        },
    });

    // Migration mutation
    const useMigrateBingos = useMutation({
        mutationFn: ({ bingoIds, authorToken, userId }: MigrateRequest) =>
            fetch("/api/bingo/migrate", {
                method: "POST",
                body: JSON.stringify({ bingoIds, authorToken, userId }),
            }).then((res) => res.json()),
        onSuccess: () => {
            await queryClient.invalidateQueries({ queryKey: ["bingos"] });
            localStorage.removeItem("ownedBingos");
            localStorage.removeItem("bingoAuthorToken");
        },
    });

    return {
        authorToken,
        useGetBingo,
        useGetBingos,
        useSaveBingo,
        useUpdateBingo,
        useDeleteBingo,
        useMigrateBingos,
    };
}
