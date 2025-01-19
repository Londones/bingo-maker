import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Suggestion, SuggestionPatchRequest } from "@/types/types";

export function useSuggestions(bingoId: string) {
    const queryClient = useQueryClient();

    // Fetch suggestions with polling
    const { data: suggestions = [], isLoading } = useQuery<Suggestion[]>({
        queryKey: ["suggestions", bingoId],
        queryFn: async () => {
            const res = await fetch(`/api/bingo/${bingoId}/suggestions`);
            const data = (await res.json()) as Suggestion[];
            if (!res.ok) return [];
            return data;
        },
        refetchInterval: 3000,
    });

    const useAddSuggestion = useMutation({
        mutationFn: async (content: string) => {
            const res = await fetch(`/api/bingo/${bingoId}/suggestions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            return res.json();
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["suggestions", bingoId] });
        },
    });

    const useUpdateSuggestion = useMutation({
        mutationFn: async ({ suggestionId, status, position }: SuggestionPatchRequest) => {
            const res = await fetch(`/api/bingo/${bingoId}/suggestions`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ suggestionId, status, position }),
            });
            return res.json();
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["suggestions", bingoId] });
        },
    });

    return {
        suggestions,
        isLoading,
        useAddSuggestion: useAddSuggestion.mutate,
        useUpdateSuggestion: useUpdateSuggestion.mutate,
        isAddingError: useAddSuggestion.isError,
        isUpdatingError: useUpdateSuggestion.isError,
    };
}
