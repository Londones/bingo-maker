import { useEffect, useState } from "react";
import { Suggestion } from "@/types/types";

export function useSuggestions(bingoId: string) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

    useEffect(() => {
        const eventSource = new EventSource(`/api/bingo/${bingoId}/suggestions`);

        eventSource.onmessage = (event) => {
            const newSuggestions = JSON.parse(event.data);
            setSuggestions((prev) => [...prev, ...newSuggestions]);
        };

        return () => eventSource.close();
    }, [bingoId]);

    const addSuggestion = async (content: string) => {
        await fetch(`/api/bingo/${bingoId}/suggestions`, {
            method: "POST",
            body: JSON.stringify({ content }),
        });
    };

    const updateSuggestion = async (suggestionId: string, status: string) => {
        await fetch(`/api/bingo/${bingoId}/suggestions`, {
            method: "PATCH",
            body: JSON.stringify({ suggestionId, status }),
        });
    };

    return { suggestions, addSuggestion, updateSuggestion };
}
