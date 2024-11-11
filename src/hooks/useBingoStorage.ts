import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { generateAuthorToken } from "@/lib/generate-token";
import type { BingoData } from "@/types/next-auth";
import { APIErrorCode } from "@/lib/errors";

interface APIErrorResponse {
    code: APIErrorCode;
    error: string;
}

export function useBingoStorage() {
    const { data: session } = useSession();
    const [authorToken, setAuthorToken] = useState<string | null>(null);

    useEffect(() => {
        // Handle user session changes
        if (session?.user) {
            // User just logged in - migrate any localStorage bingos
            const ownedBingos = JSON.parse(localStorage.getItem("ownedBingos") || "[]");
            const localAuthorToken = localStorage.getItem("bingoAuthorToken");

            if (ownedBingos.length > 0 && localAuthorToken) {
                migrateBingos(ownedBingos, localAuthorToken, session.user.id);
            }
        } else {
            // No session - handle anonymous user token
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

    const migrateBingos = async (bingoIds: string[], authorToken: string, userId: string) => {
        try {
            const response = await fetch("/api/bingo/migrate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bingoIds,
                    authorToken,
                    userId,
                }),
            });

            if (response.ok) {
                // Clear localStorage after successful migration
                localStorage.removeItem("ownedBingos");
                localStorage.removeItem("bingoAuthorToken");
            }
        } catch (error) {
            console.error("Failed to migrate bingos:", error);
        }
    };

    const saveBingo = async (bingoData: BingoData) => {
        try {
            const payload = {
                ...bingoData,
                userId: session?.user?.id || null,
                authorToken: !session?.user ? authorToken : null,
            };

            const response = await fetch("/api/bingo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const savedBingo = await response.json();

            // Store bingo ID in localStorage for anonymous users
            if (!session?.user && savedBingo.id) {
                const ownedBingos = JSON.parse(localStorage.getItem("ownedBingos") || "[]");
                if (!ownedBingos.includes(savedBingo.id)) {
                    localStorage.setItem("ownedBingos", JSON.stringify([...ownedBingos, savedBingo.id]));
                }
            }

            return savedBingo;
        } catch (error) {
            console.error("Failed to save bingo:", error);
            throw error;
        }
    };

    const getBingo = async (id: string) => {
        try {
            const response = await fetch(`/api/bingo?id=${id}`);
            if (!response.ok) {
                const errorData = (await response.json()) as APIErrorResponse;
                throw new Error(`${errorData.code}: ${errorData.error}`);
            }

            const bingo = await response.json();
            const canEdit = session?.user?.id === bingo.userId || (!session?.user && authorToken === bingo.authorToken);

            return { ...bingo, canEdit };
        } catch (error) {
            console.error("Failed to fetch bingo:", error);
            throw error;
        }
    };

    const updateBingo = async (id: string, updates: Partial<BingoData>) => {
        try {
            const response = await fetch(`/api/bingo/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...updates,
                    userId: session?.user?.id || null,
                    authorToken: !session?.user ? authorToken : null,
                }),
            });

            return await response.json();
        } catch (error) {
            console.error("Failed to update bingo:", error);
            throw error;
        }
    };

    return {
        saveBingo,
        getBingo,
        updateBingo,
        isAuthenticated: !!session?.user,
        authorToken,
    };
}
