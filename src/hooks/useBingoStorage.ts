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
        mutationFn: (bingoData: Bingo) =>
            fetch("/api/bingo", {
                method: "POST",
                body: JSON.stringify({
                    ...bingoData,
                    authorToken: session?.user ? null : authorToken,
                }),
            })
                .catch((error) => {
                    if (error instanceof APIError) throw new Error(error.message);
                    else throw new Error("Failed to save bingo");
                })

                .then((res) => res.json()),
        onMutate: () => {
            const previousBingos = queryClient.getQueryData<Bingo[]>(["bingos"]) ?? [];
            return { previousBingos };
        },
        onSuccess: async (data: Bingo) => {
            await queryClient.invalidateQueries({ queryKey: ["bingos"] });
            if (!session?.user) {
                const stored = JSON.parse(localStorage.getItem("ownedBingos") || "[]") as Bingo[];
                localStorage.setItem("ownedBingos", JSON.stringify([...stored, data.id]));
            }
        },
        onError: (_, __, context) => {
            if (context) {
                queryClient.setQueryData(["bingos"], context.previousBingos);
            }
        },
    });

    const useUpdateBingo = useMutation({
        mutationFn: ({ bingoId, updates }: { bingoId: string; updates: Partial<Bingo> }) =>
            fetch(`/api/bingo/${bingoId}`, {
                method: "PATCH",
                body: JSON.stringify(updates),
            })
                .catch((error) => {
                    if (error instanceof APIError) throw new Error(error.message);
                    else throw new Error("Failed to update bingo");
                })
                .then((res) => res.json()),
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
                const stored = JSON.parse(localStorage.getItem("ownedBingos") || "[]") as Bingo[];
                localStorage.setItem(
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
