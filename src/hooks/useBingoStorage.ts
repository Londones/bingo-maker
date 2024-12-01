import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateAuthorToken } from "@/lib/generate-token";
import type { BingoData } from "@/types/types";

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

    // Get bingo
    const useGetBingo = (id: string) =>
        useQuery({
            queryKey: ["bingo", id],
            queryFn: () => fetch(`/api/bingo/${id}`).then((res) => res.json()),
            enabled: !!id,
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
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["bingos"] });
            if (!session?.user) {
                const stored = JSON.parse(localStorage.getItem("ownedBingos") || "[]");
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
            queryClient.invalidateQueries({ queryKey: ["bingo", id] });
        },
    });

    // Delete bingo
    const useDeleteBingo = useMutation({
        mutationFn: (id: string) => fetch(`/api/bingo/${id}`, { method: "DELETE" }),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ["bingos"] });
            if (!session?.user) {
                const stored = JSON.parse(localStorage.getItem("ownedBingos") || "[]");
                localStorage.setItem("ownedBingos", JSON.stringify(stored.filter((bingoId: string) => bingoId !== id)));
            }
        },
    });

    // Migration mutation
    const useMigrateBingos = useMutation({
        mutationFn: ({ bingoIds, authorToken, userId }: { bingoIds: string[]; authorToken: string; userId: string }) =>
            fetch("/api/bingo/migrate", {
                method: "POST",
                body: JSON.stringify({ bingoIds, authorToken, userId }),
            }).then((res) => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bingos"] });
            localStorage.removeItem("ownedBingos");
            localStorage.removeItem("bingoAuthorToken");
        },
    });

    return {
        authorToken,
        useGetBingo,
        useSaveBingo,
        useUpdateBingo,
        useDeleteBingo,
        useMigrateBingos,
    };
}
