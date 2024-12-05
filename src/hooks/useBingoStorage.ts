import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateAuthorToken } from "@/lib/utils";
import type { Bingo, MigrateRequest } from "@/types/types";

interface PaginatedBingos {
    items: Bingo[];
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
}

export function useBingoStorage() {
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
    const useGetBingo = (id: string) =>
        useQuery<Bingo>({
            queryKey: ["bingo", id],
            queryFn: async () => {
                const res = await fetch(`/api/bingo/${id}`);
                if (!res.ok) throw new Error("Failed to fetch bingo");
                return res.json();
            },
        });

    // Save bingo
    const useSaveBingo = useMutation({
        mutationFn: (bingoData: Bingo) =>
            fetch("/api/bingo", {
                method: "POST",
                body: JSON.stringify({
                    ...bingoData,
                    authorToken: session?.user ? null : authorToken,
                }),
            }).then((res) => res.json()),
        onSuccess: async (data: Bingo) => {
            await queryClient.invalidateQueries({ queryKey: ["bingos"] });
            if (!session?.user) {
                const stored = JSON.parse(localStorage.getItem("ownedBingos") || "[]") as Bingo[];
                localStorage.setItem("ownedBingos", JSON.stringify([...stored, data.id]));
            }
        },
    });

    // Update bingo
    const useUpdateBingo = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Bingo> }) =>
            fetch(`/api/bingo/${id}`, {
                method: "PATCH",
                body: JSON.stringify(updates),
            }).then((res) => res.json()),
        onSuccess: async (_, { id }) => {
            await queryClient.invalidateQueries({ queryKey: ["bingo", id] });
        },
    });

    // Delete bingo
    const useDeleteBingo = useMutation({
        mutationFn: (id: string) => fetch(`/api/bingo/${id}`, { method: "DELETE" }),
        onSuccess: async (_, id) => {
            await queryClient.invalidateQueries({ queryKey: ["bingos"] });
            if (!session?.user) {
                const stored = JSON.parse(localStorage.getItem("ownedBingos") || "[]") as Bingo[];
                localStorage.setItem("ownedBingos", JSON.stringify(stored.filter((bingo: Bingo) => bingo.id !== id)));
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
        onSuccess: async () => {
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
